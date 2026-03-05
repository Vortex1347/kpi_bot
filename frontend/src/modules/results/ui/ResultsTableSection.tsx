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
import type { ResultsQuestion, ResultsRow } from "../model/types";

interface ResultsTableSectionProps {
  readonly questions: readonly ResultsQuestion[];
  readonly rows: readonly ResultsRow[];
  readonly isLoading: boolean;
}

function renderScore(score: number | null): string {
  if (score === null) return "—";
  if (score === 0) return "60 or less";
  return String(score);
}

export const ResultsTableSection = ({ questions, rows, isLoading }: ResultsTableSectionProps) => {
  if (isLoading) {
    return <LoadingState className="px-3 py-4" label="Загрузка результатов..." />;
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="Нет данных по ответам"
        description="Запустите KPI-кампанию в CRM и дождитесь первых ответов сотрудников в Telegram."
      />
    );
  }

  return (
    <TableContainer>
      <DataTable>
        <DataTableHead>
          <DataTableRow>
            <DataTableHeaderCell>Сотрудник</DataTableHeaderCell>
            <DataTableHeaderCell>Отдел</DataTableHeaderCell>
            <DataTableHeaderCell>Заполнено</DataTableHeaderCell>
            <DataTableHeaderCell>Статус</DataTableHeaderCell>
            {questions.map((question) => (
              <DataTableHeaderCell key={question.id} title={`${question.text} (${question.weightPercent}%)`}>
                {question.label}
              </DataTableHeaderCell>
            ))}
            <DataTableHeaderCell>KPI %</DataTableHeaderCell>
          </DataTableRow>
        </DataTableHead>
        <DataTableBody>
          {rows.map((row) => (
            <DataTableRow key={row.employeeId}>
              <DataTableCell className="text-text">{row.employeeName}</DataTableCell>
              <DataTableCell className="text-text-muted">{row.department}</DataTableCell>
              <DataTableCell className="text-text-muted">{`${row.answeredCount}/${questions.length}`}</DataTableCell>
              <DataTableCell className={row.isCompleted ? "text-success" : "text-warning"}>
                {row.isCompleted ? "completed" : "in progress"}
              </DataTableCell>
              {row.answers.map((answer) => (
                <DataTableCell key={`${row.employeeId}-${answer.questionId}`} className="text-text-muted">
                  {renderScore(answer.score)}
                </DataTableCell>
              ))}
              <DataTableCell className="font-semibold text-text">{row.totalPercent.toFixed(2)}</DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </TableContainer>
  );
};
