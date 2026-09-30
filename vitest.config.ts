import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Load styles.css for real so styles.test.ts can read it via "?raw".
    css: { include: [/styles\.css/] },
    coverage: {
      provider: "v8",
      include: ["src/engine/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
      reporter: ["text", "json-summary", "html"],
      // Keep the pure logic layer (content / validate / tokenize / viz-map / progress)
      // at 100%. DOM, iframes, and Three.js are excluded as the presentation layer.
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
