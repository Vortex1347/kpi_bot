import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./modules/app/app.module";
import { appConfig } from "./infrastructure/config/app-config";
import { assertProductionSecurityConfig } from "./infrastructure/config/security-config";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { appLogger } from "./common/logging/app-logger";
import { PrismaService } from "./prisma/prisma.service";

async function bootstrap() {
  assertProductionSecurityConfig();
  const app = await NestFactory.create(AppModule);

  const httpAdapter = app.getHttpAdapter();
  const server = httpAdapter.getInstance();
  server.set("trust proxy", 1);
  server.disable("x-powered-by");

  app.useGlobalFilters(new HttpExceptionFilter());
  await app.get(PrismaService).enableShutdownHooks(app);

  await app.listen(appConfig.apiPort);
  appLogger.info("backend_started", {
    port: appConfig.apiPort
  });
}

bootstrap().catch((error) => {
  appLogger.error("backend_bootstrap_failed", {
    message: error instanceof Error ? error.message : String(error)
  });
  process.exit(1);
});
