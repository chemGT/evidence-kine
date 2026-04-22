import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    css: false,
    coverage: {
      provider: "v8",
      include: ["src/logic/**/*.ts", "src/data/**/*.ts"],
      exclude: ["**/__tests__/**", "**/*.test.ts"],
      reporter: ["text", "html"],
      // Seuils alignés sur `.ai/rules/qa-agent.md` :
      //   - Global (src/data/**, src/logic/**) : plancher 80 %.
      //   - src/logic/** (logique pure) : ≥ 95 % lignes + branches.
      //   - src/logic/bayesian/** : 100 % (régression = bloquant).
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
        "src/logic/**/*.ts": {
          statements: 95,
          branches: 95,
          functions: 95,
          lines: 95,
        },
        "src/logic/bayesian/**/*.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
