import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Employee, UserRole } from "@prisma/client";
import { appConfig } from "../../infrastructure/config/app-config";
import { appLogger } from "../../common/logging/app-logger";
import { EmployeeService } from "../employee/employee.service";
import { EvaluationService } from "../evaluation/evaluation.service";
import { KPI_SCORE_OPTIONS } from "../evaluation/kpi-questions";
import { ReportService } from "../report/report.service";
import { SurveyService } from "../survey/survey.service";
import { Context, Input, Markup, Telegraf } from "telegraf";

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  private bot: Telegraf<Context> | null = null;
  private readonly awaitingRegistration = new Set<string>();

  constructor(
    private readonly employeeService: EmployeeService,
    private readonly surveyService: SurveyService,
    private readonly evaluationService: EvaluationService,
    private readonly reportService: ReportService
  ) {}

  async onModuleInit(): Promise<void> {
    this.bot = new Telegraf<Context>(appConfig.telegramBotToken);
    this.registerHandlers(this.bot);
    await this.bot.launch();
    appLogger.info("telegram_bot_started");
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
            "Для прохождения активного опроса используйте /fill_kpi."
        );
        return;
      }

      this.awaitingRegistration.add(telegramId);
      await ctx.reply("Введите ФИО и отдел в формате:\nФИО | Отдел");
    });

    bot.command("fill_kpi", async (ctx) => {
      const telegramId = this.getTelegramId(ctx);
      if (!telegramId) {
        return;
      }

      const employee = await this.employeeService.getByTelegramId(telegramId);
      if (!employee) {
        await ctx.reply("Сначала зарегистрируйтесь через /start.");
        return;
      }

      const activeCampaign = await this.surveyService.getActiveCampaign();
      if (!activeCampaign) {
        await ctx.reply("Сейчас нет активной KPI-кампании.");
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
        const campaign = await this.surveyService.startCampaign(telegramId);
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
          `KPI-кампания запущена.\n` +
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
      if (typeof data !== "string" || !data.startsWith("ans:")) {
        return;
      }

      const telegramId = this.getTelegramId(ctx);
      if (!telegramId) {
        return;
      }

      const employee = await this.employeeService.getByTelegramId(telegramId);
      if (!employee) {
        await ctx.answerCbQuery("Сначала зарегистрируйтесь через /start.");
        return;
      }

      const activeCampaign = await this.surveyService.getActiveCampaign();
      if (!activeCampaign) {
        await ctx.answerCbQuery("Опрос уже закрыт.");
        return;
      }

      const [, questionId, scoreRaw] = data.split(":");
      const score = Number.parseInt(scoreRaw, 10);

      try {
        await this.evaluationService.saveAnswer(activeCampaign.id, employee.id, questionId, score);
        await ctx.answerCbQuery(`Ответ сохранён: ${score}%`);
        await this.sendNextQuestion(activeCampaign.id, employee);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Не удалось сохранить ответ.";
        await ctx.answerCbQuery(message);
      }
    });

    bot.on("text", async (ctx) => {
      const telegramId = this.getTelegramId(ctx);
      if (!telegramId) {
        return;
      }

      const text = ctx.message.text?.trim() ?? "";
      if (!this.awaitingRegistration.has(telegramId)) {
        if (!text.startsWith("/")) {
          await ctx.reply("Используйте /fill_kpi для прохождения опроса или /start для регистрации.");
        }
        return;
      }

      const registration = this.parseRegistrationInput(text);
      if (!registration) {
        await ctx.reply("Неверный формат. Введите:\nФИО | Отдел");
        return;
      }

      const employee = await this.employeeService.registerEmployee(
        telegramId,
        registration.fullName,
        registration.department
      );
      this.awaitingRegistration.delete(telegramId);

      await ctx.reply(`Регистрация завершена: ${employee.fullName} (${employee.department}).`);

      const activeCampaign = await this.surveyService.getActiveCampaign();
      if (activeCampaign && employee.role === UserRole.EMPLOYEE) {
        await this.surveyService.syncParticipants(activeCampaign.id, [employee.id]);
        await this.sendKpiInvitation(activeCampaign.id, employee);
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
      await this.bot.telegram.sendMessage(chatId, "Анкета завершена. Спасибо за ответы.");
      return;
    }

    const options = KPI_SCORE_OPTIONS.map((score) =>
      Markup.button.callback(`${score}%`, `ans:${nextQuestion.id}:${score}`)
    );

    await this.bot.telegram.sendMessage(
      chatId,
      `KPI вопрос ${nextQuestion.sortOrder}/5\n${nextQuestion.text}\nВыберите оценку:`,
      Markup.inlineKeyboard([options.slice(0, 3), options.slice(3)])
    );
  }

  private parseRegistrationInput(text: string): { fullName: string; department: string } | null {
    const separatorIndex = text.indexOf("|");
    if (separatorIndex === -1) {
      return null;
    }

    const fullName = text.slice(0, separatorIndex).trim();
    const department = text.slice(separatorIndex + 1).trim();
    if (!fullName || !department) {
      return null;
    }

    return { fullName, department };
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
}
