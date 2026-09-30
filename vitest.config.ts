import { defineConfig } from "vitest/config";

// UI layer measured with jsdom + Testing Library: the shell, the lesson runtime,
// the DOM helpers, the sandbox (iframe I/O boundary) and the visualizer manager.
// Three.js rendering itself (viz/renderer.ts, viz/concepts.ts) needs WebGL and
// stays out of coverage.
const UI_GLOBS = ["src/main.ts", "src/app.ts", "src/ui/**/*.ts", "src/sandbox/**/*.ts", "src/viz/index.ts"];

export default defineConfig({
  test: {
    globals: true,
    // Pure engine tests run in node; UI tests opt into jsdom with a
    // `@vitest-environment jsdom` docblock.
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Load styles.css for real so styles.test.ts can read it via "?raw".
    css: { include: [/styles\.css/] },
    coverage: {
      provider: "v8",
      include: ["src/engine/**/*.ts", ...UI_GLOBS],
      exclude: ["src/**/*.test.ts"],
      reporter: ["text", "json-summary", "html"],
      thresholds: {
        // Keep the pure logic layer (content / validate / tokenize / viz-map / progress)
        // at 100%.
        "src/engine/**/*.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        // UI layer (aggregate): behavioural tests through the DOM. Set about three
        // points under the measured value so a small refactor does not flake.
        [`{${UI_GLOBS.join(",")}}`]: {
          statements: 96,
          branches: 89,
          functions: 96,
          lines: 96,
        },
      },
    },
  },
});
