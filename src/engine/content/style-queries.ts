import type { Track } from "./types.js";

// Style queries are judged by the computed colours they produce on the elements
// inside each card, and by the CSS text: a plain `.warn .badge` selector also
// colours the badge but is not what the lesson teaches. contrast-color() is read
// back from getComputedStyle as black or white.

const STYLE_SUPPORT =
  "カスタムプロパティの値を調べる <code>style()</code> は Baseline 2026（2026 年 5 月から主要ブラウザの最新版で利用可: Chrome 111 / Firefox 151 / Safari 18 以降）。";

const TONE_HTML =
  '<div class="card warn"><h3 class="title">支払い期限が近づいています</h3><span data-id="w" class="badge">注意</span></div>' +
  '<div class="card info"><h3 class="title">新しい機能を追加しました</h3><span data-id="i" class="badge">お知らせ</span></div>';

const TONE_CSS =
  ".warn {\n  --tone: warn;\n}\n.info {\n  --tone: info;\n}\n.card {\n  margin-bottom: 12px;\n  padding: 12px;\n  border-radius: 8px;\n  background: #eef1f8;\n}\n.title {\n  margin: 0 0 8px;\n  font-size: 16px;\n}\n.badge {\n  padding: 2px 8px;\n  border-radius: 4px;\n  background: #dbe4fb;\n}\n";

const SELF_HTML =
  '<div class="card"><div data-id="inner" class="inner"><h3 class="title">支払い期限が近づいています</h3></div></div>';

const SELF_CSS = (selector: string): string =>
  `.card {\n  --tone: warn;\n}\n.inner {\n  padding: 12px;\n  border: 2px solid #c5cde0;\n  border-radius: 8px;\n}\n.title {\n  margin: 0;\n  font-size: 16px;\n}\n/* --tone が warn のカードは、枠を赤くしたい */\n@container style(--tone: warn) {\n  ${selector} {\n    border-color: #d93636;\n  }\n}\n`;

const CONTRAST_HTML =
  '<div class="row"><button data-id="dark" class="btn dark">保存する</button><button data-id="light" class="btn light">下書き</button></div>';

const CONTRAST_CSS = (color: string): string =>
  `.dark {\n  --bg: #18203a;\n}\n.light {\n  --bg: #f5c400;\n}\n.row {\n  display: flex;\n  gap: 12px;\n}\n.btn {\n  padding: 8px 16px;\n  border: 0;\n  border-radius: 8px;\n  background: var(--bg);\n  color: ${color};\n}\n`;

