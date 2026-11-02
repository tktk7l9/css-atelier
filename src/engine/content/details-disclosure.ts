import type { Track } from "./types.js";

// A <details> carries its state in the markup, so a preview can show one open
// and one closed without any script. The marker is judged by where the label
// starts and the display of the summary, :open by computed colours on the two
// summaries, and ::details-content by where the paragraph lands inside it.

const FAQ = [
  ["送料はかかりますか", "5,000 円以上のご注文で無料です。"],
  ["返品はできますか", "商品の到着から 8 日以内なら返品できます。"],
];

const FAQ_HTML =
  `<details open class="faq"><summary data-id="s1"><span data-id="l1">${FAQ[0]![0]}</span></summary><p data-id="p1">${FAQ[0]![1]}</p></details>` +
  `<details class="faq"><summary data-id="s2"><span data-id="l2">${FAQ[1]![0]}</span></summary><p>${FAQ[1]![1]}</p></details>`;

const FAQ_CSS =
  ".faq {\n  margin-bottom: 8px;\n  border: 1px solid #c5cde0;\n  border-radius: 8px;\n}\nsummary {\n  padding: 8px 12px;\n  cursor: pointer;\n}\n.faq p {\n  margin: 0;\n}\n";

const NO_MARKER_CSS = FAQ_CSS + "summary {\n  list-style: none;\n}\nsummary::-webkit-details-marker {\n  display: none;\n}\n";

const OPEN_SUPPORT =
  "<code>:open</code> は Baseline 2026（2026 年 5 月から主要ブラウザの最新版で利用可: Chrome 133 / Firefox 136 / Safari 26.5 以降）。古いブラウザも考えるなら、<code>details[open]</code> なら主要ブラウザすべてで使えます。";

