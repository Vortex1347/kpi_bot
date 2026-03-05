export interface ResultsCampaign {
  readonly id: string;
  readonly title: string;
  readonly assessmentMonth: string;
  readonly status: string;
  readonly startedAt: string | null;
  readonly closedAt: string | null;
  readonly createdAt: string;
}

export interface ResultsQuestion {
  readonly id: string;
  readonly code: string;
  readonly label: string;
  readonly text: string;
  readonly section: string;
  readonly weightPercent: number;
  readonly sortOrder: number;
}

export interface ResultsAnswer {
  readonly questionId: string;
  readonly questionCode: string;
  readonly questionLabel: string;
  readonly score: number | null;
}

export interface ResultsRow {
  readonly employeeId: string;
  readonly employeeName: string;
  readonly department: string;
  readonly answeredCount: number;
  readonly isCompleted: boolean;
  readonly completedAt: string | null;
  readonly section1Percent: number;
  readonly section2Percent: number;
  readonly totalPercent: number;
  readonly answers: readonly ResultsAnswer[];
}

export interface CampaignResultsResponse {
  readonly campaign: ResultsCampaign | null;
  readonly questions: readonly ResultsQuestion[];
  readonly rows: readonly ResultsRow[];
}

export interface MonthlyKpiCampaignStat {
  readonly monthKey: string;
  readonly monthLabel: string;
  readonly campaignId: string;
  readonly campaignTitle: string;
  readonly campaignStatus: string;
  readonly participants: number;
  readonly completedParticipants: number;
  readonly averageKpi: number;
}

export interface MonthlyKpiEmployeeValue {
  readonly monthKey: string;
  readonly campaignId: string;
  readonly kpi: number | null;
}

export interface MonthlyKpiEmployeeStat {
  readonly employeeId: string;
  readonly employeeName: string;
  readonly department: string;
  readonly averageKpi: number | null;
  readonly trendDelta: number | null;
  readonly values: readonly MonthlyKpiEmployeeValue[];
}

export interface MonthlyKpiStatisticsResponse {
  readonly months: readonly MonthlyKpiCampaignStat[];
  readonly employees: readonly MonthlyKpiEmployeeStat[];
}

export interface StartCampaignActionResponse {
  readonly ok: true;
  readonly message: string;
  readonly campaign: ResultsCampaign;
  readonly participants: number;
}

export interface CloseCampaignActionResponse {
  readonly ok: true;
  readonly message: string;
  readonly campaign: ResultsCampaign;
}

export interface ExportExcelActionResponse {
  readonly ok: true;
  readonly message: string;
  readonly campaign: ResultsCampaign;
  readonly summaryFilePath: string;
  readonly employeeFiles: readonly {
    readonly employeeId: string;
    readonly employeeName: string;
    readonly filePath: string;
  }[];
}
