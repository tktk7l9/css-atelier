import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

/** Content modules other than the catalogue (src/engine/content/index.ts). */
const LESSON_MODULE = /\/src\/engine\/content\/(?!index\.ts$)[^/]+\.ts$/;
const PRECACHE_SLOT = "const PRECACHE = [];";
const ASSETS_SLOT = "const ASSETS = [];";

/**
 * Lesson content is split per track: src/engine/content/index.ts loads each
 * track module with import(), so only the catalogue ships in the initial
 * bundle. This plugin keeps that split honest and makes it work offline:
 * - the build fails if a track module lands in the initial bundle;
 * - sw.js is emitted from src/sw.js with the chunks to precache filled in:
 *   the lesson runtime and every track (not the Three.js visualizer, which
 *   only the 3D lessons load), plus the list of all hashed assets so the
 *   worker can drop an earlier build's. The lists change with each build,
 *   which is also what makes browsers install the new worker.
 */
function lessonChunks(): Plugin {
  let root = ".";
  return {
    name: "css-atelier:lesson-chunks",
    apply: "build",
    configResolved(config) {
      root = config.root;
    },
    generateBundle(_options, bundle) {
      const chunks = Object.values(bundle).flatMap((f) => (f.type === "chunk" ? [f] : []));
      const entry = chunks.find((c) => c.isEntry);
      if (!entry) return this.error("no entry chunk");
      const leaked = entry.moduleIds.filter((id) => LESSON_MODULE.test(id));
      if (leaked.length > 0) {
        this.error(`lesson content is in the initial bundle: ${leaked.join(", ")}`);
      }

      const precache = new Set<string>();
      const visit = (fileName: string): void => {
        if (precache.has(fileName)) return;
        precache.add(fileName);
        const chunk = bundle[fileName];
        if (chunk?.type !== "chunk") return;
        chunk.imports.forEach(visit);
        chunk.viteMetadata?.importedCss.forEach((css) => precache.add(css));
      };
      for (const chunk of chunks) {
        const id = chunk.facadeModuleId ?? "";
        if (chunk.isDynamicEntry && (LESSON_MODULE.test(id) || id.endsWith("/src/app.ts"))) {
          visit(chunk.fileName);
        }
      }

      const template = readFileSync(resolve(root, "src/sw.js"), "utf8");
      for (const slot of [PRECACHE_SLOT, ASSETS_SLOT]) {
        if (!template.includes(slot)) this.error(`src/sw.js has no "${slot}" line`);
      }
      const paths = (names: Iterable<string>): string =>
        JSON.stringify([...names].sort().map((f) => `/${f}`), null, 2);
      const assets = Object.keys(bundle).filter((f) => f.startsWith("assets/"));
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: template
          .replace(PRECACHE_SLOT, `const PRECACHE = ${paths(precache)};`)
          .replace(ASSETS_SLOT, `const ASSETS = ${paths(assets)};`),
      });
    },
  };
}

export default defineConfig({
  plugins: [lessonChunks()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: "es2022",
    // Avoid the inline module-preload polyfill script so the CSP needs no
    // 'unsafe-inline' for scripts (es2022 targets support modulepreload natively).
    modulePreload: { polyfill: false },
  },
});
