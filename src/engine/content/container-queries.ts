import type { Track } from "./types.js";

export const containerQueriesTrack: Track = {
  id: "container-queries",
  title: "コンテナクエリ",
  summary: "画面ではなく“親の幅”で切り替える、真の部品レスポンシブ。",
  emoji: "🪟",
  lessons: [
    {
      id: "cq-container-type",
      title: "コンテナにする: container-type",
      explanation:
        "<p>コンテナクエリの第一歩は、基準にする親に <code>container-type: inline-size</code> を設定することです。これでその要素の<b>幅</b>を問い合わせられるようになります。</p>",
      mdnPath: "/ja/docs/Web/CSS/container-type",
      viz: { concept: "none" },
      challenge: {
        starterHTML:
          '<div data-id="panel" class="panel"><div data-id="card" class="card">カード</div></div>',
        starterCSS:
          ".panel {\n  width: 500px;\n  background: #dbe4fb;\n  padding: 10px;\n}\n.card {\n  background: #fff;\n  padding: 8px;\n}\n",
        task: ".panel をコンテナ化しよう（container-type: inline-size）。",
        snapshot: { props: ["container-type"] },
        validators: [
          { kind: "declarationEquals", selector: ".panel", prop: "container-type", value: "inline-size" },
          { kind: "computedMatches", id: "panel", prop: "container-type", pattern: "inline-size" },
        ],
        hints: ["container-type を panel に設定します", "container-type: inline-size"],
        solution:
          ".panel {\n  container-type: inline-size;\n  width: 500px;\n  background: #dbe4fb;\n  padding: 10px;\n}\n.card {\n  background: #fff;\n  padding: 8px;\n}\n",
      },
    },
    {
      id: "cq-query",
      title: "親の幅で切り替える: @container",
      explanation:
        "<p><code>@container (min-width: 400px) { … }</code> は、最も近いコンテナの幅が条件を満たすときだけ適用されます。画面幅ではなく<b>親の幅</b>が基準です。</p>",
      mdnPath: "/ja/docs/Web/CSS/@container",
      viz: { concept: "none" },
      challenge: {
        viewport: 500,
        starterHTML:
          '<div data-id="panel" class="panel"><div data-id="card" class="card">カード</div></div>',
        starterCSS:
          ".panel {\n  container-type: inline-size;\n  width: 100%;\n  background: #dbe4fb;\n  padding: 10px;\n}\n.card {\n  background: #fff;\n  padding: 8px;\n  font-size: 14px;\n}\n",
        task: "コンテナ幅が 400px 以上のとき、.card の文字を 24px にしよう（@container を使う）。",
        snapshot: { props: ["font-size"] },
        validators: [
          { kind: "sourceMatches", pattern: "@container" },
          { kind: "computedEquals", id: "card", prop: "font-size", value: "24px" },
        ],
        // 狭いコンテナ（360px）では適用されない＝親の幅で切り替わることを検証。
        states: [
          {
            viewport: 360,
            validators: [{ kind: "computedEquals", id: "card", prop: "font-size", value: "14px" }],
          },
        ],
        hints: ["@container (min-width: 400px) { .card { … } } の形です", "font-size: 24px"],
        solution:
          ".panel {\n  container-type: inline-size;\n  width: 100%;\n  background: #dbe4fb;\n  padding: 10px;\n}\n.card {\n  background: #fff;\n  padding: 8px;\n  font-size: 14px;\n}\n@container (min-width: 400px) {\n  .card {\n    font-size: 24px;\n  }\n}\n",
      },
    },
  ],
};
