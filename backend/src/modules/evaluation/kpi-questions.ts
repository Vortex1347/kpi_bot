export interface QuestionTemplate {
  readonly code: string;
  readonly section: "SECTION_1" | "SECTION_2";
  readonly text: string;
  readonly weightPercent: number;
  readonly sortOrder: number;
}

// Весовая модель согласована с пользователем:
// SECTION_1 = 70% (внутри 70/30), SECTION_2 = 30% (внутри 60/20/20).
export const KPI_QUESTION_TEMPLATES: readonly QuestionTemplate[] = [
  {
    code: "Q1_TESTING_QUALITY",
    section: "SECTION_1",
    text: "Эффективность и качество тестирования",
    weightPercent: 49,
    sortOrder: 1
  },
  {
    code: "Q2_DEADLINE",
    section: "SECTION_1",
    text: "Соблюдение сроков",
    weightPercent: 21,
    sortOrder: 2
  },
  {
    code: "Q3_DISCIPLINE",
    section: "SECTION_2",
    text: "Дисциплина и пунктуальность",
    weightPercent: 18,
    sortOrder: 3
  },
  {
    code: "Q4_INITIATIVE",
    section: "SECTION_2",
    text: "Инициативность",
    weightPercent: 6,
    sortOrder: 4
  },
  {
    code: "Q5_COMMUNICATION",
    section: "SECTION_2",
    text: "Коммуникация и командная работа",
    weightPercent: 6,
    sortOrder: 5
  }
] as const;

export const KPI_SCORE_OPTIONS = [100, 90, 80, 70, 0] as const;

export type KpiScore = (typeof KPI_SCORE_OPTIONS)[number];
