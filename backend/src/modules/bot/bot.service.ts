import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Employee, UserRole } from "@prisma/client";
import { appConfig } from "../../infrastructure/config/app-config";
import { appLogger } from "../../common/logging/app-logger";
import { EmployeeService } from "../employee/employee.service";
import { EvaluationService, KPI_REFILL_WINDOW_MINUTES } from "../evaluation/evaluation.service";
import { KPI_SCORE_OPTIONS } from "../evaluation/kpi-questions";
import { ReportService } from "../report/report.service";
import { SurveyService } from "../survey/survey.service";
import { Context, Input, Markup, Telegraf } from "telegraf";

type ProfileDraftMode = "REGISTER" | "EDIT";

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  private bot: Telegraf<Context> | null = null;
  private readonly callbackActionLocks = new Set<string>();
  private readonly registrationDrafts = new Map<
    string,
    {
      mode: ProfileDraftMode;
      fullName?: string;
      step: "FULL_NAME" | "DEPARTMENT";
    }
  >();
  private readonly fillKpiButtonText = "Заполнить KPI";
  private readonly registrationButtonText = "Регистрация";
  private readonly editProfileButtonText = "Редактировать профиль";
  private readonly refillQuestionnaireButtonText = "Перезаполнить анкету";

  constructor(
    private readonly employeeService: EmployeeService,
    private readonly surveyService: SurveyService,
    private readonly evaluationService: EvaluationService,
    private readonly reportService: ReportService
  ) {}

  async onModuleInit(): Promise<void> {
    this.bot = new Telegraf<Context>(appConfig.telegramBotToken);
    this.registerHandlers(this.bot);
    this.bot
      .launch()
      .then(() => {
        appLogger.info("telegram_bot_started");
      })
      .catch((error) => {
        appLogger.error("telegram_bot_start_failed", {
          message: error instanceof Error ? error.message : String(error)
        });
      });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.bot) {
      this.bot.stop("shutdown");
    }
  }

  private registerHandlers(bot: Telegraf<Context>): void {
    bot.command("start", async (ctx) => {
      const telegramId = this.getTelegramId(ctx);
      if (!telegramId) {
        return;
      }

      const employee = await this.employeeService.getByTelegramId(telegramId);
      if (employee) {
        await ctx.reply(
          `Вы уже зарегистрированы: ${employee.fullName} (${employee.department}).\n` +
            "Используйте кнопки «Заполнить KPI» или «Редактировать профиль».",
          this.mainMenuMarkup(true)
        );
        return;
      }

      this.registrationDrafts.set(telegramId, { mode: "REGISTER", step: "FULL_NAME" });
      await ctx.reply("Введите ваше ФИО:", this.mainMenuMarkup(false));
    });

    bot.command("fill_kpi", async (ctx) => {
      const telegramId = this.getTelegramId(ctx);
      if (!telegramId) {
        return;
      }

      const employee = await this.employeeService.getByTelegramId(telegramId);
      if (!employee) {
        await ctx.reply("Сначала зарегистрируйтесь через кнопку «Регистрация».", this.mainMenuMarkup(false));
        return;
      }

      const activeCampaign = await this.surveyService.getActiveCampaign();
      if (!activeCampaign) {
        await ctx.reply("Заполнение KPI еще не началось. Ожидайте запуск кампании руководителем.");
        return;
      }

      await this.sendNextQuestion(activeCampaign.id, employee);
    });

    bot.command("start_kpi", async (ctx) => {
      const telegramId = this.getTelegramId(ctx);
      if (!telegramId || !this.isLead(telegramId)) {
        await ctx.reply("Команда доступна только руководителю.");
        return;
      }

      try {
        await this.evaluationService.ensureDefaultQuestions();
        const monthKey = "text" in ctx.message ? ctx.message.text.trim().split(/\s+/)[1] : undefined;
        const campaign = await this.surveyService.startCampaign(telegramId, monthKey);
        const employees = (await this.employeeService.getAllEmployees()).filter(
          (employee) => employee.role === UserRole.EMPLOYEE
        );
        await this.surveyService.syncParticipants(
          campaign.id,
          employees.map((employee) => employee.id)
        );

        for (const employee of employees) {
          await this.sendKpiInvitation(campaign.id, employee);
        }

        await ctx.reply(
          `KPI-кампания за ${campaign.assessmentMonth} запущена.\n` +
            `Участников: ${employees.length}\n` +
            "Сотрудникам отправлены анкеты."
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Не удалось запустить KPI-кампанию.";
        await ctx.reply(message);
      }
    });

    bot.command("close_kpi", async (ctx) => {
      const telegramId = this.getTelegramId(ctx);
      if (!telegramId || !this.isLead(telegramId)) {
        await ctx.reply("Команда доступна только руководителю.");
        return;
      }

      try {
        const campaign = await this.surveyService.closeActiveCampaign();
        await ctx.reply(`KPI-кампания закрыта: ${campaign.title}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Не удалось закрыть KPI-кампанию.";
        await ctx.reply(message);
      }
    });

    bot.command("generate_reports", async (ctx) => {
      const telegramId = this.getTelegramId(ctx);
      if (!telegramId || !this.isLead(telegramId)) {
        await ctx.reply("Команда доступна только руководителю.");
        return;
      }

      const campaign = await this.surveyService.getLatestClosedCampaignWithoutReport();
      if (!campaign) {
        await ctx.reply("Нет закрытой KPI-кампании для генерации отчётов.");
        return;
      }

      const reports = await this.reportService.generateCampaignReports(campaign.id);
      await this.surveyService.markReportGenerated(campaign.id);

      const leadChatId = this.getChatId(ctx);
      if (!leadChatId) {
        await ctx.reply("Не удалось определить чат руководителя для отправки отчётов.");
        return;
      }

      await ctx.reply("Отчёты сформированы. Отправляю файлы...");
      await ctx.telegram.sendDocument(leadChatId, Input.fromLocalFile(reports.summaryFilePath));
      for (const employeeFile of reports.employeeFiles) {
        await ctx.telegram.sendDocument(leadChatId, Input.fromLocalFile(employeeFile.filePath));
      }

      await ctx.reply("Готово: summary + персональные KPI-отчёты отправлены.");
    });

    bot.on("callback_query", async (ctx) => {
      const data = "data" in ctx.callbackQuery ? ctx.callbackQuery.data : "";
      if (typeof data !== "string") {
        return;
      }

      if (data.startsWith("refill:")) {
        const telegramId = this.getTelegramId(ctx);
        if (!telegramId) {
          return;
        }

        const lockKey = `callback:${telegramId}:${data}`;
        if (!this.beginCallbackAction(lockKey)) {
          await ctx.answerCbQuery("Запрос уже обрабатывается.");
          return;
        }

        const employee = await this.employeeService.getByTelegramId(telegramId);
        if (!employee) {
          this.endCallbackAction(lockKey);
          await ctx.answerCbQuery("Сначала зарегистрируйтесь через /start.");
          return;
        }

        const [, campaignIdFromButton] = data.split(":");
        if (!campaignIdFromButton) {
          this.endCallbackAction(lockKey);
          await ctx.answerCbQuery("Некорректный запрос перезаполнения.");
          return;
        }

        const activeCampaign = await this.surveyService.getActiveCampaign();
        if (!activeCampaign || activeCampaign.id !== campaignIdFromButton) {
          this.endCallbackAction(lockKey);
          await ctx.answerCbQuery("Опрос уже закрыт.");
          return;
        }

        try {
          await this.hideCallbackButtons(ctx);
          await ctx.answerCbQuery("Перезаполняю анкету...");
          await this.evaluationService.restartQuestionnaire(activeCampaign.id, employee.id);
          await this.sendNextQuestion(activeCampaign.id, employee);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Не удалось перезаполнить анкету.";
          await ctx.reply(message);
          await this.sendNextQuestion(activeCampaign.id, employee);
        } finally {
          this.endCallbackAction(lockKey);
        }
        return;
      }

      if (!data.startsWith("ans:")) {
        return;
      }

      const telegramId = this.getTelegramId(ctx);
      if (!telegramId) {
        return;
      }

      const lockKey = `callback:${telegramId}:${data}`;
      if (!this.beginCallbackAction(lockKey)) {
        await ctx.answerCbQuery("Ответ уже обрабатывается.");
        return;
      }

      const employee = await this.employeeService.getByTelegramId(telegramId);
      if (!employee) {
        this.endCallbackAction(lockKey);
        await ctx.answerCbQuery("Сначала зарегистрируйтесь через /start.");
        return;
      }

      const activeCampaign = await this.surveyService.getActiveCampaign();
      if (!activeCampaign) {
        this.endCallbackAction(lockKey);
        await ctx.answerCbQuery("Опрос уже закрыт.");
        return;
      }

      const [, questionId, scoreRaw] = data.split(":");
      const score = Number.parseInt(scoreRaw, 10);

      try {
        await this.hideCallbackButtons(ctx);
        await ctx.answerCbQuery("Сохраняю ответ...");
        await this.evaluationService.saveAnswer(activeCampaign.id, employee.id, questionId, score);
        await this.sendNextQuestion(activeCampaign.id, employee);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Не удалось сохранить ответ.";
        await ctx.reply(message);
        await this.sendNextQuestion(activeCampaign.id, employee);
      } finally {
        this.endCallbackAction(lockKey);
      }
    });

    bot.on("text", async (ctx) => {
      const telegramId = this.getTelegramId(ctx);
      if (!telegramId) {
        return;
      }

      const text = ctx.message.text?.trim() ?? "";

      if (!text.startsWith("/") && text === this.fillKpiButtonText) {
        await this.handleFillKpiFromMenu(ctx, telegramId);
        return;
      }

      if (!text.startsWith("/") && text === this.registrationButtonText) {
        await this.handleRegistrationFromMenu(ctx, telegramId);
        return;
      }

      if (!text.startsWith("/") && text === this.editProfileButtonText) {
        await this.handleEditProfileFromMenu(ctx, telegramId);
        return;
      }

      const registrationDraft = this.registrationDrafts.get(telegramId);
      if (registrationDraft) {
        await this.handleRegistrationStep(ctx, telegramId, text, registrationDraft);
        return;
      }

      if (!text.startsWith("/")) {
        const employee = await this.employeeService.getByTelegramId(telegramId);
        if (!employee) {
          this.registrationDrafts.set(telegramId, { mode: "REGISTER", step: "FULL_NAME" });
          await ctx.reply("Сначала зарегистрируйтесь. Введите ваше ФИО:", this.mainMenuMarkup(false));
          return;
        }

        await ctx.reply(
          "Используйте кнопки меню «Заполнить KPI» или «Редактировать профиль».",
          this.mainMenuMarkup(true)
        );
        return;
      }
    });
  }

  private async sendKpiInvitation(campaignId: string, employee: Employee): Promise<void> {
    if (!this.bot) {
      return;
    }

    const chatId = Number(employee.telegramId);
    try {
      await this.bot.telegram.sendMessage(chatId, "Открыта KPI-кампания. Начинаем анкету.");
      await this.sendNextQuestion(campaignId, employee);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      appLogger.warn("telegram_send_invite_failed", {
        employeeId: employee.id,
        telegramId: employee.telegramId,
        message
      });
    }
  }

  private async sendNextQuestion(campaignId: string, employee: Employee): Promise<void> {
    if (!this.bot) {
      return;
    }

    const nextQuestion = await this.evaluationService.getNextQuestion(campaignId, employee.id);
    const chatId = Number(employee.telegramId);

    if (!nextQuestion) {
      const refillDeadline = await this.evaluationService.getRefillDeadline(campaignId, employee.id);
      if (refillDeadline) {
        await this.bot.telegram.sendMessage(
          chatId,
          `Анкета завершена. Если нужно исправить ответы, можно перезаполнить в течение ${KPI_REFILL_WINDOW_MINUTES} минут.`,
          Markup.inlineKeyboard([
            [Markup.button.callback(this.refillQuestionnaireButtonText, `refill:${campaignId}`)]
          ])
        );
        return;
      }

      await this.bot.telegram.sendMessage(chatId, "Анкета завершена. Спасибо за ответы.");
      return;
    }

    const options = KPI_SCORE_OPTIONS.map((score) => Markup.button.callback(this.scoreLabel(score), `ans:${nextQuestion.id}:${score}`));

    await this.bot.telegram.sendMessage(
      chatId,
      `KPI вопрос ${nextQuestion.sortOrder}/5\n${nextQuestion.text}\nВыберите оценку:`,
      Markup.inlineKeyboard([options.slice(0, 3), options.slice(3)])
    );
  }

  private scoreLabel(score: number): string {
    return score === 0 ? "60 or less" : `${score}%`;
  }

  private mainMenuMarkup(isRegistered: boolean) {
    if (!isRegistered) {
      return Markup.keyboard([[this.registrationButtonText]]).resize();
    }

    return Markup.keyboard([[this.fillKpiButtonText], [this.editProfileButtonText]]).resize();
  }

  private async handleRegistrationFromMenu(ctx: Context, telegramId: string): Promise<void> {
    const employee = await this.employeeService.getByTelegramId(telegramId);
    if (employee) {
      await ctx.reply(
        `Вы уже зарегистрированы: ${employee.fullName} (${employee.department}).\n` +
          "Используйте кнопки «Заполнить KPI» или «Редактировать профиль».",
        this.mainMenuMarkup(true)
      );
      return;
    }

    this.registrationDrafts.set(telegramId, { mode: "REGISTER", step: "FULL_NAME" });
    await ctx.reply("Введите ваше ФИО:", this.mainMenuMarkup(false));
  }

  private async handleEditProfileFromMenu(ctx: Context, telegramId: string): Promise<void> {
    const employee = await this.employeeService.getByTelegramId(telegramId);
    if (!employee) {
      this.registrationDrafts.set(telegramId, { mode: "REGISTER", step: "FULL_NAME" });
      await ctx.reply("Сначала зарегистрируйтесь. Введите ваше ФИО:", this.mainMenuMarkup(false));
      return;
    }

    this.registrationDrafts.set(telegramId, { mode: "EDIT", step: "FULL_NAME" });
    await ctx.reply(
      `Текущий профиль: ${employee.fullName} (${employee.department}).\n` + "Введите новое ФИО:",
      this.mainMenuMarkup(true)
    );
  }

  private async handleFillKpiFromMenu(ctx: Context, telegramId: string): Promise<void> {
    const employee = await this.employeeService.getByTelegramId(telegramId);
    if (!employee) {
      this.registrationDrafts.set(telegramId, { mode: "REGISTER", step: "FULL_NAME" });
      await ctx.reply("Сначала зарегистрируйтесь. Введите ваше ФИО:", this.mainMenuMarkup(false));
      return;
    }

    const activeCampaign = await this.surveyService.getActiveCampaign();
    if (!activeCampaign) {
      await ctx.reply("Заполнение KPI еще не началось. Ожидайте запуск кампании руководителем.", this.mainMenuMarkup(true));
      return;
    }

    await this.sendNextQuestion(activeCampaign.id, employee);
  }

  private async handleRegistrationStep(
    ctx: Context,
    telegramId: string,
    text: string,
    registrationDraft: {
      mode: ProfileDraftMode;
      fullName?: string;
      step: "FULL_NAME" | "DEPARTMENT";
    }
  ): Promise<void> {
    if (registrationDraft.step === "FULL_NAME") {
      const fullName = text.trim();
      if (!fullName) {
        await ctx.reply(
          "ФИО не должно быть пустым. Введите ваше ФИО:",
          this.mainMenuMarkup(registrationDraft.mode === "EDIT")
        );
        return;
      }
      this.registrationDrafts.set(telegramId, { mode: registrationDraft.mode, step: "DEPARTMENT", fullName });
      await ctx.reply("Введите ваш отдел:", this.mainMenuMarkup(registrationDraft.mode === "EDIT"));
      return;
    }

    const department = text.trim();
    if (!department) {
      await ctx.reply(
        "Отдел не должен быть пустым. Введите ваш отдел:",
        this.mainMenuMarkup(registrationDraft.mode === "EDIT")
      );
      return;
    }

    const fullName = registrationDraft.fullName?.trim() ?? "";
    if (!fullName) {
      this.registrationDrafts.set(telegramId, { mode: registrationDraft.mode, step: "FULL_NAME" });
      await ctx.reply(
        "Сессия регистрации сброшена. Введите ваше ФИО:",
        this.mainMenuMarkup(registrationDraft.mode === "EDIT")
      );
      return;
    }

    const employee = await this.employeeService.registerEmployee(telegramId, fullName, department);
    this.registrationDrafts.delete(telegramId);

    const successPrefix =
      registrationDraft.mode === "EDIT" ? "Профиль обновлён" : "Регистрация завершена";
    await ctx.reply(`${successPrefix}: ${employee.fullName} (${employee.department}).`, this.mainMenuMarkup(true));

    const activeCampaign = await this.surveyService.getActiveCampaign();
    if (activeCampaign && employee.role === UserRole.EMPLOYEE) {
      await this.surveyService.syncParticipants(activeCampaign.id, [employee.id]);
    }
  }

  private getTelegramId(ctx: Context): string | null {
    const raw = ctx.from?.id;
    if (raw === undefined || raw === null) {
      return null;
    }

    return String(raw);
  }

  private getChatId(ctx: Context): number | null {
    const raw = ctx.chat?.id;
    if (raw === undefined || raw === null) {
      return null;
    }

    return raw;
  }

  private isLead(telegramId: string): boolean {
    return telegramId === appConfig.leadTelegramId;
  }

  private beginCallbackAction(lockKey: string): boolean {
    if (this.callbackActionLocks.has(lockKey)) {
      return false;
    }
    this.callbackActionLocks.add(lockKey);
    return true;
  }

  private endCallbackAction(lockKey: string): void {
    this.callbackActionLocks.delete(lockKey);
  }

  private async hideCallbackButtons(ctx: Context): Promise<void> {
    try {
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    } catch {
      // no-op: reply markup could already be removed or message could be unavailable
    }
  }
}
