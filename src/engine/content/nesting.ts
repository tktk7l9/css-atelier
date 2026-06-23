import type { Track } from "./types.js";

export const nestingTrack: Track = {
  id: "nesting",
  title: "ネスト",
  summary: "& を使って入れ子でルールを書く（プリプロセッサ不要）。",
  emoji: "🪆",
  lessons: [
    {
      id: "nesting-amp",
      title: "入れ子で書く: & とネスト",
      explanation:
        "<p>CSS ネストでは、ルールの中に別のルールを入れ子にできます。<code>&</code> は<b>親セレクタ</b>を指します。<code>.card { &amp; a { … } }</code> は <code>.card a</code> と同じ意味です。</p>",
      mdnPath: "/ja/docs/Web/CSS/CSS_nesting",
      viz: { concept: "none" },
      challenge: {
        starterHTML: '<div data-id="card" class="card"><a data-id="link" href="#">カード内リンク</a></div>',
        starterCSS: ".card {\n  padding: 10px;\n  \n}\n",
        task: ".card の中にネストし、& a で内側のリンクの色を #2f5fd0 にしよう。",
        snapshot: { props: ["color"] },
        validators: [
          { kind: "sourceMatches", pattern: "&" },
          { kind: "computedMatches", id: "link", prop: "color", pattern: "47[,\\s]+95[,\\s]+208" },
        ],
        hints: [".card { … } の中に & a { … } を書きます", "color: #2f5fd0"],
        solution: ".card {\n  padding: 10px;\n  & a {\n    color: #2f5fd0;\n  }\n}\n",
      },
    },
  ],
};
