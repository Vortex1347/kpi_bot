import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export interface HealthStatus {
  readonly status: "ok";
  readonly timestamp: string;
}

export interface ReadinessStatus {
  readonly status: "ok";
  readonly timestamp: string;
  readonly checks: {
    readonly database: "up";
  };
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth(): HealthStatus {
    return {
      status: "ok",
      timestamp: new Date().toISOString()
    };
  }

  async getReadiness(): Promise<ReadinessStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({
        status: "error",
        timestamp: new Date().toISOString(),
        checks: {
          database: "down"
        }
      });
    }

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      checks: {
        database: "up"
      }
    };
  }
}
