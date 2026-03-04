import { Module } from "@nestjs/common";
import { EmployeeModule } from "../employee/employee.module";
import { EvaluationModule } from "../evaluation/evaluation.module";
import { KpiModule } from "../kpi/kpi.module";
import { ReportService } from "./report.service";

@Module({
  imports: [EmployeeModule, EvaluationModule, KpiModule],
  providers: [ReportService],
  exports: [ReportService]
})
export class ReportModule {}
