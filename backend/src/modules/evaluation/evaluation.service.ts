import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { EvaluationResponse, KpiQuestion } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { SurveyService } from "../survey/survey.service";
import { KPI_QUESTION_TEMPLATES, KPI_SCORE_OPTIONS, KpiScore } from "./kpi-questions";

export const KPI_REFILL_WINDOW_MINUTES = 10;
const KPI_REFILL_WINDOW_MS = KPI_REFILL_WINDOW_MINUTES * 60_000;

export interface ResponseWithQuestion extends EvaluationResponse {
  readonly question: KpiQuestion;
}

@Injectable()
export class EvaluationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly surveyService: SurveyService
  ) {}

  async ensureDefaultQuestions(): Promise<void> {
    await this.prisma.$transaction(
      KPI_QUESTION_TEMPLATES.map((question) =>
        this.prisma.kpiQuestion.upsert({
          where: { code: question.code },
          create: {
            code: question.code,
            section: question.section,
            text: question.text,
            weightPercent: question.weightPercent,
            sortOrder: question.sortOrder,
            isActive: true
          },
          update: {
            section: question.section,
            text: question.text,
            weightPercent: question.weightPercent,
            sortOrder: question.sortOrder,
            isActive: true
          }
        })
      )
    );
  }

  async getQuestions(): Promise<KpiQuestion[]> {
    return this.prisma.kpiQuestion.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" }
    });
  }

  async getQuestionById(questionId: string): Promise<KpiQuestion> {
    const question = await this.prisma.kpiQuestion.findUnique({
      where: { id: questionId }
    });

    if (!question || !question.isActive) {
      throw new NotFoundException("KPI-вопрос не найден.");
    }

    return question;
  }

  async getNextQuestion(campaignId: string, employeeId: string): Promise<KpiQuestion | null> {
    const questions = await this.getQuestions();
    const responses = await this.prisma.evaluationResponse.findMany({
      where: {
        campaignId,
        employeeId
      },
      select: {
        questionId: true
      }
    });
    const answeredQuestionIds = new Set(responses.map((item) => item.questionId));

    return questions.find((question) => !answeredQuestionIds.has(question.id)) ?? null;
  }

  async saveAnswer(campaignId: string, employeeId: string, questionId: string, score: number): Promise<EvaluationResponse> {
    const participant = await this.prisma.campaignParticipant.findUnique({
      where: {
        campaignId_employeeId: {
          campaignId,
          employeeId
        }
      },
      select: {
        completedAt: true
      }
    });
    const refillDeadline = this.resolveRefillDeadline(participant?.completedAt ?? null);
    if (participant?.completedAt) {
      if (refillDeadline) {
        throw new BadRequestException(
          `Анкета уже завершена. Нажмите «Перезаполнить анкету», пока не прошло ${KPI_REFILL_WINDOW_MINUTES} минут.`
        );
      }
      throw new BadRequestException(
        `Время изменения ответов истекло. Перезаполнение доступно только ${KPI_REFILL_WINDOW_MINUTES} минут после завершения.`
      );
    }

    if (!KPI_SCORE_OPTIONS.includes(score as KpiScore)) {
      throw new BadRequestException("Недопустимая оценка. Разрешены: 100, 90, 80, 70, 60 or less.");
    }

    await this.getQuestionById(questionId);

    const response = await this.prisma.evaluationResponse.upsert({
      where: {
        campaignId_employeeId_questionId: {
          campaignId,
          employeeId,
          questionId
        }
      },
      create: {
        campaignId,
        employeeId,
        questionId,
        score
      },
      update: {
        score
      }
    });

    const nextQuestion = await this.getNextQuestion(campaignId, employeeId);
    if (!nextQuestion) {
      await this.surveyService.markParticipantCompleted(campaignId, employeeId);
    }

    return response;
  }

  async getRefillDeadline(campaignId: string, employeeId: string): Promise<Date | null> {
    const participant = await this.prisma.campaignParticipant.findUnique({
      where: {
        campaignId_employeeId: {
          campaignId,
          employeeId
        }
      },
      select: {
        completedAt: true
      }
    });

    return this.resolveRefillDeadline(participant?.completedAt ?? null);
  }

  async restartQuestionnaire(campaignId: string, employeeId: string): Promise<void> {
    const participant = await this.prisma.campaignParticipant.findUnique({
      where: {
        campaignId_employeeId: {
          campaignId,
          employeeId
        }
      },
      select: {
        completedAt: true
      }
    });

    if (!participant?.completedAt) {
      throw new BadRequestException("Анкета еще не завершена.");
    }

    const refillDeadline = this.resolveRefillDeadline(participant.completedAt);
    if (!refillDeadline) {
      throw new BadRequestException(
        `Перезаполнение доступно только в течение ${KPI_REFILL_WINDOW_MINUTES} минут после завершения анкеты.`
      );
    }

    await this.prisma.$transaction([
      this.prisma.evaluationResponse.deleteMany({
        where: {
          campaignId,
          employeeId
        }
      }),
      this.prisma.campaignParticipant.upsert({
        where: {
          campaignId_employeeId: {
            campaignId,
            employeeId
          }
        },
        create: {
          campaignId,
          employeeId,
          completedAt: null
        },
        update: {
          completedAt: null
        }
      })
    ]);
  }

  async getEmployeeResponses(campaignId: string, employeeId: string): Promise<ResponseWithQuestion[]> {
    const responses = await this.prisma.evaluationResponse.findMany({
      where: {
        campaignId,
        employeeId
      },
      include: {
        question: true
      }
    });

    return responses.sort((a, b) => a.question.sortOrder - b.question.sortOrder);
  }

  async getCampaignResponses(campaignId: string): Promise<ResponseWithQuestion[]> {
    const responses = await this.prisma.evaluationResponse.findMany({
      where: { campaignId },
      include: {
        question: true
      }
    });

    return responses.sort((a, b) => a.question.sortOrder - b.question.sortOrder);
  }

  private resolveRefillDeadline(completedAt: Date | null): Date | null {
    if (!completedAt) {
      return null;
    }

    const deadline = new Date(completedAt.getTime() + KPI_REFILL_WINDOW_MS);
    if (deadline.getTime() <= Date.now()) {
      return null;
    }

    return deadline;
  }
}
