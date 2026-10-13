import type { Track } from "./types.js";

// Nesting is judged by its effect (computed values, and for the nested @media
// the layout at two widths) and, because flat CSS can reach the same result,
// by the nested form the lesson teaches, read from the source with a reason
// when it is missing. The responsive lesson fixes the preview at 560px and
// checks it again at 320px, like the media query lessons.

const INK = "rgb(24, 32, 58)";
const SLATE = "rgb(92, 102, 128)";
const WHITE = "rgb(255, 255, 255)";
const BRAND = "rgb(47, 95, 208)";

const TABS_HTML =
  '<nav class="tabs" aria-label="記事の種類"><a data-id="t1" class="tab" href="#">すべて</a><a data-id="t2" class="tab is-active" href="#">特集</a><a data-id="t3" class="tab" href="#">お知らせ</a></nav>';

const TABS_CSS = (selector: string): string =>
  `.tabs {\n  display: flex;\n  gap: 4px;\n}\n.tab {\n  padding: 8px 12px;\n  color: #5c6680;\n  text-decoration: none;\n  /* 選んでいるタブ */\n  ${selector} {\n    color: #18203a;\n    font-weight: 700;\n  }\n}\n`;

const CARD_HTML =
  '<article data-id="card" class="card"><div data-id="photo" class="photo"></div><div data-id="body" class="body"><h3>海の見える宿</h3><p>夏の旅特集。予約の取り方も紹介します。</p></div></article>';

const CARD_CSS = (extra: string): string =>
  `.card {\n  display: grid;\n  gap: 12px;\n  padding: 12px;\n  border-radius: 12px;\n  background: #eef1f8;\n${extra}}\n.photo {\n  height: 96px;\n  border-radius: 8px;\n  background: linear-gradient(#9fd3f5, #2f5fd0);\n}\n.body h3 {\n  margin: 0 0 4px;\n}\n.body p {\n  margin: 0;\n}\n`;

const PANELS_HTML =
  '<section class="panel is-dark"><button data-id="b1" class="btn" type="button">保存する</button></section>' +
  '<section class="panel"><button data-id="b2" class="btn" type="button">保存する</button></section>';

const PANELS_CSS = (extra: string): string =>
  `.panel {\n  margin-bottom: 8px;\n  padding: 12px;\n  border-radius: 8px;\n  background: #eef1f8;\n}\n.panel.is-dark {\n  background: #18203a;\n}\n.btn {\n  padding: 6px 14px;\n  border: 0;\n  border-radius: 999px;\n  background: #2f5fd0;\n  color: #fff;\n  font: inherit;\n  /* 暗いパネルの中では、白地のボタンにしたい */\n${extra}}\n`;

