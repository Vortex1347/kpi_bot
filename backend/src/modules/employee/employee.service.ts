import { Injectable } from "@nestjs/common";
import { Employee, UserRole } from "@prisma/client";
import { appConfig } from "../../infrastructure/config/app-config";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  async registerEmployee(telegramId: string, fullName: string, department: string): Promise<Employee> {
    const normalizedName = fullName.trim();
    const normalizedDepartment = department.trim();
    const role = telegramId === appConfig.leadTelegramId ? UserRole.LEAD : UserRole.EMPLOYEE;

    return this.prisma.employee.upsert({
      where: { telegramId },
      create: {
        telegramId,
        fullName: normalizedName,
        department: normalizedDepartment,
        role
      },
      update: {
        fullName: normalizedName,
        department: normalizedDepartment,
        role
      }
    });
  }

  async getByTelegramId(telegramId: string): Promise<Employee | null> {
    return this.prisma.employee.findUnique({
      where: { telegramId }
    });
  }

  async getAllEmployees(): Promise<Employee[]> {
    return this.prisma.employee.findMany({
      orderBy: { fullName: "asc" }
    });
  }

  async getEvaluatedEmployees(campaignId: string): Promise<Employee[]> {
    return this.prisma.employee.findMany({
      where: {
        responses: {
          some: {
            campaignId
          }
        }
      },
      orderBy: { fullName: "asc" }
    });
  }
}
