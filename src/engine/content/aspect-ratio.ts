import type { Track } from "./types.js";

export const aspectRatioTrack: Track = {
  id: "aspect-ratio",
  title: "アスペクト比",
  summary: "aspect-ratio で幅から高さを自動計算する。",
  emoji: "🖼️",
  lessons: [
    {
      id: "aspect-ratio-16-9",
      title: "16:9 を保つ: aspect-ratio",
      explanation:
        "<p><code>aspect-ratio: 16 / 9</code> は、幅に対して高さを比率で自動計算します。動画やサムネイルの枠に便利です。</p>",
      mdnPath: "/ja/docs/Web/CSS/aspect-ratio",
      viz: { concept: "none" },
      challenge: {
        starterHTML: '<div data-id="frame" class="frame"></div>',
        starterCSS: ".frame {\n  width: 320px;\n  background: #2f5fd0;\n  border-radius: 8px;\n}\n",
        task: "幅 320px のまま、16:9 の比率（高さ 180px）になるようにしよう。",
        snapshot: { props: ["aspect-ratio"] },
        validators: [
          { kind: "sourceMatches", pattern: "aspect-ratio" },
          { kind: "sizeApprox", id: "frame", h: 180, tol: 2 },
        ],
        hints: ["aspect-ratio: 16 / 9 を指定します", "320 × 9 / 16 = 180"],
        solution:
          ".frame {\n  width: 320px;\n  aspect-ratio: 16 / 9;\n  background: #2f5fd0;\n  border-radius: 8px;\n}\n",
      },
    },
  ],
};
