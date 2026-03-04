import { ServiceUnavailableException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HealthService } from "../../../src/modules/health/health.service";
import { createMockPrisma } from "../../helpers/test-factories";

describe("HealthService", () => {
  const prisma = createMockPrisma();
  const service = new HealthService(prisma as any);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getHealth returns ok status with timestamp", () => {
    const result = service.getHealth();

    expect(result.status).toBe("ok");
    expect(typeof result.timestamp).toBe("string");
  });

  it("getReadiness returns ok when db query succeeds", async () => {
    prisma.$queryRaw.mockResolvedValue([1]);

    const result = await service.getReadiness();

    expect(result).toEqual({
      status: "ok",
      timestamp: expect.any(String),
      checks: { database: "up" }
    });
  });

  it("getReadiness throws ServiceUnavailableException when db query fails", async () => {
    prisma.$queryRaw.mockRejectedValue(new Error("db down"));

    await expect(service.getReadiness()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
