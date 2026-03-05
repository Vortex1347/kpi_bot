import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Campaign, CampaignStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

const MONTH_KEY_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

function toMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getPreviousMonthKey(now: Date): string {
  const previousMonthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return toMonthKey(previousMonthDate);
}

function normalizeCampaignMonthKey(rawMonthKey: string | undefined, now: Date): string {
  const normalized = rawMonthKey?.trim();
  if (!normalized) {
    return getPreviousMonthKey(now);
  }

  if (!MONTH_KEY_REGEX.test(normalized)) {
    throw new BadRequestException("Параметр monthKey должен быть в формате YYYY-MM.");
  }

  return normalized;
}

@Injectable()
export class SurveyService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveCampaign(): Promise<Campaign | null> {
    return this.prisma.campaign.findFirst({
      where: { status: CampaignStatus.ACTIVE },
      orderBy: { createdAt: "desc" }
    });
  }

  async startCampaign(createdBy: string, monthKey?: string): Promise<Campaign> {
    const activeCampaign = await this.getActiveCampaign();
    if (activeCampaign) {
      throw new BadRequestException("Уже есть активная KPI-кампания. Сначала закройте её командой /close_kpi.");
    }

    const now = new Date();
    const assessmentMonth = normalizeCampaignMonthKey(monthKey, now);
    const timeTag = now.toISOString().slice(11, 16);

    return this.prisma.campaign.create({
      data: {
        title: `KPI Campaign ${assessmentMonth} ${timeTag}`,
        assessmentMonth,
        status: CampaignStatus.ACTIVE,
        startedAt: now,
        createdBy
      }
    });
  }

  async closeActiveCampaign(): Promise<Campaign> {
    const activeCampaign = await this.getActiveCampaign();
    if (!activeCampaign) {
      throw new NotFoundException("Активная KPI-кампания не найдена.");
    }

    return this.prisma.campaign.update({
      where: { id: activeCampaign.id },
      data: {
        status: CampaignStatus.CLOSED,
        closedAt: new Date()
      }
    });
  }

  async markReportGenerated(campaignId: string): Promise<Campaign> {
    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.REPORT_GENERATED
      }
    });
  }

  async getLatestClosedCampaignWithoutReport(): Promise<Campaign | null> {
    return this.prisma.campaign.findFirst({
      where: { status: CampaignStatus.CLOSED },
      orderBy: { closedAt: "desc" }
    });
  }

  async syncParticipants(campaignId: string, employeeIds: string[]): Promise<void> {
    if (employeeIds.length === 0) {
      return;
    }

    await this.prisma.campaignParticipant.createMany({
      data: employeeIds.map((employeeId) => ({
        campaignId,
        employeeId
      })),
      skipDuplicates: true
    });
  }

  async markParticipantCompleted(campaignId: string, employeeId: string): Promise<void> {
    await this.prisma.campaignParticipant.upsert({
      where: {
        campaignId_employeeId: {
          campaignId,
          employeeId
        }
      },
      create: {
        campaignId,
        employeeId,
        completedAt: new Date()
      },
      update: {
        completedAt: new Date()
      }
    });
  }
}
