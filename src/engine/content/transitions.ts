import type { Track } from "./types.js";

export const transitionsTrack: Track = {
  id: "transitions",
  title: "トランジション & 変形",
  summary: "transition で滑らかに、transform で拡大・回転。",
  emoji: "🎞️",
  lessons: [
    {
      id: "transition-duration",
      title: "滑らかに変化させる: transition",
      explanation:
        "<p><code>transition</code> はプロパティの変化に時間をかけて滑らかにします。<code>transition: background 0.3s;</code> なら背景が 0.3 秒かけて変わります。</p>",
      mdnPath: "/ja/docs/Web/CSS/transition",
      viz: { concept: "none" },
      challenge: {
        starterHTML: '<div data-id="box" class="box">hover me</div>',
        starterCSS:
          ".box {\n  width: 140px;\n  padding: 14px;\n  background: #dbe4fb;\n}\n",
        task: ".box に 0.3 秒のトランジションを設定しよう。",
        snapshot: { props: ["transition-duration"] },
        validators: [
          { kind: "sourceMatches", pattern: "transition" },
          { kind: "computedEquals", id: "box", prop: "transition-duration", value: "0.3s" },
        ],
        hints: ["transition: background 0.3s; など", "0.3s = 300ms"],
        solution:
          ".box {\n  width: 140px;\n  padding: 14px;\n  background: #dbe4fb;\n  transition: background 0.3s;\n}\n",
      },
    },
    {
      id: "transform-scale",
      title: "拡大する: transform: scale()",
      explanation:
        "<p><code>transform: scale(1.2)</code> は要素を 1.2 倍に拡大します（レイアウトは動かさず見た目だけ変形）。</p>",
      mdnPath: "/ja/docs/Web/CSS/transform",
      viz: { concept: "none" },
      challenge: {
        starterHTML: '<div data-id="box" class="box"></div>',
        starterCSS: ".box {\n  width: 100px;\n  height: 100px;\n  background: #2f5fd0;\n  border-radius: 10px;\n}\n",
        task: "100px の箱を 1.2 倍（見た目 120px）に拡大しよう。",
        snapshot: { props: ["transform"] },
        validators: [
          { kind: "sourceMatches", pattern: "scale\\(" },
          { kind: "sizeApprox", id: "box", w: 120, tol: 2 },
        ],
        hints: ["transform: scale(1.2) を使います", "100 × 1.2 = 120"],
        solution:
          ".box {\n  width: 100px;\n  height: 100px;\n  background: #2f5fd0;\n  border-radius: 10px;\n  transform: scale(1.2);\n}\n",
      },
    },
  ],
};
