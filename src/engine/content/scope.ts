import type { Track } from "./types.js";

// Brand blue #2f5fd0 = rgb(47, 95, 208); body text #18203a = rgb(24, 32, 58).
const BRAND = "47[,\\s]+95[,\\s]+208";
const INK = "24[,\\s]+32[,\\s]+58";

export const scopeTrack: Track = {
  id: "scope",
  title: "スコープ付きスタイル",
  summary: "@scope で、スタイルが届く範囲を DOM の部分木に区切る。",
  emoji: "🔭",
  lessons: [
    {
      id: "scope-root",
      title: "範囲を決める: @scope (ルート)",
      explanation:
        "<p><code>@scope (.card) { … }</code> の中に書いたルールは、<b>.card の中の要素だけ</b>に当たります。<code>.card .title</code> のように親を毎回書かなくても、外にある同名のクラスを巻き込みません。</p><p>ブロックの中では <code>:scope</code> がスコープのルート（ここでは .card 自身）を指します。</p><p>Baseline 2026（Chrome 118 / Firefox 146 / Safari 26.4 以降で利用可。2026 年 3 月に主要ブラウザがそろいました）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/At-rules/@scope",
      viz: { concept: "none" },
      challenge: {
        starterHTML:
          '<h3 data-id="outside" class="title">ページの見出し</h3><div data-id="card" class="card"><h3 data-id="inside" class="title">カードの見出し</h3><p>本文</p></div>',
        starterCSS:
          ".title {\n  margin: 0 0 8px;\n  font-size: 18px;\n}\n.card {\n  width: 240px;\n  padding: 12px;\n  border: 2px solid #dbe4fb;\n}\n",
        task: "@scope (.card) を使って、カードの中の .title だけをブランド色（#2f5fd0）に、カード自身（:scope）の枠線を同じ色にしよう。外の見出しの色は変えない。",
        snapshot: { props: ["color", "border-top-color"] },
        validators: [
          { kind: "sourceMatches", pattern: "@scope\\s*\\(\\s*\\.card\\s*\\)", message: "@scope (.card) { … } の中に書きましょう" },
          { kind: "computedMatches", id: "inside", prop: "color", pattern: BRAND, message: "カードの中の見出しがブランド色になっていません" },
          { kind: "computedMatches", id: "outside", prop: "color", pattern: INK, message: "カードの外の見出しまで色が変わっています" },
          { kind: "computedMatches", id: "card", prop: "border-top-color", pattern: BRAND, message: ":scope でカード自身の枠線をブランド色にしましょう" },
        ],
        hints: ["@scope (.card) { .title { … } } と書くと、.card の中の .title だけに当たります", "ブロックの中の :scope { border-color: #2f5fd0; } はカード自身を指します"],
        solution:
          ".title {\n  margin: 0 0 8px;\n  font-size: 18px;\n}\n.card {\n  width: 240px;\n  padding: 12px;\n  border: 2px solid #dbe4fb;\n}\n@scope (.card) {\n  :scope {\n    border-color: #2f5fd0;\n  }\n  .title {\n    color: #2f5fd0;\n  }\n}\n",
      },
    },
    {
      id: "scope-donut",
      title: "穴のあいた範囲: @scope (…) to (…)",
      explanation:
        "<p><code>@scope (.card) to (.content) { … }</code> と <code>to</code> で<b>スコープの下限</b>を指定すると、.card の中でも .content より内側には当たらなくなります。外側の枠だけを塗って中身はそっとしておく、<b>ドーナツ型</b>の範囲です。</p><p>カードの本文に、別のコンポーネントや CMS から来た HTML を差し込むときに便利です。対応状況は @scope と同じです（Baseline 2026）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/At-rules/@scope",
      viz: { concept: "none" },
      challenge: {
        starterHTML:
          '<div class="card"><a data-id="head-link" href="#">カードの見出しリンク</a><div class="content"><p>本文の中の <a data-id="body-link" href="#">リンク</a></p></div><a data-id="foot-link" href="#">続きを読む</a></div>',
        starterCSS:
          "a {\n  color: #18203a;\n}\n.card {\n  width: 260px;\n  padding: 12px;\n  background: #f4f6fb;\n}\n.content {\n  margin: 8px 0;\n  padding: 8px;\n  background: #fff;\n}\n",
        task: "カードの見出しリンクと「続きを読む」だけをブランド色（#2f5fd0）にしよう。.content の中のリンクは変えない（@scope (.card) to (.content) を使う）。",
        snapshot: { props: ["color"] },
        validators: [
          { kind: "sourceMatches", pattern: "@scope\\s*\\(\\s*\\.card\\s*\\)\\s*to\\s*\\(\\s*\\.content\\s*\\)", message: "@scope (.card) to (.content) { … } の形で書きましょう" },
          { kind: "computedMatches", id: "head-link", prop: "color", pattern: BRAND, message: "見出しリンクがブランド色になっていません" },
          { kind: "computedMatches", id: "foot-link", prop: "color", pattern: BRAND, message: "「続きを読む」がブランド色になっていません" },
          { kind: "computedMatches", id: "body-link", prop: "color", pattern: INK, message: ".content の中のリンクまで色が変わっています" },
        ],
        hints: ["to (.content) で、.content から内側をスコープの外にできます", "@scope (.card) to (.content) { a { color: #2f5fd0; } }"],
        solution:
          "a {\n  color: #18203a;\n}\n.card {\n  width: 260px;\n  padding: 12px;\n  background: #f4f6fb;\n}\n.content {\n  margin: 8px 0;\n  padding: 8px;\n  background: #fff;\n}\n@scope (.card) to (.content) {\n  a {\n    color: #2f5fd0;\n  }\n}\n",
      },
    },
    {
      id: "scope-proximity",
      title: "近いほうが勝つ: スコープの近さ",
      explanation:
        "<p><code>.light p</code> と <code>.dark p</code> は詳細度が同じなので、テーマを入れ子にすると<b>後に書いたほう</b>が勝ちます。ダークの中にライトの箱を置くと、ライトの中の文字までダーク用の白になってしまいます。</p><p><code>@scope</code> で書くと、詳細度が同じときは<b>スコープのルートが近いほう</b>が勝ちます（スコープの近さ）。ソースの順番ではなく、DOM 上でいちばん近いテーマが効くようになります。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/At-rules/@scope",
      viz: { concept: "none" },
      challenge: {
        starterHTML:
          '<div class="dark"><p data-id="dark-text">ダークの文字</p><div class="light"><p data-id="light-text">ダークの中のライトの文字</p></div></div>',
        starterCSS:
          ".dark {\n  padding: 12px;\n  background: #18203a;\n}\n.light {\n  padding: 12px;\n  background: #ffffff;\n}\np {\n  margin: 0 0 8px;\n}\n\n.light p {\n  color: #18203a;\n}\n.dark p {\n  color: #ffffff;\n}\n",
        task: "2 つのテーマのルールを @scope (.light) と @scope (.dark) に書き換えて、ダークの中に入れたライトの箱の文字を #18203a に戻そう（ルールの順番はそのまま）。",
        snapshot: { props: ["color"] },
        validators: [
          { kind: "sourceMatches", pattern: "@scope\\s*\\(\\s*\\.light\\s*\\)", message: "@scope (.light) { … } を使いましょう" },
          { kind: "sourceMatches", pattern: "@scope\\s*\\(\\s*\\.dark\\s*\\)", message: "@scope (.dark) { … } を使いましょう" },
          { kind: "computedMatches", id: "light-text", prop: "color", pattern: INK, message: "ライトの箱の文字が #18203a になっていません" },
          { kind: "computedMatches", id: "dark-text", prop: "color", pattern: "255[,\\s]+255[,\\s]+255", message: "ダークの文字が白になっていません" },
        ],
        hints: [".light p { … } を @scope (.light) { p { … } } に書き換えます。.dark も同じように", "詳細度が同じなら、近いスコープのルートを持つほうが勝ちます"],
        solution:
          ".dark {\n  padding: 12px;\n  background: #18203a;\n}\n.light {\n  padding: 12px;\n  background: #ffffff;\n}\np {\n  margin: 0 0 8px;\n}\n\n@scope (.light) {\n  p {\n    color: #18203a;\n  }\n}\n@scope (.dark) {\n  p {\n    color: #ffffff;\n  }\n}\n",
      },
    },
  ],
};
