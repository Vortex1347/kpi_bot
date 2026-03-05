import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Campaign, CampaignStatus, Employee, KpiQuestion, UserRole } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { EmployeeService } from "../employee/employee.service";
import { EvaluationService } from "../evaluation/evaluation.service";
import { ReportService } from "../report/report.service";
import { SurveyService } from "../survey/survey.service";

export interface CampaignResultQuestion {
  readonly id: string;
  readonly code: string;
  readonly label: string;
  readonly text: string;
  readonly section: string;
  readonly weightPercent: number;
  readonly sortOrder: number;
}

export interface CampaignResultAnswer {
  readonly questionId: string;
  readonly questionCode: string;
  readonly questionLabel: string;
  readonly score: number | null;
}

export interface CampaignResultRow {
  readonly employeeId: string;
  readonly employeeName: string;
  readonly department: string;
  readonly answeredCount: number;
  readonly isCompleted: boolean;
  readonly completedAt: string | null;
  readonly section1Percent: number;
  readonly section2Percent: number;
  readonly totalPercent: number;
  readonly answers: readonly CampaignResultAnswer[];
}

export interface CampaignResultCampaign {
  readonly id: string;
  readonly title: string;
  readonly assessmentMonth: string;
  readonly status: CampaignStatus;
  readonly startedAt: string | null;
  readonly closedAt: string | null;
  readonly createdAt: string;
}

export interface CampaignResultsView {
  readonly campaign: CampaignResultCampaign | null;
  readonly questions: readonly CampaignResultQuestion[];
  readonly rows: readonly CampaignResultRow[];
}

export interface MonthlyKpiCampaignStat {
  readonly monthKey: string;
  readonly monthLabel: string;
  readonly campaignId: string;
  readonly campaignTitle: string;
  readonly campaignStatus: CampaignStatus;
  readonly participants: number;
  readonly completedParticipants: number;
  readonly averageKpi: number;
}

export interface MonthlyKpiEmployeeValue {
  readonly monthKey: string;
  readonly campaignId: string;
  readonly kpi: number | null;
}

export interface MonthlyKpiEmployeeStat {
  readonly employeeId: string;
  readonly employeeName: string;
  readonly department: string;
  readonly averageKpi: number | null;
  readonly trendDelta: number | null;
  readonly values: readonly MonthlyKpiEmployeeValue[];
}

export interface MonthlyKpiStatisticsView {
  readonly months: readonly MonthlyKpiCampaignStat[];
  readonly employees: readonly MonthlyKpiEmployeeStat[];
}

export interface StartCampaignActionResult {
  readonly ok: true;
  readonly message: string;
  readonly campaign: CampaignResultCampaign;
  readonly participants: number;
}

export interface CloseCampaignActionResult {
  readonly ok: true;
  readonly message: string;
  readonly campaign: CampaignResultCampaign;
}

export interface ExportExcelActionResult {
  readonly ok: true;
  readonly message: string;
  readonly campaign: CampaignResultCampaign;
  readonly summaryFilePath: string;
  readonly employeeFiles: readonly {
    readonly employeeId: string;
    readonly employeeName: string;
    readonly filePath: string;
  }[];
}

