import { fetchJson } from "../../../shared/api/http";
import { useAuthStore } from "../../auth/authStore";
import type {
  CampaignResultsResponse,
  CloseCampaignActionResponse,
  ExportExcelActionResponse,
  MonthlyKpiStatisticsResponse,
  StartCampaignActionResponse
} from "../model/types";

function authHeaders(): HeadersInit {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) {
    throw new Error("Требуется вход в CRM.");
  }
  return {
    Authorization: `Bearer ${accessToken}`
  };
}

export async function getCampaignResults(campaignId?: string): Promise<CampaignResultsResponse> {
  const normalizedCampaignId = campaignId?.trim();
  const query = normalizedCampaignId ? `?campaignId=${encodeURIComponent(normalizedCampaignId)}` : "";

  return fetchJson<CampaignResultsResponse>(`/results${query}`, {
    method: "GET",
    headers: authHeaders()
  });
}

export async function getMonthlyKpiStatistics(months = 12): Promise<MonthlyKpiStatisticsResponse> {
  return fetchJson<MonthlyKpiStatisticsResponse>(`/results/statistics?months=${encodeURIComponent(String(months))}`, {
    method: "GET",
    headers: authHeaders()
  });
}

export async function startCampaignFromDashboard(monthKey?: string): Promise<StartCampaignActionResponse> {
  return fetchJson<StartCampaignActionResponse>("/results/actions/start-campaign", {
    method: "POST",
    headers: authHeaders(),
    json: {
      monthKey: monthKey?.trim() || undefined
    }
  });
}

export async function closeCampaignFromDashboard(): Promise<CloseCampaignActionResponse> {
  return fetchJson<CloseCampaignActionResponse>("/results/actions/close-campaign", {
    method: "POST",
    headers: authHeaders()
  });
}

export async function exportExcelFromDashboard(campaignId?: string): Promise<ExportExcelActionResponse> {
  return fetchJson<ExportExcelActionResponse>("/results/actions/export-excel", {
    method: "POST",
    headers: authHeaders(),
    json: {
      campaignId: campaignId?.trim() || undefined
    }
  });
}
