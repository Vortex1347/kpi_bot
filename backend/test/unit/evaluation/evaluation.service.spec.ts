import { BadRequestException } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KPI_REFILL_WINDOW_MINUTES, EvaluationService } from "../../../src/modules/evaluation/evaluation.service";
import { createMockPrisma } from "../../helpers/test-factories";

describe("EvaluationService", () => {
  const prisma = createMockPrisma();
  const surveyService = {
    markParticipantCompleted: vi.fn()
  };
  const service = new EvaluationService(prisma as any, surveyService as any);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-05T10:00:00.000Z"));
    prisma.$transaction.mockImplementation(async (operations: unknown[]) => Promise.all(operations as Promise<unknown>[]));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns refill deadline when questionnaire was completed less than 10 minutes ago", async () => {
    prisma.campaignParticipant.findUnique.mockResolvedValue({
      completedAt: new Date("2026-03-05T09:55:00.000Z")
    });

    const deadline = await service.getRefillDeadline("campaign-1", "employee-1");

    expect(deadline?.toISOString()).toBe("2026-03-05T10:05:00.000Z");
  });

  it("returns null refill deadline when questionnaire is not completed", async () => {
    prisma.campaignParticipant.findUnique.mockResolvedValue({ completedAt: null });

    const deadline = await service.getRefillDeadline("campaign-1", "employee-1");

    expect(deadline).toBeNull();
  });

  it("resets answers when refill window is active", async () => {
    prisma.campaignParticipant.findUnique.mockResolvedValue({
      completedAt: new Date("2026-03-05T09:54:00.000Z")
    });
    prisma.evaluationResponse.deleteMany.mockResolvedValue({ count: 5 });
    prisma.campaignParticipant.upsert.mockResolvedValue({});

    await service.restartQuestionnaire("campaign-1", "employee-1");

    expect(prisma.evaluationResponse.deleteMany).toHaveBeenCalledWith({
      where: {
        campaignId: "campaign-1",
        employeeId: "employee-1"
      }
    });
    expect(prisma.campaignParticipant.upsert).toHaveBeenCalledWith({
      where: {
        campaignId_employeeId: {
          campaignId: "campaign-1",
          employeeId: "employee-1"
        }
      },
      create: {
        campaignId: "campaign-1",
        employeeId: "employee-1",
        completedAt: null
      },
      update: {
        completedAt: null
      }
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("throws when refill window is expired", async () => {
    prisma.campaignParticipant.findUnique.mockResolvedValue({
      completedAt: new Date("2026-03-05T09:40:00.000Z")
    });

    await expect(service.restartQuestionnaire("campaign-1", "employee-1")).rejects.toEqual(
      expect.objectContaining({
        message: `Перезаполнение доступно только в течение ${KPI_REFILL_WINDOW_MINUTES} минут после завершения анкеты.`
      })
    );
  });

  it("blocks direct answer change after completion and asks to refill", async () => {
    prisma.campaignParticipant.findUnique.mockResolvedValue({
      completedAt: new Date("2026-03-05T09:53:00.000Z")
    });

    await expect(service.saveAnswer("campaign-1", "employee-1", "question-1", 90)).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(prisma.evaluationResponse.upsert).not.toHaveBeenCalled();
  });
});
