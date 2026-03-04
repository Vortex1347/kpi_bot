import { Injectable } from "@nestjs/common";
import { EvaluationService } from "../evaluation/evaluation.service";

export interface KpiQuestionResult {
  readonly questionId: string;
  readonly section: string;
  readonly text: string;
  readonly weightPercent: number;
  readonly score: number;
  readonly weightedContribution: number;
}

export interface KpiCalculationResult {
  readonly totalPercent: number;
  readonly section1Percent: number;
  readonly section2Percent: number;
  readonly questionResults: readonly KpiQuestionResult[];
}

@Injectable()
export class KpiService {
  constructor(private readonly evaluationService: EvaluationService) {}

  async calculateEmployeeKpi(campaignId: string, employeeId: string): Promise<KpiCalculationResult> {
    const [questions, responses] = await Promise.all([
      this.evaluationService.getQuestions(),
      this.evaluationService.getEmployeeResponses(campaignId, employeeId)
    ]);

    const responseMap = new Map(responses.map((item) => [item.questionId, item.score]));
    const questionResults: KpiQuestionResult[] = questions.map((question) => {
      const score = responseMap.get(question.id) ?? 0;
      const weightedContribution = (score * question.weightPercent) / 100;

      return {
        questionId: question.id,
        section: question.section,
        text: question.text,
        weightPercent: question.weightPercent,
        score,
        weightedContribution
      };
    });

    const totalPercent = Number(
      questionResults.reduce((acc, item) => acc + item.weightedContribution, 0).toFixed(2)
    );

    const section1Percent = Number(
      questionResults
        .filter((item) => item.section === "SECTION_1")
        .reduce((acc, item) => acc + item.weightedContribution, 0)
        .toFixed(2)
    );

    const section2Percent = Number(
      questionResults
        .filter((item) => item.section === "SECTION_2")
        .reduce((acc, item) => acc + item.weightedContribution, 0)
        .toFixed(2)
    );

    return {
      totalPercent,
      section1Percent,
      section2Percent,
      questionResults
    };
  }
}
