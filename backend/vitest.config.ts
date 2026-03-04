import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.spec.ts"],
    coverage: {
      provider: "istanbul",
      reportsDirectory: "coverage",
      reporter: ["text", "lcov", "html"],
      include: [
        "src/modules/health/health.service.ts",
        "src/modules/kpi/kpi.service.ts",
        "src/modules/evaluation/evaluation.service.ts",
        "src/modules/survey/survey.service.ts"
      ]
    }
  }
});
