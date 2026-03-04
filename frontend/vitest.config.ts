import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.spec.ts", "src/**/*.integration.spec.ts"],
    coverage: {
      provider: "istanbul",
      reportsDirectory: "coverage",
      reporter: ["text", "lcov", "html"],
      include: [
        "src/shared/api/http.ts",
        "src/app/runtimeConfig.ts",
        "src/router/routes.ts",
        "src/modules/auth/api/authApi.ts",
        "src/modules/users/api/usersApi.ts",
        "src/modules/auth/authStore.ts"
      ]
    }
  }
});
