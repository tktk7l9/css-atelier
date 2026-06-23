import type { Track } from "./types.js";

export const customPropsTrack: Track = {
  id: "custom-props",
  title: "カスタムプロパティ",
  summary: "CSS 変数で値を一元管理し、var() で再利用する。",
  emoji: "🎨",
  lessons: [
    {
      id: "custom-props-define",
      title: "変数を定義して使う: --x と var()",
      explanation:
        "<p><code>--brand: #2f5fd0;</code> のように <code>--</code> で始まる名前で変数を定義し、<code>var(--brand)</code> で参照します。色やサイズの一元管理に便利です。</p>",
      mdnPath: "/ja/docs/Web/CSS/--*",
      viz: { concept: "none" },
      challenge: {
        starterHTML: '<div data-id="box" class="box"></div>',
        starterCSS:
          ".box {\n  width: 90px;\n  height: 90px;\n  border-radius: 10px;\n  background: #cccccc;\n}\n",
        task: "--brand 変数（#2f5fd0）を定義し、background に var() で使おう。",
        snapshot: { props: ["background-color"] },
        validators: [
          { kind: "sourceMatches", pattern: "--brand" },
          { kind: "sourceMatches", pattern: "var\\(\\s*--brand" },
          { kind: "computedMatches", id: "box", prop: "background-color", pattern: "47[,\\s]+95[,\\s]+208" },
        ],
        hints: ["--brand: #2f5fd0; で定義します", "background: var(--brand)"],
        solution:
          ".box {\n  --brand: #2f5fd0;\n  width: 90px;\n  height: 90px;\n  border-radius: 10px;\n  background: var(--brand);\n}\n",
      },
    },
    {
      id: "custom-props-fallback",
      title: "フォールバック付き var()",
      explanation:
        "<p><code>var(--accent, #1f9d68)</code> のように2つ目の引数を渡すと、変数が未定義のときの<b>既定値</b>になります。</p>",
      mdnPath: "/ja/docs/Web/CSS/var",
      viz: { concept: "none" },
      challenge: {
        starterHTML: '<div data-id="box" class="box"></div>',
        starterCSS:
          ".box {\n  width: 90px;\n  height: 90px;\n  border-radius: 10px;\n  background: #cccccc;\n}\n",
        task: "未定義の --accent をフォールバック付きで使い、背景を #1f9d68 にしよう。",
        snapshot: { props: ["background-color"] },
        validators: [
          { kind: "sourceMatches", pattern: "var\\(\\s*--accent\\s*," },
          { kind: "computedMatches", id: "box", prop: "background-color", pattern: "31[,\\s]+157[,\\s]+104" },
        ],
        hints: ["var(--accent, 既定値) の2引数を使います", "background: var(--accent, #1f9d68)"],
        solution:
          ".box {\n  width: 90px;\n  height: 90px;\n  border-radius: 10px;\n  background: var(--accent, #1f9d68);\n}\n",
      },
    },
  ],
};
