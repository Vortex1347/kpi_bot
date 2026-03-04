import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { SurveyModule } from "../survey/survey.module";
import { EvaluationService } from "./evaluation.service";

@Module({
  imports: [PrismaModule, SurveyModule],
  providers: [EvaluationService],
  exports: [EvaluationService]
})
export class EvaluationModule {}
