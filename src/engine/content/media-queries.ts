import type { Track } from "./types.js";

export const mediaQueriesTrack: Track = {
  id: "media-queries",
  title: "メディアクエリ",
  summary: "画面幅に応じてスタイルを切り替える、レスポンシブの基本。",
  emoji: "📱",
  lessons: [
    {
      id: "media-max-width",
      title: "狭い画面で切り替える: @media (max-width)",
      explanation:
        "<p><code>@media (max-width: 400px) { … }</code> は画面（ビューポート）幅が 400px 以下のときだけ適用されます。プレビューは幅 380px に固定しています。</p>",
      mdnPath: "/ja/docs/Web/CSS/@media",
      viz: { concept: "none" },
      challenge: {
        viewport: 380,
        starterHTML: '<div data-id="box" class="box">レスポンシブ</div>',
        starterCSS:
          ".box {\n  padding: 12px;\n  background: #dbe4fb;\n  font-size: 20px;\n}\n",
        task: "画面幅 400px 以下のとき、.box の文字を 14px にしよう（@media を使う）。",
        snapshot: { props: ["font-size"] },
        validators: [
          { kind: "sourceMatches", pattern: "@media" },
          { kind: "computedEquals", id: "box", prop: "font-size", value: "14px" },
        ],
        // 広い幅では適用されない（=条件付き）ことも検証し、無条件指定を防ぐ。
        states: [
          {
            viewport: 600,
            validators: [{ kind: "computedEquals", id: "box", prop: "font-size", value: "20px" }],
          },
        ],
        hints: ["@media (max-width: 400px) { .box { … } } の形です", "font-size: 14px"],
        solution:
          ".box {\n  padding: 12px;\n  background: #dbe4fb;\n  font-size: 20px;\n}\n@media (max-width: 400px) {\n  .box {\n    font-size: 14px;\n  }\n}\n",
      },
    },
    {
      id: "media-min-width",
      title: "広い画面で切り替える: @media (min-width)",
      explanation:
        "<p><code>@media (min-width: 600px) { … }</code> は幅が 600px 以上のときに適用されます。ここではプレビューを 720px に固定しています。</p>",
      mdnPath: "/ja/docs/Web/CSS/@media",
      viz: { concept: "none" },
      challenge: {
        viewport: 720,
        starterHTML: '<div data-id="box" class="box">ワイド表示</div>',
        starterCSS:
          ".box {\n  padding: 12px;\n  background: #dbe4fb;\n}\n",
        task: "画面幅 600px 以上のとき、.box の背景を #1f9d68 にしよう。",
        snapshot: { props: ["background-color"] },
        validators: [
          { kind: "sourceMatches", pattern: "@media" },
          { kind: "computedMatches", id: "box", prop: "background-color", pattern: "31[,\\s]+157[,\\s]+104" },
        ],
        // 狭い幅では元の背景（#dbe4fb）のままであることも検証する。
        states: [
          {
            viewport: 400,
            validators: [
              { kind: "computedMatches", id: "box", prop: "background-color", pattern: "219[,\\s]+228[,\\s]+251" },
            ],
          },
        ],
        hints: ["@media (min-width: 600px) { .box { … } }", "background: #1f9d68"],
        solution:
          ".box {\n  padding: 12px;\n  background: #dbe4fb;\n}\n@media (min-width: 600px) {\n  .box {\n    background: #1f9d68;\n  }\n}\n",
      },
    },
  ],
};
