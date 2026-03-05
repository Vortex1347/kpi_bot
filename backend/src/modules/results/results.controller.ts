import { Body, Controller, Get, HttpCode, Post, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "../auth/auth.service";
import { ResultsService } from "./results.service";

interface StartCampaignBody {
  readonly monthKey?: string;
}

@Controller("results")
export class ResultsController {
  constructor(
    private readonly resultsService: ResultsService,
    private readonly authService: AuthService
  ) {}

  @Get()
  getResults(@Req() request: Request, @Query("campaignId") campaignId?: string) {
    this.authService.requireUserFromAuthorizationHeader(request.headers.authorization);
    const normalizedCampaignId = campaignId?.trim() || undefined;
    return this.resultsService.getCampaignResults(normalizedCampaignId);
  }

  @Get("statistics")
  getStatistics(@Req() request: Request, @Query("months") months?: string) {
    this.authService.requireUserFromAuthorizationHeader(request.headers.authorization);
    const normalizedMonths = months?.trim();
    const parsedMonths = normalizedMonths ? Number(normalizedMonths) : undefined;
    return this.resultsService.getMonthlyStatistics(parsedMonths);
  }

  @Post("actions/start-campaign")
  @HttpCode(200)
  startCampaign(@Req() request: Request, @Body() body?: StartCampaignBody) {
    this.authService.requireSupervisorFromAuthorizationHeader(request.headers.authorization);
    const normalizedMonthKey = body?.monthKey?.trim() || undefined;
    return this.resultsService.startCampaignFromWeb(normalizedMonthKey);
  }

  @Post("actions/close-campaign")
  @HttpCode(200)
  closeCampaign(@Req() request: Request) {
    this.authService.requireSupervisorFromAuthorizationHeader(request.headers.authorization);
    return this.resultsService.closeCampaignFromWeb();
  }

  @Post("actions/export-excel")
  @HttpCode(200)
  exportExcel(@Req() request: Request, @Body() body: { campaignId?: string }) {
    this.authService.requireSupervisorFromAuthorizationHeader(request.headers.authorization);
    const normalizedCampaignId = body?.campaignId?.trim() || undefined;
    return this.resultsService.exportExcelFromWeb(normalizedCampaignId);
  }
}
