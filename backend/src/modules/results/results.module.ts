import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { EmployeeModule } from "../employee/employee.module";
import { EvaluationModule } from "../evaluation/evaluation.module";
import { ReportModule } from "../report/report.module";
import { SurveyModule } from "../survey/survey.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { ResultsController } from "./results.controller";
import { ResultsService } from "./results.service";

@Module({
  imports: [PrismaModule, AuthModule, EmployeeModule, SurveyModule, EvaluationModule, ReportModule],
  controllers: [ResultsController],
  providers: [ResultsService]
})
export class ResultsModule {}
