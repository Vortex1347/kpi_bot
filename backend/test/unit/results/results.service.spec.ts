import { BadRequestException, NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResultsService } from "../../../src/modules/results/results.service";
import { createMockPrisma } from "../../helpers/test-factories";

describe("ResultsService", () => {
  const prisma = createMockPrisma();
  const employeeService = {
    getAllEmployees: vi.fn(),
    getByTelegramId: vi.fn()
  };
  const surveyService = {
    startCampaign: vi.fn(),
    closeActiveCampaign: vi.fn(),
    markReportGenerated: vi.fn(),
    syncParticipants: vi.fn(),
    getActiveCampaign: vi.fn()
  };
  const evaluationService = {
    ensureDefaultQuestions: vi.fn(),
    getNextQuestion: vi.fn()
  };
  const reportService = {
    generateCampaignReports: vi.fn()
  };
  const service = new ResultsService(
    prisma as any,
    employeeService as any,
    surveyService as any,
    evaluationService as any,
    reportService as any
  );

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.LEAD_TELEGRAM_ID = "lead-telegram-id";
  });

  it("returns empty payload when campaigns do not exist", async () => {
    prisma.campaign.findFirst.mockResolvedValue(null);

    const result = await service.getCampaignResults();

    expect(result).toEqual({
      campaign: null,
      questions: [],
      rows: []
    });
  });

  it("builds rows with weighted KPI and question scores", async () => {
    prisma.campaign.findFirst.mockResolvedValue({
      id: "campaign-1",
      title: "KPI Campaign",
      assessmentMonth: "2026-03",
      status: "ACTIVE",
      startedAt: new Date("2026-03-04T09:00:00.000Z"),
      closedAt: null,
      createdAt: new Date("2026-03-04T08:30:00.000Z")
    });
    prisma.kpiQuestion.findMany.mockResolvedValue([
      { id: "q1", code: "Q1_TESTING_QUALITY", text: "Q1", section: "SECTION_1", weightPercent: 49, sortOrder: 1 },
      { id: "q2", code: "Q2_DEADLINE", text: "Q2", section: "SECTION_1", weightPercent: 21, sortOrder: 2 },
      { id: "q3", code: "Q3_DISCIPLINE", text: "Q3", section: "SECTION_2", weightPercent: 30, sortOrder: 3 }
    ]);
    prisma.campaignParticipant.findMany.mockResolvedValue([
      {
        employeeId: "employee-1",
        completedAt: null,
        employee: { id: "employee-1", fullName: "Alice", department: "QA" }
      },
      {
        employeeId: "employee-2",
        completedAt: new Date("2026-03-04T09:10:00.000Z"),
        employee: { id: "employee-2", fullName: "Bob", department: "Dev" }
      }
    ]);
    prisma.evaluationResponse.findMany.mockResolvedValue([
      { employeeId: "employee-1", questionId: "q1", score: 100 },
      { employeeId: "employee-1", questionId: "q2", score: 90 }
    ]);

    const result = await service.getCampaignResults();

    expect(result.campaign?.id).toBe("campaign-1");
    expect(result.questions.map((question) => question.label)).toEqual(["Q1", "Q2", "Q3"]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({
      employeeId: "employee-1",
      employeeName: "Alice",
      answeredCount: 2,
      isCompleted: false,
      section1Percent: 67.9,
      section2Percent: 0,
      totalPercent: 67.9
    });
    expect(result.rows[0].answers.map((answer) => answer.score)).toEqual([100, 90, null]);
    expect(result.rows[1]).toMatchObject({
      employeeId: "employee-2",
      employeeName: "Bob",
      answeredCount: 0,
      isCompleted: true,
      totalPercent: 0
    });
  });

  it("throws NotFoundException for unknown campaignId", async () => {
    prisma.campaign.findUnique.mockResolvedValue(null);

    await expect(service.getCampaignResults("missing-campaign")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("returns empty monthly statistics when campaigns with responses are absent", async () => {
    prisma.campaign.findMany.mockResolvedValue([]);

    const result = await service.getMonthlyStatistics();

    expect(result).toEqual({
      months: [],
      employees: []
    });
  });

  it("aggregates monthly statistics and employee trends", async () => {
    prisma.campaign.findMany.mockResolvedValue([
      {
        id: "campaign-mar-new",
        title: "KPI Campaign 2026-03 10:00",
        assessmentMonth: "2026-03",
        status: "CLOSED",
        startedAt: new Date("2026-03-20T10:00:00.000Z"),
        closedAt: new Date("2026-03-21T10:00:00.000Z"),
        createdAt: new Date("2026-03-20T10:00:00.000Z")
      },
      {
        id: "campaign-mar-old",
        title: "KPI Campaign 2026-03 08:00",
        assessmentMonth: "2026-03",
        status: "CLOSED",
        startedAt: new Date("2026-03-05T08:00:00.000Z"),
        closedAt: new Date("2026-03-06T08:00:00.000Z"),
        createdAt: new Date("2026-03-05T08:00:00.000Z")
      },
      {
        id: "campaign-feb",
        title: "KPI Campaign 2026-02 09:00",
        assessmentMonth: "2026-02",
        status: "REPORT_GENERATED",
        startedAt: new Date("2026-02-10T09:00:00.000Z"),
        closedAt: new Date("2026-02-11T09:00:00.000Z"),
        createdAt: new Date("2026-02-10T09:00:00.000Z")
      }
    ]);
    prisma.kpiQuestion.findMany.mockResolvedValue([
      { id: "q1", code: "Q1_TESTING_QUALITY", text: "Q1", section: "SECTION_1", weightPercent: 100, sortOrder: 1 }
    ]);
    prisma.campaignParticipant.findMany.mockImplementation(async (args: { where: { campaignId: string } }) => {
      if (args.where.campaignId === "campaign-feb") {
        return [
          {
            employeeId: "employee-1",
            completedAt: new Date("2026-02-10T10:00:00.000Z"),
            employee: { id: "employee-1", fullName: "Alice", department: "QA" }
          },
          {
            employeeId: "employee-2",
            completedAt: new Date("2026-02-10T11:00:00.000Z"),
            employee: { id: "employee-2", fullName: "Bob", department: "Dev" }
          }
        ];
      }

      if (args.where.campaignId === "campaign-mar-new") {
        return [
          {
            employeeId: "employee-1",
            completedAt: new Date("2026-03-20T11:00:00.000Z"),
            employee: { id: "employee-1", fullName: "Alice", department: "QA" }
          }
        ];
      }

      return [];
    });
    prisma.evaluationResponse.findMany.mockImplementation(async (args: { where: { campaignId: string } }) => {
      if (args.where.campaignId === "campaign-feb") {
        return [
          { employeeId: "employee-1", questionId: "q1", score: 80 },
          { employeeId: "employee-2", questionId: "q1", score: 70 }
        ];
      }

      if (args.where.campaignId === "campaign-mar-new") {
        return [{ employeeId: "employee-1", questionId: "q1", score: 90 }];
      }

      return [];
    });

    const result = await service.getMonthlyStatistics(12);

    expect(result.months.map((month) => month.monthKey)).toEqual(["2026-02", "2026-03"]);
    expect(result.months.map((month) => month.campaignId)).toEqual(["campaign-feb", "campaign-mar-new"]);
    expect(result.months.map((month) => month.averageKpi)).toEqual([75, 90]);

    expect(result.employees).toHaveLength(2);
    expect(result.employees[0]).toMatchObject({
      employeeId: "employee-1",
      employeeName: "Alice",
      averageKpi: 85,
      trendDelta: 10
    });
    expect(result.employees[0].values.map((value) => value.kpi)).toEqual([80, 90]);

    expect(result.employees[1]).toMatchObject({
      employeeId: "employee-2",
      employeeName: "Bob",
      averageKpi: 70,
      trendDelta: null
    });
    expect(result.employees[1].values.map((value) => value.kpi)).toEqual([70, null]);
  });

  it("validates months parameter range", async () => {
    await expect(service.getMonthlyStatistics(0)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.getMonthlyStatistics(37)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("starts campaign and syncs participants from web action", async () => {
    evaluationService.ensureDefaultQuestions.mockResolvedValue(undefined);
    surveyService.startCampaign.mockResolvedValue({
      id: "campaign-web-1",
      title: "KPI Campaign 2026-03 12:00",
      assessmentMonth: "2026-03",
      status: "ACTIVE",
      startedAt: new Date("2026-03-04T10:00:00.000Z"),
      closedAt: null,
      createdAt: new Date("2026-03-04T10:00:00.000Z")
    });
    employeeService.getAllEmployees.mockResolvedValue([
      { id: "e-1", role: "EMPLOYEE" },
      { id: "e-2", role: "LEAD" }
    ]);
    surveyService.syncParticipants.mockResolvedValue(undefined);

    const result = await service.startCampaignFromWeb();

    expect(result.ok).toBe(true);
    expect(result.participants).toBe(1);
    expect(result.campaign.id).toBe("campaign-web-1");
    expect(evaluationService.ensureDefaultQuestions).toHaveBeenCalledTimes(1);
    expect(surveyService.startCampaign).toHaveBeenCalledWith("lead-telegram-id", undefined);
    expect(surveyService.syncParticipants).toHaveBeenCalledWith("campaign-web-1", ["e-1"]);
  });

  it("closes active campaign from web action", async () => {
    surveyService.closeActiveCampaign.mockResolvedValue({
      id: "campaign-closed-1",
      title: "KPI Campaign 2026-03 10:00",
      assessmentMonth: "2026-03",
      status: "CLOSED",
      startedAt: new Date("2026-03-01T10:00:00.000Z"),
      closedAt: new Date("2026-03-20T10:00:00.000Z"),
      createdAt: new Date("2026-03-01T10:00:00.000Z")
    });

    const result = await service.closeCampaignFromWeb();

    expect(result.ok).toBe(true);
    expect(result.campaign.id).toBe("campaign-closed-1");
    expect(surveyService.closeActiveCampaign).toHaveBeenCalledTimes(1);
  });

  it("exports excel and marks campaign as report-generated for closed campaign", async () => {
    prisma.campaign.findUnique.mockResolvedValue({
      id: "campaign-1",
      title: "KPI Campaign",
      assessmentMonth: "2026-03",
      status: "CLOSED",
      startedAt: new Date("2026-03-04T10:00:00.000Z"),
      closedAt: new Date("2026-03-05T10:00:00.000Z"),
      createdAt: new Date("2026-03-04T10:00:00.000Z")
    });
    reportService.generateCampaignReports.mockResolvedValue({
      summaryFilePath: "/tmp/summary.xlsx",
      employeeFiles: [{ employeeId: "e-1", employeeName: "Alice", filePath: "/tmp/alice.xlsx" }]
    });
    surveyService.markReportGenerated.mockResolvedValue({
      id: "campaign-1",
      title: "KPI Campaign",
      assessmentMonth: "2026-03",
      status: "REPORT_GENERATED",
      startedAt: new Date("2026-03-04T10:00:00.000Z"),
      closedAt: new Date("2026-03-05T10:00:00.000Z"),
      createdAt: new Date("2026-03-04T10:00:00.000Z")
    });

    const result = await service.exportExcelFromWeb("campaign-1");

    expect(result.ok).toBe(true);
    expect(result.summaryFilePath).toBe("/tmp/summary.xlsx");
    expect(result.employeeFiles).toHaveLength(1);
    expect(surveyService.markReportGenerated).toHaveBeenCalledWith("campaign-1");
  });
});
