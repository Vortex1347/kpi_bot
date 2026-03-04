import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      name: "kpi-telegram-bot-backend",
      version: "1.0.0"
    };
  }
}