export const detailsDisclosureTrack: Track = {
  id: "details-disclosure",
  title: "開閉する部品（summary の印・:open・::details-content）",
  summary: "summary の三角を list-style で消し、:open で開いている項目を目立たせ、::details-content で開く部分の余白や背景を整える。スクリプトなしで動く開閉部品の見た目を作る。",
  emoji: "🪗",
  lessons: [
    {
      id: "summary-marker",
      title: "三角の印を消す: summary の list-style",
      explanation:
        "<p><code>&lt;details&gt;</code> と <code>&lt;summary&gt;</code> は、スクリプトなしで開閉できる部品です。<code>summary</code> の既定は <code>display: list-item</code> で、横の三角は<b>リストの印</b>と同じものです。そのため <code>list-style: none</code> で消せます（<code>display: block</code> でも消えます）。</p><p>Safari などの WebKit 系では、非標準の擬似要素も必要です。<code>summary::-webkit-details-marker { display: none; }</code> を一緒に書いておきます。印を消すなら、開閉できることが分かる別の目印を用意します。</p><p><code>summary</code> の <code>display: list-item</code> は Chrome 89・Firefox 49 から使えます。Safari は対応していないので、上の擬似要素が要ります。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/::marker",
      viz: { concept: "none" },
      challenge: {
        starterHTML: FAQ_HTML,
        starterCSS: FAQ_CSS,
        task: "質問の横の三角が、デザインに合っていません。summary の list-style で三角を消そう。Safari のために summary::-webkit-details-marker { display: none; } も書こう。",
        snapshot: { props: ["list-style-type", "display"] },
        validators: [
          {
            kind: "anyOf",
            of: [
              { kind: "computedEquals", id: "s1", prop: "list-style-type", value: "none", message: "" },
              { kind: "computedEquals", id: "s1", prop: "display", value: "block", message: "" },
            ],
            message: "三角が残っています（summary の既定は display: list-item です。list-style: none で消します）",
          },
          {
            kind: "anyOf",
            of: [
              { kind: "sourceMatches", pattern: "summary::-webkit-details-marker\\s*\\{[^}]*display\\s*:\\s*none", message: "" },
              { kind: "computedMatches", id: "s1", prop: "list-style-type", pattern: "^disclosure-", message: "" },
            ],
            message: "Safari のために summary::-webkit-details-marker { display: none; } も書きましょう",
          },
        ],
        hints: ["三角はリストの印と同じものです", "summary { list-style: none; }\nsummary::-webkit-details-marker { display: none; }"],
        solution: NO_MARKER_CSS,
      },
    },
    {
      id: "open-pseudo-class",
      title: "開いている項目を選ぶ: :open",
      explanation:
        "<p><code>:open</code> は、開いた状態の要素を選ぶ擬似クラスです。<code>&lt;details&gt;</code> や <code>&lt;dialog&gt;</code> が <code>open</code> 属性を持つとき、また <code>&lt;select&gt;</code> や色の入力などが選択の画面を開いているときに当てはまります。ポップオーバーは別で、<code>:popover-open</code> を使います。</p><p>開いている質問だけ背景を付けるには、<code>details:open &gt; summary</code> と書きます。開閉の状態は HTML の属性にあるので、スクリプトで見た目のためのクラスを付け外しする必要はありません。</p><p>" +
        OPEN_SUPPORT +
        "</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/:open",
      viz: { concept: "none" },
      challenge: {
        starterHTML: FAQ_HTML,
        starterCSS: FAQ_CSS,
        task: "開いている質問の summary だけ、背景を #dbe4fb にしよう。プレビューの 2 つ目の質問を開くと、そちらも色が付きます（確認は最初の状態で行います）。",
        snapshot: { props: ["background-color"] },
        validators: [
          { kind: "computedEquals", id: "s1", prop: "background-color", value: "rgb(219, 228, 251)", message: "開いている質問の背景が #dbe4fb になっていません（details:open > summary）" },
          { kind: "computedEquals", id: "s2", prop: "background-color", value: "rgba(0, 0, 0, 0)", message: "閉じている質問まで色が付いています（summary だけでなく、details:open を付けて絞ります）" },
        ],
        hints: ["details:open は、開いている details を選びます", "details:open > summary { background: #dbe4fb; }"],
        solution: FAQ_CSS + "details:open > summary {\n  background: #dbe4fb;\n}\n",
      },
    },
    {
      id: "details-content",
      title: "開く部分を整える: ::details-content",
      explanation:
        "<p><code>::details-content</code> は、<code>&lt;details&gt;</code> の<b>開閉する部分</b>を表す擬似要素です。これまでは <code>summary</code> 以外の中身をまとめて選ぶ方法がなく、div で包むのがふつうでした。この擬似要素なら、中身がいくつあっても、<code>padding</code> や <code>background</code> をひとまとめに付けられます。</p><p><code>details::details-content</code> に <code>transition</code> を書くと開閉に動きも付けられます（<code>content-visibility</code> に <code>allow-discrete</code> が必要です）。</p><p>Baseline 2025（2025 年 9 月から主要ブラウザの最新版で利用可: Chrome 131 / Firefox 143 / Safari 18.4 以降）。古いブラウザでは余白が付かないだけで、開閉はそのまま使えます。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/::details-content",
      viz: { concept: "none" },
      challenge: {
        starterHTML: FAQ_HTML,
        starterCSS: NO_MARKER_CSS,
        task: "答えの文が枠に貼り付いています（三角はこのレッスンでは消してあります）。.faq::details-content に padding: 0 12px 12px を指定して、質問と左端をそろえよう。",
        snapshot: { props: [] },
        validators: [
          { kind: "alignedEdge", ids: ["l1", "p1"], edge: "left", message: "答えの左端が質問とそろっていません（.faq::details-content に padding: 0 12px 12px）" },
          {
            kind: "anyOf",
            of: [
              { kind: "sourceMatches", pattern: "::details-content\\s*\\{[^}]*padding", message: "" },
              { kind: "offset", a: "s1", b: "p1", edgeA: "left", edgeB: "left", min: 0, max: 0.5, message: "" },
            ],
            message: ".faq p ではなく、.faq::details-content に padding を書きましょう（中身がいくつあっても、ひとまとめに整います）",
          },
        ],
        hints: ["セレクタは .faq::details-content です", ".faq::details-content { padding: 0 12px 12px; }"],
        solution: NO_MARKER_CSS + ".faq::details-content {\n  padding: 0 12px 12px;\n}\n",
      },
    },
  ],
};
