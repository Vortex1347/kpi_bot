import { useCallback, useEffect, useMemo, useState } from "react";
import * as resultsApi from "../api/resultsApi";
import type { CampaignResultsResponse, ExportExcelActionResponse, MonthlyKpiStatisticsResponse } from "./types";

const MONTH_KEY_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

function toMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function parseMonths(raw: string): number | null {
  const parsed = Number(raw.trim());
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 36) {
    return null;
  }
  return parsed;
}

function getPreviousMonthKey(now: Date = new Date()): string {
  const previous = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const year = previous.getUTCFullYear();
  const month = String(previous.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function parseStartMonthKey(raw: string): string | null {
  const normalized = raw.trim();
  if (!MONTH_KEY_REGEX.test(normalized)) {
    return null;
  }
  return normalized;
}

const EMPTY_RESULTS: CampaignResultsResponse = {
  campaign: null,
  questions: [],
  rows: []
};

const EMPTY_STATISTICS: MonthlyKpiStatisticsResponse = {
  months: [],
  employees: []
};

export const useResultsDashboard = () => {
  const [results, setResults] = useState<CampaignResultsResponse>(EMPTY_RESULTS);
  const [statistics, setStatistics] = useState<MonthlyKpiStatisticsResponse>(EMPTY_STATISTICS);
  const [isLoading, setIsLoading] = useState(false);
  const [isStartingCampaign, setIsStartingCampaign] = useState(false);
  const [isClosingCampaign, setIsClosingCampaign] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastExportResult, setLastExportResult] = useState<ExportExcelActionResponse | null>(null);
  const [campaignIdInput, setCampaignIdInput] = useState("");
  const [activeCampaignIdFilter, setActiveCampaignIdFilter] = useState<string | null>(null);
  const [selectedMonthKey, setSelectedMonthKey] = useState("");
  const [statisticsMonthsInput, setStatisticsMonthsInput] = useState("12");
  const [activeStatisticsMonths, setActiveStatisticsMonths] = useState(12);
  const [startCampaignMonthKey, setStartCampaignMonthKey] = useState(() => getPreviousMonthKey());

  const refresh = useCallback(
    async (campaignId?: string, months = activeStatisticsMonths) => {
      setIsLoading(true);
      setError(null);
      try {
        const [campaignResults, monthlyStatistics] = await Promise.all([
          resultsApi.getCampaignResults(campaignId),
          resultsApi.getMonthlyKpiStatistics(months)
        ]);
        setResults(campaignResults);
        setStatistics(monthlyStatistics);
      } catch (loadError) {
        setError(toMessage(loadError, "Не удалось загрузить результаты KPI-кампании."));
      } finally {
        setIsLoading(false);
      }
    },
    [activeStatisticsMonths]
  );

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  const monthOptions = useMemo(() => statistics.months.map((month) => ({ monthKey: month.monthKey, campaignId: month.campaignId })), [statistics.months]);

  const applyCampaignFilter = useCallback(async () => {
    const normalizedValue = campaignIdInput.trim();
    const nextCampaignId = normalizedValue.length > 0 ? normalizedValue : null;
    setActiveCampaignIdFilter(nextCampaignId);
    setSelectedMonthKey("");
    await refresh(nextCampaignId ?? undefined);
  }, [campaignIdInput, refresh]);

  const applyMonthFilter = useCallback(async () => {
    const normalizedMonthKey = selectedMonthKey.trim();
    if (!normalizedMonthKey) {
      setCampaignIdInput("");
      setActiveCampaignIdFilter(null);
      await refresh(undefined);
      return;
    }

    const selectedMonth = monthOptions.find((month) => month.monthKey === normalizedMonthKey);
    if (!selectedMonth) {
      setError("Не найдено кампании для выбранного месяца.");
      return;
    }

    setCampaignIdInput(selectedMonth.campaignId);
    setActiveCampaignIdFilter(selectedMonth.campaignId);
    await refresh(selectedMonth.campaignId);
  }, [monthOptions, refresh, selectedMonthKey]);

  const clearCampaignFilter = useCallback(async () => {
    setCampaignIdInput("");
    setSelectedMonthKey("");
    setActiveCampaignIdFilter(null);
    await refresh();
  }, [refresh]);

  const applyStatisticsMonths = useCallback(async () => {
    const parsedMonths = parseMonths(statisticsMonthsInput);
    if (parsedMonths === null) {
      setError("Период статистики должен быть целым числом от 1 до 36 месяцев.");
      return;
    }
    setActiveStatisticsMonths(parsedMonths);
    await refresh(activeCampaignIdFilter ?? undefined, parsedMonths);
  }, [activeCampaignIdFilter, refresh, statisticsMonthsInput]);

  const startCampaignFromWeb = useCallback(async () => {
    const parsedMonthKey = parseStartMonthKey(startCampaignMonthKey);
    if (!parsedMonthKey) {
      setError("Период KPI должен быть в формате YYYY-MM.");
      return;
    }

    setIsStartingCampaign(true);
    setError(null);
    setActionMessage(null);
    try {
      const response = await resultsApi.startCampaignFromDashboard(parsedMonthKey);
      setStartCampaignMonthKey(response.campaign.assessmentMonth);
      setActionMessage(response.message);
      await refresh(activeCampaignIdFilter ?? undefined, activeStatisticsMonths);
    } catch (actionError) {
      setError(toMessage(actionError, "Не удалось запустить KPI-кампанию."));
    } finally {
      setIsStartingCampaign(false);
    }
  }, [activeCampaignIdFilter, activeStatisticsMonths, refresh, startCampaignMonthKey]);

  const closeCampaignFromWeb = useCallback(async () => {
    setIsClosingCampaign(true);
    setError(null);
    setActionMessage(null);
    try {
      const response = await resultsApi.closeCampaignFromDashboard();
      setActionMessage(response.message);
      await refresh(activeCampaignIdFilter ?? undefined, activeStatisticsMonths);
    } catch (actionError) {
      setError(toMessage(actionError, "Не удалось закрыть KPI-кампанию."));
    } finally {
      setIsClosingCampaign(false);
    }
  }, [activeCampaignIdFilter, activeStatisticsMonths, refresh]);

  const exportExcelFromWeb = useCallback(async () => {
    setIsExportingExcel(true);
    setError(null);
    setActionMessage(null);
    try {
      const response = await resultsApi.exportExcelFromDashboard(activeCampaignIdFilter ?? undefined);
      setLastExportResult(response);
      setActionMessage(`${response.message} Summary: ${response.summaryFilePath}`);
      await refresh(activeCampaignIdFilter ?? undefined, activeStatisticsMonths);
    } catch (actionError) {
      setError(toMessage(actionError, "Не удалось сформировать Excel-отчеты."));
    } finally {
      setIsExportingExcel(false);
    }
  }, [activeCampaignIdFilter, activeStatisticsMonths, refresh]);

  return {
    results,
    statistics,
    monthOptions,
    isLoading,
    isStartingCampaign,
    isClosingCampaign,
    isExportingExcel,
    error,
    actionMessage,
    lastExportResult,
    campaignIdInput,
    activeCampaignIdFilter,
    selectedMonthKey,
    statisticsMonthsInput,
    activeStatisticsMonths,
    startCampaignMonthKey,
    setCampaignIdInput,
    setSelectedMonthKey,
    setStatisticsMonthsInput,
    setStartCampaignMonthKey,
    refresh,
    applyCampaignFilter,
    applyMonthFilter,
    clearCampaignFilter,
    applyStatisticsMonths,
    startCampaignFromWeb,
    closeCampaignFromWeb,
    exportExcelFromWeb
  };
};
