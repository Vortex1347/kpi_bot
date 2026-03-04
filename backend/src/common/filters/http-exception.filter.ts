import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from "@nestjs/common";
import { appLogger } from "../logging/app-logger";
import { reportError } from "../monitoring/error-monitoring";
import { REQUEST_ID_HEADER } from "../middleware/request-logging.middleware";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = isHttpException ? exception.getResponse() : "Internal server error";

    const requestId = (request.headers?.[REQUEST_ID_HEADER] as string | undefined) ?? undefined;

    const logPayload = {
      requestId,
      statusCode: status,
      path: request.url,
      method: request.method,
      message
    };

    if (status >= 500) {
      appLogger.error("http_exception", logPayload);
      reportError({
        event: "http_exception",
        statusCode: status,
        path: request.url,
        message,
        requestId
      });
    } else {
      appLogger.warn("http_exception", logPayload);
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId
    });
  }
}
