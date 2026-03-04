import { Injectable } from "@nestjs/common";
import { Employee } from "@prisma/client";
import ExcelJS from "exceljs";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { appConfig } from "../../infrastructure/config/app-config";
import { EmployeeService } from "../employee/employee.service";
import { KpiService } from "../kpi/kpi.service";

interface EmployeeReportFile {
  readonly employeeId: string;
  readonly employeeName: string;
  readonly filePath: string;
}

export interface ReportGenerationResult {
  readonly summaryFilePath: string;
  readonly employeeFiles: readonly EmployeeReportFile[];
}

function slugifyFileName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

@Injectable()
export class ReportService {
  constructor(
    private readonly employeeService: EmployeeService,
    private readonly kpiService: KpiService
  ) {}

  async generateCampaignReports(campaignId: string): Promise<ReportGenerationResult> {
    const employees = await this.employeeService.getEvaluatedEmployees(campaignId);
    const reportDir = path.resolve(appConfig.reportOutputDir, campaignId);
    await fs.mkdir(reportDir, { recursive: true });

    const summaryWorkbook = new ExcelJS.Workbook();
    const summarySheet = summaryWorkbook.addWorksheet("Summary");
    summarySheet.columns = [
      { header: "Сотрудник", key: "employeeName", width: 30 },
      { header: "Отдел", key: "department", width: 25 },
      { header: "Section 1 (%)", key: "section1Percent", width: 15 },
      { header: "Section 2 (%)", key: "section2Percent", width: 15 },
      { header: "KPI (%)", key: "totalPercent", width: 12 },
      { header: "KPI Bonus", key: "bonus", width: 12 }
    ];

    const employeeFiles: EmployeeReportFile[] = [];
    for (const employee of employees) {
      const result = await this.kpiService.calculateEmployeeKpi(campaignId, employee.id);
      summarySheet.addRow({
        employeeName: employee.fullName,
        department: employee.department,
        section1Percent: result.section1Percent,
        section2Percent: result.section2Percent,
        totalPercent: result.totalPercent,
        bonus: 0
      });

      const filePath = await this.generateEmployeeWorkbook(reportDir, employee, result);
      employeeFiles.push({
        employeeId: employee.id,
        employeeName: employee.fullName,
        filePath
      });
    }

    const summaryFilePath = path.join(reportDir, "kpi_summary.xlsx");
    await summaryWorkbook.xlsx.writeFile(summaryFilePath);

    return {
      summaryFilePath,
      employeeFiles
    };
  }

  private async generateEmployeeWorkbook(
    reportDir: string,
    employee: Employee,
    result: Awaited<ReturnType<KpiService["calculateEmployeeKpi"]>>
  ): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("KPI");

    sheet.columns = [
      { header: "Категория KPI", key: "question", width: 45 },
      { header: "Вес (%)", key: "weightPercent", width: 12 },
      { header: "Оценка (%)", key: "score", width: 12 },
      { header: "Вклад (%)", key: "contribution", width: 12 }
    ];

    sheet.addRow(["Сотрудник", employee.fullName]);
    sheet.addRow(["Отдел", employee.department]);
    sheet.addRow([]);

    for (const item of result.questionResults) {
      sheet.addRow({
        question: item.text,
        weightPercent: item.weightPercent,
        score: item.score,
        contribution: Number(item.weightedContribution.toFixed(2))
      });
    }

    sheet.addRow([]);
    sheet.addRow(["Section 1 (%)", result.section1Percent]);
    sheet.addRow(["Section 2 (%)", result.section2Percent]);
    sheet.addRow(["Итоговый KPI (%)", result.totalPercent]);
    sheet.addRow(["KPI Bonus", 0]);

    const baseName = slugifyFileName(employee.fullName) || "employee";
    const filePath = path.join(reportDir, `kpi_${baseName}.xlsx`);
    await workbook.xlsx.writeFile(filePath);

    return filePath;
  }
}
