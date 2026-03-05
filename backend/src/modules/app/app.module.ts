import { MiddlewareConsumer, Module, type NestModule, RequestMethod } from "@nestjs/common";
import { RequestLoggingMiddleware } from "../../common/middleware/request-logging.middleware";
import { HealthModule } from "../health/health.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import { EmployeeModule } from "../employee/employee.module";
import { SurveyModule } from "../survey/survey.module";
import { EvaluationModule } from "../evaluation/evaluation.module";
import { KpiModule } from "../kpi/kpi.module";
import { ReportModule } from "../report/report.module";
import { BotModule } from "../bot/bot.module";
import { ResultsModule } from "../results/results.module";
import { AppController } from "./app.controller";

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    EmployeeModule,
    SurveyModule,
    EvaluationModule,
    KpiModule,
    ReportModule,
    BotModule,
    ResultsModule
  ],
  controllers: [AppController],
  providers: [RequestLoggingMiddleware]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggingMiddleware).forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
