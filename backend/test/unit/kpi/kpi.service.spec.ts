import { beforeEach, describe, expect, it, vi } from "vitest";
import { KpiService } from "../../../src/modules/kpi/kpi.service";

describe("KpiService", () => {
  const evaluationService = {
    getQuestions: vi.fn(),
    getEmployeeResponses: vi.fn()
  };
  const service = new KpiService(evaluationService as any);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates weighted KPI with missing answers as zero", async () => {
    evaluationService.getQuestions.mockResolvedValue([
      { id: "q1", section: "SECTION_1", text: "Q1", weightPercent: 49 },
      { id: "q2", section: "SECTION_1", text: "Q2", weightPercent: 21 },
      { id: "q3", section: "SECTION_2", text: "Q3", weightPercent: 18 },
      { id: "q4", section: "SECTION_2", text: "Q4", weightPercent: 6 },
      { id: "q5", section: "SECTION_2", text: "Q5", weightPercent: 6 }
    ]);
    evaluationService.getEmployeeResponses.mockResolvedValue([
      { questionId: "q1", score: 100, question: { sortOrder: 1 } },
      { questionId: "q2", score: 90, question: { sortOrder: 2 } }
    ]);

    const result = await service.calculateEmployeeKpi("campaign-1", "employee-1");

    expect(result.section1Percent).toBe(67.9);
    expect(result.section2Percent).toBe(0);
    expect(result.totalPercent).toBe(67.9);
    expect(result.questionResults).toHaveLength(5);
  });
});
