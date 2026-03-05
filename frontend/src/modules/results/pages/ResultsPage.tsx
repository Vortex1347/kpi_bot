import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { ErrorState } from "../../../shared/ui/ErrorState";
import { FormField } from "../../../shared/ui/FormField";
import { Input } from "../../../shared/ui/Input";
import { Select } from "../../../shared/ui/Select";
import { useAuthStore } from "../../auth/authStore";
import { useResultsDashboard } from "../model/useResultsDashboard";
import { MonthlyStatisticsSection } from "../ui/MonthlyStatisticsSection";
import { ResultsTableSection } from "../ui/ResultsTableSection";

export const ResultsPage = () => {
  const canManageCampaign = useAuthStore((s) => s.user?.role === "SUPERVISOR");
  const {
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
  } = useResultsDashboard();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">KPI CRM Dashboard</h1>
          <p className="text-sm text-text-muted">Таблица сотрудников и ответов KPI с фильтрацией по месяцам и экспортом в Excel.</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => refresh(activeCampaignIdFilter ?? undefined, activeStatisticsMonths).catch(() => undefined)}
        >
          Обновить
        </Button>
      </header>

      <Card className="space-y-4 p-4">
        <div className="grid gap-4 lg:grid-cols-[2fr_auto_1fr_auto_auto] lg:items-end">
          <FormField label="Campaign ID" hint="Оставьте пустым для последней кампании">
            <Input
              value={campaignIdInput}
              onChange={(event) => setCampaignIdInput(event.target.value)}
              placeholder="например: 4a9f5c4d-..."
            />
          </FormField>
          <Button onClick={() => applyCampaignFilter().catch(() => undefined)}>Применить</Button>
          <FormField label="Фильтр по месяцу" hint="Использует последнюю кампанию выбранного месяца">
            <Select value={selectedMonthKey} onChange={(event) => setSelectedMonthKey(event.target.value)}>
              <option value="">Все месяцы</option>
              {monthOptions.map((month) => (
                <option key={month.monthKey} value={month.monthKey}>
                  {month.monthKey}
                </option>
              ))}
            </Select>
          </FormField>
          <Button variant="ghost" onClick={() => applyMonthFilter().catch(() => undefined)}>
            Фильтр месяца
          </Button>
          <Button variant="ghost" onClick={() => clearCampaignFilter().catch(() => undefined)}>
            Сбросить
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <FormField label="Месяцев в статистике" hint="1–36">
            <Input
              value={statisticsMonthsInput}
              onChange={(event) => setStatisticsMonthsInput(event.target.value)}
              inputMode="numeric"
            />
          </FormField>
          <Button variant="ghost" onClick={() => applyStatisticsMonths().catch(() => undefined)}>
            Обновить период
          </Button>
        </div>

        {results.campaign ? (
          <div className="grid gap-2 text-sm text-text-muted md:grid-cols-4">
            <div>
              <span className="text-text">Кампания:</span> {results.campaign.title}
            </div>
            <div>
              <span className="text-text">Период KPI:</span> {results.campaign.assessmentMonth}
            </div>
            <div>
              <span className="text-text">Статус:</span> {results.campaign.status}
            </div>
            <div>
              <span className="text-text">ID:</span> {results.campaign.id}
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-muted">Кампании пока не найдены.</p>
        )}
      </Card>

      <Card className="space-y-4 p-4">
        <h2 className="text-sm font-medium text-text">Действия руководителя</h2>
        {canManageCampaign ? (
          <>
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <FormField label="Период KPI (месяц)" hint="За какой месяц собирается оценка">
                <Input
                  type="month"
                  value={startCampaignMonthKey}
                  onChange={(event) => setStartCampaignMonthKey(event.target.value)}
                />
              </FormField>
              <p className="text-xs text-text-muted">Например, KPI за февраль запускается с выбором `2026-02`.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button isLoading={isStartingCampaign} onClick={() => startCampaignFromWeb().catch(() => undefined)}>
                Старт KPI
              </Button>
              <Button
                variant="secondary"
                isLoading={isClosingCampaign}
                onClick={() => closeCampaignFromWeb().catch(() => undefined)}
              >
                Закрыть KPI
              </Button>
              <Button
                variant="ghost"
                isLoading={isExportingExcel}
                onClick={() => exportExcelFromWeb().catch(() => undefined)}
              >
                Экспорт в Excel
              </Button>
            </div>

            {actionMessage ? <p className="text-sm text-text-muted">{actionMessage}</p> : null}

            {lastExportResult ? (
              <div className="space-y-1 text-sm text-text-muted">
                <div>
                  <span className="text-text">Summary:</span> {lastExportResult.summaryFilePath}
                </div>
                <div>
                  <span className="text-text">Файлов сотрудников:</span> {lastExportResult.employeeFiles.length}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-text-muted">Запуск/закрытие KPI и экспорт доступны только SUPERVISOR.</p>
        )}
      </Card>

      {error ? <ErrorState message={error} /> : null}

      <ResultsTableSection questions={results.questions} rows={results.rows} isLoading={isLoading} />
      <MonthlyStatisticsSection statistics={statistics} isLoading={isLoading} />
    </div>
  );
};