export const styleQueriesTrack: Track = {
  id: "style-queries",
  title: "値で切り替える部品（style() クエリ・contrast-color()）",
  summary: "@container style() でカスタムプロパティの値に応じて中の要素を切り替え、調べる相手が祖先であることを押さえ、contrast-color() で背景に合わせた文字色を選ばせる。",
  emoji: "🎛️",
  lessons: [
    {
      id: "style-query-tone",
      title: "変数の値で切り替える: @container style()",
      explanation:
        "<p><code>@container</code> は幅だけでなく、祖先の<b>カスタムプロパティの値</b>も調べられます。<code>@container style(--tone: warn) { … }</code> は、いちばん近い祖先の <code>--tone</code> の計算値が <code>warn</code> のときだけ、中のルールを使います。幅を調べるときと違い、<code>container-type</code> は要りません（使えるのは今のところカスタムプロパティだけです）。</p><p>部品の種類を 1 つの変数で決めておけば、中の要素はそれぞれ自分の見た目を <code>@container</code> の中に書けます。値は書いたとおりに比べられるので、<code>calc()</code> は計算されません。</p><p>" +
        STYLE_SUPPORT +
        "</p>",
      mdnPath: "/ja/docs/Web/CSS/Guides/Containment/Container_size_and_style_queries",
      viz: { concept: "none" },
      challenge: {
        starterHTML: TONE_HTML,
        starterCSS: TONE_CSS,
        task: "最後に @container style(--tone: warn) を足して、--tone が warn のカードの .badge だけ、背景を #f5c400 にしよう。",
        snapshot: { props: ["background-color"] },
        validators: [
          { kind: "computedEquals", id: "w", prop: "background-color", value: "rgb(245, 196, 0)", message: "--tone が warn のカードの .badge の背景が #f5c400 になっていません（@container style(--tone: warn) の中に .badge のルールを書きます）" },
          { kind: "computedEquals", id: "i", prop: "background-color", value: "rgb(219, 228, 251)", message: "--tone が info のカードの .badge まで変わっています（style(--tone: warn) で条件を付けます）" },
          // Reported only once the badge has its colour: a fresh starter fails the first check alone.
          {
            kind: "anyOf",
            of: [
              { kind: "sourceMatches", pattern: "@container\\s+style\\(\\s*--tone\\s*:\\s*warn\\s*\\)", message: "" },
              { kind: "computedEquals", id: "w", prop: "background-color", value: "rgb(219, 228, 251)", message: "" },
            ],
            message: "クラスで選ぶのではなく、@container style(--tone: warn) で --tone の値を調べましょう",
          },
        ],
        hints: ["@container style(--tone: warn) { … } の中に、ふつうのルールを書きます", "@container style(--tone: warn) {\n  .badge {\n    background: #f5c400;\n  }\n}"],
        solution: TONE_CSS + "@container style(--tone: warn) {\n  .badge {\n    background: #f5c400;\n  }\n}\n",
      },
    },
    {
      id: "style-query-self",
      title: "調べるのは祖先: 自分自身には効かない",
      explanation:
        "<p><code>@container</code> が調べるのは<b>祖先</b>で、ルールが選んだ要素自身ではありません。<code>--tone</code> を付けた <code>.card</code> を <code>@container style(--tone: warn)</code> の中で選んでも、調べられるのは <code>.card</code> の親なので、条件は成り立ちません。</p><p><code>--tone</code> は継承されるので、親に値がなければ false です。見た目を変える要素を、<code>--tone</code> を持つ要素の<b>子</b>にすれば（ここでは <code>.inner</code>）、親の <code>.card</code> が調べられて条件が成り立ちます。幅のコンテナクエリで、コンテナ自身の大きさを変えられないのと同じ考え方です。</p><p>" +
        STYLE_SUPPORT +
        "</p>",
      mdnPath: "/ja/docs/Web/CSS/Guides/Containment/Container_size_and_style_queries",
      viz: { concept: "none" },
      challenge: {
        starterHTML: SELF_HTML,
        starterCSS: SELF_CSS(".card"),
        task: "@container の中で .card を選んでいるので、何も変わりません。枠線を持っている .inner を選ぶように直して、枠を赤（#d93636）にしよう。",
        snapshot: { props: ["border-top-color"] },
        validators: [
          { kind: "computedEquals", id: "inner", prop: "border-top-color", value: "rgb(217, 54, 54)", message: "枠が赤くなっていません（@container が調べるのは祖先です。--tone を持つ .card の子の .inner を選びます）" },
          { kind: "sourceMatches", pattern: "@container\\s+style\\(", message: "@container style(--tone: warn) は残したまま、中のセレクタを .inner に直しましょう" },
        ],
        hints: ["--tone を持っているのは .card で、枠線を持っているのは子の .inner です", "@container の中のセレクタを .inner にします"],
        solution: SELF_CSS(".inner"),
      },
    },
    {
      id: "contrast-color-button",
      title: "読める文字色を選ばせる: contrast-color()",
      explanation:
        "<p><code>contrast-color(色)</code> は、渡した色に対して<b>コントラストの大きいほうの白か黒</b>を返す関数です。背景色を変数で受け取るボタンなら、<code>color: contrast-color(var(--bg))</code> の 1 行で、暗い背景には白、明るい背景には黒の文字になり、組み合わせを 2 色ずつ管理せずに済みます。</p><p>ただし、中間の明るさの背景では、白でも黒でも十分なコントラストになるとは限りません（MDN は、明るい色か暗い色で使うよう勧めています）。</p><p>Baseline 2026（2026 年 4 月から主要ブラウザの最新版で利用可: Chrome 147 / Firefox 146 / Safari 26 以降）。古いブラウザでは宣言ごと無視されるので、1 行前に <code>color</code> を書いておきます。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/color_value/contrast-color",
      viz: { concept: "none" },
      challenge: {
        starterHTML: CONTRAST_HTML,
        starterCSS: CONTRAST_CSS("white"),
        task: "黄色のボタンの白い文字が読めません。.btn の color を contrast-color() で --bg から決めて、暗い背景には白、明るい背景には黒の文字にしよう。",
        snapshot: { props: ["color"] },
        validators: [
          { kind: "computedEquals", id: "light", prop: "color", value: "rgb(0, 0, 0)", message: "黄色のボタンの文字が黒になっていません（.btn の color を contrast-color(var(--bg)) にします）" },
          { kind: "computedEquals", id: "dark", prop: "color", value: "rgb(255, 255, 255)", message: "暗いボタンの文字が白になっていません（色を直接書かず、contrast-color(var(--bg)) で選ばせます）" },
        ],
        hints: ["背景は --bg で受け取っています", ".btn { color: contrast-color(var(--bg)); }"],
        solution: CONTRAST_CSS("contrast-color(var(--bg))"),
      },
    },
  ],
};