export const nestingInPracticeTrack: Track = {
  id: "nesting-in-practice",
  title: "ネストの応用（& とスペース・入れ子の @media・後ろに付ける &）",
  summary: "&.is-active と & .is-active の違いを知り、@media をルールの中に入れ子で書き、.is-dark & のように & を後ろに付けて親の状態でスタイルを変える。",
  emoji: "🪺",
  lessons: [
    {
      id: "nesting-compound",
      title: "& のあとのスペースで変わる: &.is-active",
      explanation:
        "<p>入れ子のセレクタは、<code>&</code> の位置で意味が変わります。<code>& .is-active</code>（スペースあり）は「.tab の<b>中にある</b> .is-active」、<code>&.is-active</code>（スペースなし）は「<b>.is-active でもある</b> .tab」です。& を書かずに <code>.is-active { … }</code> と入れ子にしても、ブラウザはスペースを補うので「中にある」の意味になります。</p><p>同じ要素に付いた別のクラスや擬似クラス（<code>&:hover</code> など）を選ぶときは、& とのあいだにスペースを入れずに書きます。CSS のネストは、主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/Nesting_selector",
      viz: { concept: "none" },
      challenge: {
        starterHTML: TABS_HTML,
        starterCSS: TABS_CSS("& .is-active"),
        task: "選んでいるタブ（.tab.is-active）を太字にしたいのに、入れ子のセレクタがどの要素にも当たっていません。& の書き方を直して、「特集」のタブを太字・濃い色にしよう。",
        snapshot: { props: ["font-weight", "color"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "computedEquals", id: "t2", prop: "font-weight", value: "700" },
                  { kind: "computedEquals", id: "t2", prop: "color", value: INK },
                ],
                message: "選んでいるタブが太字になっていません（& .is-active は「.tab の中にある .is-active」です。同じ要素なら &.is-active）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "computedEquals", id: "t1", prop: "font-weight", value: "400" },
                  { kind: "computedEquals", id: "t3", prop: "color", value: SLATE },
                ],
                message: "ほかのタブまで太字や濃い色になっています（.is-active のタブだけを選びます）",
              },
              {
                kind: "sourceMatches",
                pattern: "&\\.is-active",
                message: ".tab の入れ子のまま、&.is-active と書きましょう",
              },
            ],
          },
        ],
        hints: ["& と .is-active のあいだのスペースがあると「中にある」の意味になります", ".tab { &.is-active { … } }"],
        solution: TABS_CSS("&.is-active"),
      },
    },
    {
      id: "nesting-media",
      title: "@media もルールの中に: 入れ子の @media",
      explanation:
        "<p>CSS のネストでは、<code>@media</code> もルールの中に入れ子で書けます。<code>.card { @media (width >= 480px) { grid-template-columns: 120px 1fr; } }</code> のように書くと、中の宣言は <code>.card</code> に当てはまり、幅ごとの変化を<b>部品のスタイルのそばにまとめて</b>置けます。</p><p>入れ子の @media の中にプロパティを直接書くと、<code>& { … }</code> の中に書いたのと同じ意味になります。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。プレビューは幅 560px で採点し、320px でも確かめます。</p>",
      mdnPath: "/ja/docs/Web/CSS/Guides/Nesting/At-rules",
      viz: { concept: "none" },
      challenge: {
        viewport: 560,
        starterHTML: CARD_HTML,
        starterCSS: CARD_CSS(""),
        task: "カードの写真と文章が縦に並んでいます。幅が 480px 以上のときだけ、写真を左（幅 120px）、文章を右に並べよう。@media は .card のルールの中に入れ子で書きます。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "order", ids: ["photo", "body"], axis: "x" },
                  { kind: "alignedEdge", ids: ["photo", "body"], edge: "top" },
                  { kind: "sizeApprox", id: "photo", w: 120, tol: 1 },
                ],
                message: "幅 560px で、写真（120px）が左、文章が右に並んでいません",
              },
              {
                kind: "sourceMatches",
                pattern: "\\.card\\s*\\{[^}]*@media",
                message: "@media を .card のルールの外ではなく、中に入れ子で書きましょう（部品のスタイルがひとまとまりになります）",
              },
            ],
          },
        ],
        states: [
          {
            viewport: 320,
            validators: [
              {
                kind: "order",
                ids: ["photo", "body"],
                axis: "y",
                message: "幅 320px で、写真と文章が縦に並んでいません（480px より狭いときは縦のままにします）",
              },
            ],
          },
        ],
        hints: ["@media を .card の { } の中に書き、その中に grid-template-columns を書きます", ".card { @media (width >= 480px) { grid-template-columns: 120px 1fr; } }"],
        solution: CARD_CSS("  @media (width >= 480px) {\n    grid-template-columns: 120px 1fr;\n  }\n"),
      },
    },
    {
      id: "nesting-append",
      title: "親の状態で変える: .is-dark & と後ろに付ける &",
      explanation:
        "<p><code>&</code> は、入れ子のセレクタの<b>後ろ</b>にも書けます。<code>.btn { .is-dark & { … } }</code> は <code>.is-dark .btn</code> と同じ意味で、「暗いパネルの中のボタン」を、ボタンのルールの中で書けます。親の状態（テーマや開閉など）によって変わるスタイルを、部品のそばにまとめられます。</p><p>入れ子のセレクタの詳細度は、<code>:is()</code> と同じように数えられます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/Nesting_selector",
      viz: { concept: "none" },
      challenge: {
        starterHTML: PANELS_HTML,
        starterCSS: PANELS_CSS(""),
        task: "暗いパネル（.is-dark）の中のボタンだけを、白地に紺の文字にしよう。.btn のルールの中に、& を後ろに付けた入れ子で書きます。",
        snapshot: { props: ["background-color", "color"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "computedEquals", id: "b1", prop: "background-color", value: WHITE },
                  { kind: "computedEquals", id: "b1", prop: "color", value: INK },
                ],
                message: "暗いパネルの中のボタンが、白地に紺の文字になっていません（.btn の中に .is-dark & { … }）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "computedEquals", id: "b2", prop: "background-color", value: BRAND },
                  { kind: "computedEquals", id: "b2", prop: "color", value: WHITE },
                ],
                message: "明るいパネルのボタンまで変わっています（暗いパネルの中のボタンだけを変えます）",
              },
              {
                kind: "sourceMatches",
                pattern: "\\.is-dark\\s+&",
                message: ".btn のルールの中に、& を後ろに付けた .is-dark & { … } で書きましょう",
              },
            ],
          },
        ],
        hints: ["& を後ろに書くと、「その親の中にある自分」を表せます", ".btn { .is-dark & { background: #fff; color: #18203a; } }"],
        solution: PANELS_CSS("  .is-dark & {\n    background: #fff;\n    color: #18203a;\n  }\n"),
      },
    },
  ],
};
