import { Module } from "@nestjs/common";
import { EmployeeModule } from "../employee/employee.module";
import { EvaluationModule } from "../evaluation/evaluation.module";
import { ReportModule } from "../report/report.module";
import { SurveyModule } from "../survey/survey.module";
import { BotService } from "./bot.service";

@Module({
  imports: [EmployeeModule, SurveyModule, EvaluationModule, ReportModule],
  providers: [BotService]
})
export class BotModule {}
