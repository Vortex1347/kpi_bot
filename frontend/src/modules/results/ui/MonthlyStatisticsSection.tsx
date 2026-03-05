import { Card } from "../../../shared/ui/Card";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { LoadingState } from "../../../shared/ui/LoadingState";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  TableContainer
} from "../../../shared/ui/Table";
import type { MonthlyKpiStatisticsResponse } from "../model/types";

interface MonthlyStatisticsSectionProps {
  readonly statistics: MonthlyKpiStatisticsResponse;
  readonly isLoading: boolean;
}

function formatKpi(value: number | null): string {
  if (value === null) return "—";
  return value.toFixed(2);
}

function trendClass(value: number | null): string {
  if (value === null || value === 0) return "text-text-muted";
  return value > 0 ? "text-success" : "text-error";
}

function formatTrend(value: number | null): string {
  if (value === null) return "—";
  if (value === 0) return "0.00";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}`;
}

export const MonthlyStatisticsSection = ({ statistics, isLoading }: MonthlyStatisticsSectionProps) => {
  if (isLoading) {
    return <LoadingState className="px-3 py-4" label="Загрузка помесячной статистики..." />;
  }

  if (statistics.months.length === 0) {
    return (
      <EmptyState
        title="Недостаточно данных для статистики"
        description="После закрытия нескольких месячных кампаний здесь появится динамика KPI."
      />
    );
  }

  return (
    <section className="space-y-4">
      <Card className="space-y-3 p-4">
        <h2 className="text-sm font-medium text-text">Статистика по месяцам</h2>
        <TableContainer>
          <DataTable>
            <DataTableHead>
              <DataTableRow>
                <DataTableHeaderCell>Месяц</DataTableHeaderCell>
                <DataTableHeaderCell>Кампания</DataTableHeaderCell>
                <DataTableHeaderCell>Участники</DataTableHeaderCell>
                <DataTableHeaderCell>Завершили</DataTableHeaderCell>
                <DataTableHeaderCell>Средний KPI %</DataTableHeaderCell>
              </DataTableRow>
            </DataTableHead>
            <DataTableBody>
              {statistics.months.map((month) => (
                <DataTableRow key={month.campaignId}>
                  <DataTableCell className="text-text">{month.monthLabel}</DataTableCell>
                  <DataTableCell className="text-text-muted">{month.campaignTitle}</DataTableCell>
                  <DataTableCell className="text-text-muted">{month.participants}</DataTableCell>
                  <DataTableCell className="text-text-muted">{month.completedParticipants}</DataTableCell>
                  <DataTableCell className="font-medium text-text">{month.averageKpi.toFixed(2)}</DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </TableContainer>
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="text-sm font-medium text-text">Динамика сотрудников</h2>
        <TableContainer>
          <DataTable>
            <DataTableHead>
              <DataTableRow>
                <DataTableHeaderCell>Сотрудник</DataTableHeaderCell>
                <DataTableHeaderCell>Отдел</DataTableHeaderCell>
                {statistics.months.map((month) => (
                  <DataTableHeaderCell key={month.monthKey}>{month.monthLabel}</DataTableHeaderCell>
                ))}
                <DataTableHeaderCell>Средний KPI</DataTableHeaderCell>
                <DataTableHeaderCell>Тренд</DataTableHeaderCell>
              </DataTableRow>
            </DataTableHead>
            <DataTableBody>
              {statistics.employees.map((employee) => (
                <DataTableRow key={employee.employeeId}>
                  <DataTableCell className="text-text">{employee.employeeName}</DataTableCell>
                  <DataTableCell className="text-text-muted">{employee.department}</DataTableCell>
                  {employee.values.map((value) => (
                    <DataTableCell key={`${employee.employeeId}-${value.monthKey}`} className="text-text-muted">
                      {formatKpi(value.kpi)}
                    </DataTableCell>
                  ))}
                  <DataTableCell className="text-text">{formatKpi(employee.averageKpi)}</DataTableCell>
                  <DataTableCell className={trendClass(employee.trendDelta)}>{formatTrend(employee.trendDelta)}</DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </TableContainer>
      </Card>
    </section>
  );
};
