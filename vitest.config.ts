import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/engine/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
      reporter: ["text", "json-summary", "html"],
      // 純ロジック層（content / validate / tokenize / viz-map / progress）は
      // 100% を維持する。DOM・iframe・Three.js は presentation 層として対象外。
      thresholds: {
        "src/engine/**/*.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
