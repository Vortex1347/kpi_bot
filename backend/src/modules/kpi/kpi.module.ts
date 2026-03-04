import { Module } from "@nestjs/common";
import { EvaluationModule } from "../evaluation/evaluation.module";
import { KpiService } from "./kpi.service";

@Module({
  imports: [EvaluationModule],
  providers: [KpiService],
  exports: [KpiService]
})
export class KpiModule {}