interface CampaignResultData {
  readonly questions: readonly CampaignResultQuestion[];
  readonly rows: readonly CampaignResultRow[];
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function formatQuestionLabel(sortOrder: number): string {
  return `Q${sortOrder}`;
}

function normalizeMonthsLimit(rawMonths?: number): number {
  if (rawMonths === undefined) return 12;
  if (!Number.isInteger(rawMonths) || rawMonths < 1 || rawMonths > 36) {
    throw new BadRequestException("Параметр months должен быть целым числом от 1 до 36.");
  }
  return rawMonths;
}

function resolveConfiguredLeadTelegramId(): string {
  const value = process.env.LEAD_TELEGRAM_ID?.trim();
  if (!value) {
    throw new BadRequestException("LEAD_TELEGRAM_ID не настроен на сервере.");
  }
  return value;
}

@Injectable()
export class ResultsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employeeService: EmployeeService,
    private readonly surveyService: SurveyService,
    private readonly evaluationService: EvaluationService,
    private readonly reportService: ReportService
  ) {}

  async startCampaignFromWeb(monthKey?: string): Promise<StartCampaignActionResult> {
    const leadTelegramId = resolveConfiguredLeadTelegramId();

    await this.evaluationService.ensureDefaultQuestions();
    const campaign = await this.surveyService.startCampaign(leadTelegramId, monthKey);

    const employees = (await this.employeeService.getAllEmployees()).filter((employee) => employee.role === UserRole.EMPLOYEE);
    await this.surveyService.syncParticipants(
      campaign.id,
      employees.map((employee) => employee.id)
    );

    return {
      ok: true,
      message: `KPI-кампания за ${campaign.assessmentMonth} запущена. Участников: ${employees.length}.`,
      campaign: this.toCampaignView(campaign),
      participants: employees.length
    };
  }

  async closeCampaignFromWeb(): Promise<CloseCampaignActionResult> {
    const campaign = await this.surveyService.closeActiveCampaign();
    return {
      ok: true,
      message: `KPI-кампания закрыта: ${campaign.title}.`,
      campaign: this.toCampaignView(campaign)
    };
  }

  async exportExcelFromWeb(campaignId?: string): Promise<ExportExcelActionResult> {
    const campaign = await this.resolveCampaign(campaignId);
    if (!campaign) {
      throw new NotFoundException("KPI-кампания не найдена.");
    }

    const reports = await this.reportService.generateCampaignReports(campaign.id);
    const campaignAfterExport =
      campaign.status === CampaignStatus.CLOSED ? await this.surveyService.markReportGenerated(campaign.id) : campaign;

    return {
      ok: true,
      message: "Excel-отчеты сформированы.",
      campaign: this.toCampaignView(campaignAfterExport),
      summaryFilePath: reports.summaryFilePath,
      employeeFiles: reports.employeeFiles
    };
  }

  async getCampaignResults(campaignId?: string): Promise<CampaignResultsView> {
    const campaign = await this.resolveCampaign(campaignId);
    if (!campaign) {
      return {
        campaign: null,
        questions: [],
        rows: []
      };
    }

    const result = await this.buildCampaignResultData(campaign.id);

    return {
      campaign: this.toCampaignView(campaign),
      questions: result.questions,
      rows: result.rows
    };
  }

  async getMonthlyStatistics(months?: number): Promise<MonthlyKpiStatisticsView> {
    const monthsLimit = normalizeMonthsLimit(months);
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        responses: {
          some: {}
        }
      },
      orderBy: { createdAt: "desc" }
    });

    if (campaigns.length === 0) {
      return {
        months: [],
        employees: []
      };
    }

    const latestCampaignByMonth = new Map<string, Campaign>();
    for (const campaign of campaigns) {
      const monthKey = campaign.assessmentMonth;
      if (!latestCampaignByMonth.has(monthKey)) {
        latestCampaignByMonth.set(monthKey, campaign);
      }
    }

    const selectedMonthKeysDesc = Array.from(latestCampaignByMonth.keys())
      .sort((a, b) => b.localeCompare(a, "en"))
      .slice(0, monthsLimit);
    const selectedMonthKeysAsc = [...selectedMonthKeysDesc].reverse();
    const monthCampaignId = new Map(
      selectedMonthKeysAsc.map((monthKey) => [monthKey, latestCampaignByMonth.get(monthKey)?.id as string])
    );

    const monthResults = await Promise.all(
      selectedMonthKeysAsc.map(async (monthKey) => {
        const campaign = latestCampaignByMonth.get(monthKey) as Campaign;
        const result = await this.buildCampaignResultData(campaign.id);
        const participants = result.rows.length;
        const completedParticipants = result.rows.filter((row) => row.isCompleted).length;
        const averageKpi =
          participants === 0 ? 0 : round2(result.rows.reduce((sum, row) => sum + row.totalPercent, 0) / participants);

        return {
          monthKey,
          campaign,
          participants,
          completedParticipants,
          averageKpi,
          rows: result.rows
        };
      })
    );

    const monthsView = monthResults.map((monthResult) => ({
      monthKey: monthResult.monthKey,
      monthLabel: monthResult.monthKey,
      campaignId: monthResult.campaign.id,
      campaignTitle: monthResult.campaign.title,
      campaignStatus: monthResult.campaign.status,
      participants: monthResult.participants,
      completedParticipants: monthResult.completedParticipants,
      averageKpi: monthResult.averageKpi
    }));

    const employeeMap = new Map<
      string,
      {
        employeeId: string;
        employeeName: string;
        department: string;
        valuesByMonth: Map<string, number | null>;
      }
    >();

    for (const monthResult of monthResults) {
      for (const row of monthResult.rows) {
        const existing = employeeMap.get(row.employeeId);
        if (!existing) {
          employeeMap.set(row.employeeId, {
            employeeId: row.employeeId,
            employeeName: row.employeeName,
            department: row.department,
            valuesByMonth: new Map([[monthResult.monthKey, row.totalPercent]])
          });
          continue;
        }
        existing.valuesByMonth.set(monthResult.monthKey, row.totalPercent);
      }
    }

    const monthKeys = monthsView.map((month) => month.monthKey);
    const employees = Array.from(employeeMap.values())
      .map((employee) => {
        const values = monthKeys.map((monthKey) => ({
          monthKey,
          campaignId: monthCampaignId.get(monthKey) as string,
          kpi: employee.valuesByMonth.get(monthKey) ?? null
        }));

        const nonNullKpi = values
          .map((value) => value.kpi)
          .filter((value): value is number => value !== null);
        const averageKpi =
          nonNullKpi.length === 0 ? null : round2(nonNullKpi.reduce((sum, value) => sum + value, 0) / nonNullKpi.length);

        const latestTwo = [...values]
          .reverse()
          .map((value) => value.kpi)
          .filter((value): value is number => value !== null)
          .slice(0, 2);
        const trendDelta = latestTwo.length === 2 ? round2(latestTwo[0] - latestTwo[1]) : null;

        return {
          employeeId: employee.employeeId,
          employeeName: employee.employeeName,
          department: employee.department,
          averageKpi,
          trendDelta,
          values
        };
      })
      .sort((a, b) => a.employeeName.localeCompare(b.employeeName, "ru"));

    return {
      months: monthsView,
      employees
    };
  }

  private async buildCampaignResultData(campaignId: string): Promise<CampaignResultData> {
    const [questions, participantRows, responses] = await Promise.all([
      this.prisma.kpiQuestion.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" }
      }),
      this.prisma.campaignParticipant.findMany({
        where: { campaignId },
        include: { employee: true }
      }),
      this.prisma.evaluationResponse.findMany({
        where: { campaignId },
        select: {
          employeeId: true,
          questionId: true,
          score: true
        }
      })
    ]);

    const questionsView = questions.map((question) => ({
      id: question.id,
      code: question.code,
      label: formatQuestionLabel(question.sortOrder),
      text: question.text,
      section: question.section,
      weightPercent: question.weightPercent,
      sortOrder: question.sortOrder
    }));

    const participantsByEmployeeId = new Map<
      string,
      {
        employee: Employee;
        completedAt: Date | null;
      }
    >(
      participantRows.map((item) => [
        item.employeeId,
        {
          employee: item.employee,
          completedAt: item.completedAt
        }
      ])
    );

    const extraEmployeeIds = Array.from(new Set(responses.map((response) => response.employeeId))).filter(
      (employeeId) => !participantsByEmployeeId.has(employeeId)
    );

    if (extraEmployeeIds.length > 0) {
      const extraEmployees = await this.prisma.employee.findMany({
        where: { id: { in: extraEmployeeIds } }
      });
      for (const employee of extraEmployees) {
        participantsByEmployeeId.set(employee.id, {
          employee,
          completedAt: null
        });
      }
    }

    const responsesByEmployee = new Map<string, Map<string, number>>();
    for (const response of responses) {
      if (!responsesByEmployee.has(response.employeeId)) {
        responsesByEmployee.set(response.employeeId, new Map());
      }
      responsesByEmployee.get(response.employeeId)?.set(response.questionId, response.score);
    }

    const rows = Array.from(participantsByEmployeeId.values())
      .map(({ employee, completedAt }) =>
        this.toResultRow(employee.id, employee.fullName, employee.department, completedAt, questions, responsesByEmployee)
      )
      .sort((a, b) => a.employeeName.localeCompare(b.employeeName, "ru"));

    return {
      questions: questionsView,
      rows
    };
  }

  private toResultRow(
    employeeId: string,
    employeeName: string,
    department: string,
    completedAt: Date | null,
    questions: readonly KpiQuestion[],
    responsesByEmployee: ReadonlyMap<string, ReadonlyMap<string, number>>
  ): CampaignResultRow {
    const answersMap = responsesByEmployee.get(employeeId) ?? new Map<string, number>();
    let answeredCount = 0;
    let section1Percent = 0;
    let section2Percent = 0;

    const answers = questions.map((question) => {
      const score = answersMap.get(question.id) ?? null;
      if (score !== null) {
        answeredCount += 1;
      }
      const weightedContribution = ((score ?? 0) * question.weightPercent) / 100;
      if (question.section === "SECTION_1") {
        section1Percent += weightedContribution;
      } else {
        section2Percent += weightedContribution;
      }

      return {
        questionId: question.id,
        questionCode: question.code,
        questionLabel: formatQuestionLabel(question.sortOrder),
        score
      };
    });

    const isCompleted = completedAt !== null || answeredCount === questions.length;

    return {
      employeeId,
      employeeName,
      department,
      answeredCount,
      isCompleted,
      completedAt: completedAt?.toISOString() ?? null,
      section1Percent: round2(section1Percent),
      section2Percent: round2(section2Percent),
      totalPercent: round2(section1Percent + section2Percent),
      answers
    };
  }

  private async resolveCampaign(campaignId?: string): Promise<Campaign | null> {
    if (campaignId) {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId }
      });
      if (!campaign) {
        throw new NotFoundException("KPI-кампания не найдена.");
      }
      return campaign;
    }

    return this.prisma.campaign.findFirst({
      orderBy: { createdAt: "desc" }
    });
  }

  private toCampaignView(campaign: Campaign): CampaignResultCampaign {
    return {
      id: campaign.id,
      title: campaign.title,
      assessmentMonth: campaign.assessmentMonth,
      status: campaign.status,
      startedAt: campaign.startedAt?.toISOString() ?? null,
      closedAt: campaign.closedAt?.toISOString() ?? null,
      createdAt: campaign.createdAt.toISOString()
    };
  }
}
