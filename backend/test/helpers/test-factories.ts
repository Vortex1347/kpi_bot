import { vi } from "vitest";

export function createMockPrisma() {
  return {
    employee: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn()
    },
    campaign: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    campaignParticipant: {
      createMany: vi.fn(),
      upsert: vi.fn()
    },
    kpiQuestion: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn()
    },
    evaluationResponse: {
      findMany: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn()
    },
    $transaction: vi.fn(),
    $queryRaw: vi.fn()
  };
}
