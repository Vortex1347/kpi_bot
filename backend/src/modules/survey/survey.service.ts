import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Campaign, CampaignStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SurveyService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveCampaign(): Promise<Campaign | null> {
    return this.prisma.campaign.findFirst({
      where: { status: CampaignStatus.ACTIVE },
      orderBy: { createdAt: "desc" }
    });
  }

  async startCampaign(createdBy: string): Promise<Campaign> {
    const activeCampaign = await this.getActiveCampaign();
    if (activeCampaign) {
      throw new BadRequestException("Уже есть активная KPI-кампания. Сначала закройте её командой /close_kpi.");
    }

    const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");

    return this.prisma.campaign.create({
      data: {
        title: `KPI Campaign ${timestamp}`,
        status: CampaignStatus.ACTIVE,
        startedAt: new Date(),
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
