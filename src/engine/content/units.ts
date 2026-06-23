import type { Track } from "./types.js";

export const unitsTrack: Track = {
  id: "units",
  title: "単位と関数値",
  summary: "% ・ clamp() ・ min() — 柔軟なサイズ指定。",
  emoji: "📐",
  lessons: [
    {
      id: "units-percent",
      title: "親に対する割合: %",
      explanation:
        "<p>パーセント幅は<b>親要素の幅</b>を基準にします。<code>width: 50%</code> なら親の半分です。</p>",
      mdnPath: "/ja/docs/Web/CSS/percentage",
      viz: { concept: "none" },
      challenge: {
        starterHTML: '<div data-id="track" class="track"><div data-id="fill" class="fill"></div></div>',
        starterCSS:
          ".track {\n  width: 200px;\n  height: 24px;\n  background: #e3e9f7;\n}\n.fill {\n  width: 20px;\n  height: 24px;\n  background: #2f5fd0;\n}\n",
        task: "バーを親の幅のちょうど半分（50%）にしよう。",
        snapshot: { props: ["width"] },
        validators: [{ kind: "sizeApprox", id: "fill", w: 100, tol: 2 }],
        hints: ["親の幅 200px の半分は…", "width: 50%"],
        solution:
          ".track {\n  width: 200px;\n  height: 24px;\n  background: #e3e9f7;\n}\n.fill {\n  width: 50%;\n  height: 24px;\n  background: #2f5fd0;\n}\n",
      },
    },
    {
      id: "units-clamp",
      title: "下限・推奨・上限: clamp()",
      explanation:
        "<p><code>clamp(最小, 推奨, 最大)</code> は値を範囲内に収めます。<code>clamp(100px, 50%, 140px)</code> は、50%が140pxを超えると140pxで頭打ちになります。</p>",
      mdnPath: "/ja/docs/Web/CSS/clamp",
      viz: { concept: "none" },
      challenge: {
        starterHTML: '<div data-id="track" class="track"><div data-id="fill" class="fill"></div></div>',
        starterCSS:
          ".track {\n  width: 400px;\n  height: 24px;\n  background: #e3e9f7;\n}\n.fill {\n  width: 20px;\n  height: 24px;\n  background: #2f5fd0;\n}\n",
        task: "幅を clamp(100px, 50%, 140px) にしよう（親400pxなので上限の140pxになる）。",
        snapshot: { props: ["width"] },
        validators: [
          { kind: "sourceMatches", pattern: "clamp\\(" },
          { kind: "sizeApprox", id: "fill", w: 140, tol: 2 },
        ],
        hints: ["clamp(最小, 推奨, 最大) の形です", "width: clamp(100px, 50%, 140px)"],
        solution:
          ".track {\n  width: 400px;\n  height: 24px;\n  background: #e3e9f7;\n}\n.fill {\n  width: clamp(100px, 50%, 140px);\n  height: 24px;\n  background: #2f5fd0;\n}\n",
      },
    },
    {
      id: "units-min",
      title: "小さい方を採用: min()",
      explanation:
        "<p><code>min(300px, 100%)</code> は2つのうち<b>小さい方</b>を採用します。親が狭いときは 100%、広いときは 300px が上限になります。</p>",
      mdnPath: "/ja/docs/Web/CSS/min",
      viz: { concept: "none" },
      challenge: {
        starterHTML: '<div data-id="track" class="track"><div data-id="fill" class="fill"></div></div>',
        starterCSS:
          ".track {\n  width: 200px;\n  height: 24px;\n  background: #e3e9f7;\n}\n.fill {\n  width: 20px;\n  height: 24px;\n  background: #2f5fd0;\n}\n",
        task: "幅を min(300px, 100%) にしよう（親200pxなので200pxに収まる）。",
        snapshot: { props: ["width"] },
        validators: [
          { kind: "sourceMatches", pattern: "min\\(" },
          { kind: "sizeApprox", id: "fill", w: 200, tol: 2 },
        ],
        hints: ["min(値1, 値2) は小さい方を選びます", "width: min(300px, 100%)"],
        solution:
          ".track {\n  width: 200px;\n  height: 24px;\n  background: #e3e9f7;\n}\n.fill {\n  width: min(300px, 100%);\n  height: 24px;\n  background: #2f5fd0;\n}\n",
      },
    },
  ],
};
