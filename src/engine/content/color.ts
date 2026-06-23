import type { Track } from "./types.js";

export const colorTrack: Track = {
  id: "color",
  title: "色の指定",
  summary: "hsl() と oklch() — 直感的・知覚均等なモダンカラー。",
  emoji: "🌈",
  lessons: [
    {
      id: "color-hsl",
      title: "色相・彩度・明度: hsl()",
      explanation:
        "<p><code>hsl(色相, 彩度, 明度)</code> は人間に分かりやすい色指定です。色相は 0–360 の角度（0=赤, 120=緑, 240=青）です。</p>",
      mdnPath: "/ja/docs/Web/CSS/color_value/hsl",
      viz: { concept: "none" },
      challenge: {
        starterHTML: '<div data-id="box" class="box"></div>',
        starterCSS: ".box {\n  width: 90px;\n  height: 90px;\n  border-radius: 10px;\n}\n",
        task: "背景を hsl() で青系（例: hsl(220, 70%, 50%)）にしよう。",
        snapshot: { props: ["background-color"] },
        validators: [
          { kind: "sourceMatches", pattern: "hsl\\(" },
          { kind: "computedMatches", id: "box", prop: "background-color", pattern: "rgb\\(" },
        ],
        hints: ["background: hsl(220, 70%, 50%)"],
        solution:
          ".box {\n  width: 90px;\n  height: 90px;\n  border-radius: 10px;\n  background: hsl(220, 70%, 50%);\n}\n",
      },
    },
    {
      id: "color-oklch",
      title: "知覚均等な色: oklch()",
      explanation:
        "<p><code>oklch(明度 彩度 色相)</code> は知覚的に均等で、明るさを保ったまま色を変えやすい新しい色空間です。</p>",
      mdnPath: "/ja/docs/Web/CSS/color_value/oklch",
      viz: { concept: "none" },
      challenge: {
        starterHTML: '<div data-id="box" class="box"></div>',
        starterCSS: ".box {\n  width: 90px;\n  height: 90px;\n  border-radius: 10px;\n}\n",
        task: "背景を oklch() で指定しよう（例: oklch(0.6 0.15 250)）。",
        snapshot: { props: ["background-color"] },
        validators: [
          { kind: "sourceMatches", pattern: "oklch\\(" },
          { kind: "computedMatches", id: "box", prop: "background-color", pattern: "oklch|rgb\\(|color\\(" },
        ],
        hints: ["background: oklch(0.6 0.15 250)"],
        solution:
          ".box {\n  width: 90px;\n  height: 90px;\n  border-radius: 10px;\n  background: oklch(0.6 0.15 250);\n}\n",
      },
    },
  ],
};
