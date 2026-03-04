import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { SurveyService } from "./survey.service";

@Module({
  imports: [PrismaModule],
  providers: [SurveyService],
  exports: [SurveyService]
})
export class SurveyModule {}
