import type { Track } from "./types.js";

export const layersTrack: Track = {
  id: "layers",
  title: "カスケードレイヤー",
  summary: "@layer で優先順位を明示的に管理する。",
  emoji: "🗂️",
  lessons: [
    {
      id: "layers-order",
      title: "優先順位を決める: @layer",
      explanation:
        "<p><code>@layer base, theme;</code> のように<b>先に順序を宣言</b>すると、後のレイヤー（theme）が前のレイヤー（base）より優先されます。詳細度ではなくレイヤー順で勝敗が決まります。</p>",
      mdnPath: "/ja/docs/Web/CSS/@layer",
      viz: { concept: "none" },
      challenge: {
        starterHTML: '<div data-id="box" class="box">レイヤー</div>',
        starterCSS: "/* @layer base, theme; の順で宣言し、theme を優先させよう */\n",
        task: "base レイヤーで赤、theme レイヤーで青を指定し、青を勝たせよう（文字色）。",
        snapshot: { props: ["color"] },
        validators: [
          { kind: "sourceMatches", pattern: "@layer" },
          { kind: "computedMatches", id: "box", prop: "color", pattern: "0[,\\s]+0[,\\s]+255" },
        ],
        hints: ["@layer base, theme; で順序を先に宣言します", "@layer base { .box{color:red} } @layer theme { .box{color:blue} }"],
        solution:
          "@layer base, theme;\n@layer base {\n  .box { color: red; }\n}\n@layer theme {\n  .box { color: blue; }\n}\n",
      },
    },
  ],
};
