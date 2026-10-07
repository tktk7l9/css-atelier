import type { Track } from "./types.js";

// A feature query whose condition holds behaves exactly like CSS written
// without it, so a positive @supports cannot be told apart from the result
// alone. These lessons therefore use `@supports not (…)` around a fallback:
// every current browser supports the feature, so the fallback must stop
// applying, and the preview shows it (the cards fill their grid cells, the
// unselected plan closes, the caption stays see-through). The source checks
// only confirm that the fallback was moved inside the query, not deleted:
// older browsers still depend on it.

/** Skips the complete rules before the one we look for inside a block. */
const INSIDE = "\\s*\\{(?:[^{}]*\\{[^{}]*\\})*?[^{}]*\\{[^{}]*";

const NOT_GRID = "@supports\\s+not\\s*\\(\\s*display\\s*:\\s*grid\\s*\\)";
const NOT_HAS = "@supports\\s+not\\s*\\(?\\s*selector\\(\\s*:has\\([^)]*\\)\\s*\\)\\s*\\)?";
// The condition (up to the block) names both properties and joins them with
// `or`. The lookaheads start at the first parenthesis, so the unprefixed name
// is found after its "(" whether or not the whole condition is wrapped again.
const NOT_EITHER_BACKDROP =
  "@supports\\s+not\\s*(?=\\()(?=[^{]*\\)\\s*or\\s*\\()(?=[^{]*-webkit-backdrop-filter\\s*:)(?=[^{]*[(\\s]backdrop-filter\\s*:)";

const CARDS_HTML =
  '<div data-id="cards" class="cards">' +
  '<div data-id="c1" class="card">お知らせ</div><div data-id="c2" class="card">イベント</div><div data-id="c3" class="card">ブログ</div>' +
  '<div class="card">ニュース</div><div class="card">特集</div><div class="card">よくある質問</div>' +
  "</div>";

const FLOAT_RULE = ".card {\n  float: left;\n  width: 31%;\n  margin-right: 2%;\n}\n";

const CARDS_CSS = (wrap: boolean): string =>
  "/* 古いブラウザ向け: float で 3 列に並べる */\n" +
  (wrap ? `@supports not (display: grid) {\n${FLOAT_RULE.replace(/^/gm, "  ").replace(/ +$/gm, "")}}\n` : FLOAT_RULE) +
  "/* 今のブラウザ向け: グリッドで 3 列に並べる */\n.cards {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 12px;\n}\n" +
  ".card {\n  padding: 12px;\n  border-radius: 8px;\n  background: #eef1f8;\n}\n";

const PLANS_HTML =
  '<div class="plan"><label><input type="radio" name="plan" checked> 月額プラン</label><p data-id="d1" class="detail">毎月 980 円。いつでも解約できます。</p></div>' +
  '<div class="plan"><label><input type="radio" name="plan"> 年額プラン</label><p data-id="d2" class="detail">年 9,800 円。2 か月分お得です。</p></div>';

const SHOW_ALL_RULE = ".detail {\n  display: block;\n}\n";

const PLANS_CSS = (wrap: boolean): string =>
  ".plan {\n  margin-bottom: 8px;\n  padding: 10px 12px;\n  border: 2px solid #dbe4fb;\n  border-radius: 8px;\n}\n" +
  ".plan:has(:checked) {\n  border-color: #2f5fd0;\n}\n" +
  ".detail {\n  display: none;\n  margin: 6px 0 0;\n  color: #4a5578;\n}\n" +
  "/* 選んだプランの説明だけを開く */\n.plan:has(:checked) .detail {\n  display: block;\n}\n" +
  "/* :has() に対応していないブラウザでは、説明をすべて表示しておく */\n" +
  (wrap ? `@supports not selector(:has(*)) {\n${SHOW_ALL_RULE.replace(/^/gm, "  ").replace(/ +$/gm, "")}}\n` : SHOW_ALL_RULE);

// The stand-in photo is a striped gradient, so the blur is easy to see.
const PHOTO_BG =
  "repeating-linear-gradient(45deg, rgb(255 255 255 / 0.35) 0 8px, transparent 8px 16px), linear-gradient(160deg, #ffd27a, #ff8a65 40%, #7b5cd6 75%, #2f5fd0)";

const SOLID_RULE = ".caption {\n  background: rgb(255 255 255 / 0.9);\n}\n";

const CAPTION_CSS = (condition: string | null): string =>
  `.photo {\n  position: relative;\n  width: 260px;\n  height: 160px;\n  background: ${PHOTO_BG};\n}\n` +
  ".caption {\n  position: absolute;\n  inset: auto 12px 12px;\n  margin: 0;\n  padding: 8px 12px;\n  border-radius: 8px;\n  font-weight: 700;\n" +
  "  /* すりガラス（Safari 17 以前は -webkit- 付きだけに対応） */\n  background: rgb(255 255 255 / 0.4);\n  -webkit-backdrop-filter: blur(8px);\n  backdrop-filter: blur(8px);\n}\n" +
  "/* すりガラスにできないブラウザでは、文字が読めるように背景を濃くする */\n" +
  (condition ? `@supports ${condition} {\n${SOLID_RULE.replace(/^/gm, "  ").replace(/ +$/gm, "")}}\n` : SOLID_RULE);

export const supportsTrack: Track = {
  id: "supports",
  title: "機能クエリ（@supports）",
  summary: "@supports で、ブラウザが対応しているかどうかに応じて CSS を切り替え、古いブラウザ向けの指定を分けておく。",
  emoji: "🛡️",
  lessons: [
    {
      id: "supports-not",
      title: "古いブラウザ向けの指定を分ける: @supports not",
      explanation:
        "<p><code>@supports (条件) { … }</code> は、ブラウザが条件の宣言に<b>対応しているときだけ</b>中の CSS を使う<b>機能クエリ</b>です。<code>not</code> を付けた <code>@supports not (display: grid)</code> は逆に、<b>対応していないときだけ</b>使われます。</p><p>新しい書き方と古いブラウザ向けの書き方を並べておくと、ふつうは後に書いたほうが勝ちます。ただし、古い書き方にしかない<b>別のプロパティ</b>は打ち消されずに残ります。float で並べるための <code>width: 31%</code> や <code>margin-right</code> はグリッドのカードにも効いてしまい、カードが列の幅より細くなります（float 自体はグリッドの子には効きません）。古い書き方を <code>@supports not</code> の中へ移せば、グリッドに対応したブラウザでは使われなくなります（<code>@supports (display: grid)</code> の中で width や margin を打ち消す手もありますが、打ち消し漏れが起きがちです）。</p><p><code>@supports</code> は主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/At-rules/@supports",
      viz: { concept: "none" },
      challenge: {
        starterHTML: CARDS_HTML,
        starterCSS: CARDS_CSS(false),
        task: "グリッドのカードが列の幅より細くなっています。古いブラウザ向けの float のルール（最初の .card）を @supports not (display: grid) で囲んで、グリッドに対応したブラウザでは使われないようにしよう。",
        snapshot: { props: [] },
        validators: [
          // allOf reports only the first unmet step, so a fresh starter gets one message.
          {
            kind: "allOf",
            of: [
              {
                kind: "alignedEdge",
                ids: ["c3", "cards"],
                edge: "right",
                message: "カードがグリッドの列の幅いっぱいに広がっていません（古いブラウザ向けの width と margin が、グリッドのカードにも効いています）",
              },
              {
                kind: "sourceMatches",
                pattern: NOT_GRID,
                message: "古いブラウザ向けのルールを @supports not (display: grid) { … } で囲みましょう",
              },
              {
                kind: "sourceMatches",
                pattern: `${NOT_GRID}${INSIDE}float\\s*:\\s*left`,
                message: "float のルールは消さずに、@supports not (display: grid) の中へ移しましょう（グリッドに対応していないブラウザでは、今もそれが頼りです）",
              },
            ],
          },
        ],
        hints: [
          "@supports not (条件) の中の CSS は、条件に対応していないブラウザでだけ使われます",
          "@supports not (display: grid) { .card { float: left; width: 31%; margin-right: 2%; } }",
        ],
        solution: CARDS_CSS(true),
      },
    },
    {
      id: "supports-selector",
      title: "セレクタの対応を調べる: selector()",
      explanation:
        "<p>機能クエリは、プロパティと値だけでなく<b>セレクタ</b>に対応しているかも調べられます。<code>@supports selector(:has(*))</code> は <code>:has()</code> を使えるブラウザで、<code>@supports not selector(:has(*))</code> は使えないブラウザで、中の CSS を使います。</p><p><code>:has()</code> に対応していないブラウザは、<code>:has()</code> を含むルールを<b>まるごと読み飛ばします</b>。選んだプランの説明だけを開く仕組みを <code>:has(:checked)</code> で作ると、そうしたブラウザでは説明がどれも開かなくなるので、代わりに全部を表示しておくと親切です。ただし、その代わりのルールをそのまま書くと、対応しているブラウザでも全部が開いてしまいます。</p><p><code>selector()</code> は Chrome 83・Firefox 69・Safari 14.1 から使えます（Baseline: 広く利用可能）。<code>:has()</code> 自体は 2023 年 12 月に主要ブラウザがそろいました。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/At-rules/@supports",
      viz: { concept: "none" },
      challenge: {
        starterHTML: PLANS_HTML,
        starterCSS: PLANS_CSS(false),
        task: "選んだプランの説明だけを開くはずが、両方とも開いています。最後のルール（説明をすべて表示する .detail）を @supports not selector(:has(*)) で囲んで、:has() に対応していないブラウザだけで使われるようにしよう。",
        snapshot: { props: ["display"] },
        validators: [
          {
            kind: "allOf",
            of: [
              // Radios keep exactly one plan selected, so whatever the learner
              // picks in the preview, one detail is open and the other closed.
              {
                kind: "anyOf",
                of: [
                  { kind: "computedEquals", id: "d1", prop: "display", value: "none" },
                  { kind: "computedEquals", id: "d2", prop: "display", value: "none" },
                ],
                message: "選んでいないプランの説明まで開いています（:has() に対応したブラウザでも、最後のルールが効いています）",
              },
              {
                kind: "anyOf",
                of: [
                  { kind: "computedEquals", id: "d1", prop: "display", value: "block" },
                  { kind: "computedEquals", id: "d2", prop: "display", value: "block" },
                ],
                message: "選んだプランの説明が開いていません（.plan:has(:checked) .detail のルールは残しておきましょう）",
              },
              {
                kind: "sourceMatches",
                pattern: NOT_HAS,
                message: "最後のルールを @supports not selector(:has(*)) { … } で囲みましょう",
              },
              {
                kind: "sourceMatches",
                pattern: `${NOT_HAS}${INSIDE}display\\s*:\\s*block`,
                message: "説明をすべて表示するルール（.detail { display: block; }）は消さずに、@supports の中へ移しましょう",
              },
            ],
          },
        ],
        hints: [
          "selector() の中に、調べたいセレクタを書きます",
          "@supports not selector(:has(*)) { .detail { display: block; } }",
        ],
        solution: PLANS_CSS(true),
      },
    },
    {
      id: "supports-or",
      title: "接頭辞つきも合わせて調べる: not と or",
      explanation:
        "<p>条件は <code>and</code>・<code>or</code>・<code>not</code> で組み合わせられます。<code>(A) or (B)</code> は、どちらか一方にでも対応していれば真です。<code>backdrop-filter</code> は Safari 17 以前だと <code>-webkit-backdrop-filter</code> にしか対応していないので、「どちらにも対応していない」は <code>not ((backdrop-filter: blur(8px)) or (-webkit-backdrop-filter: blur(8px)))</code> と書きます。</p><p><code>not</code> と <code>or</code> を一緒に使うときは、<b>or でつないだ全体をかっこで囲みます</b>。<code>not (A) or (B)</code> のように囲まないと条件として正しくないので、<code>@supports</code> のルールごと無視されます（どのブラウザでも中の CSS が使われません）。</p><p><code>@supports</code> は主要ブラウザすべてで使えます（Baseline: 広く利用可能）。<code>backdrop-filter</code> は Baseline 2024（Safari は 18 から接頭辞なし）です。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/At-rules/@supports",
      viz: { concept: "none" },
      challenge: {
        starterHTML: '<div class="photo"><p data-id="caption" class="caption">夕暮れの丘で</p></div>',
        starterCSS: CAPTION_CSS(null),
        task: "すりガラスにできるブラウザでも、最後のルールの濃い背景が上書きして、すりガラスが見えません。最後のルールを、backdrop-filter にも -webkit-backdrop-filter にも対応していないブラウザだけで使われるようにしよう。",
        snapshot: { props: ["background-color"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "computedEquals",
                id: "caption",
                prop: "background-color",
                value: "rgba(255, 255, 255, 0.4)",
                message: "すりガラスにできるブラウザでも、最後のルールの濃い背景が上書きしています。@supports not (…) で囲みましょう",
              },
              {
                kind: "sourceMatches",
                pattern: "@supports\\s+not\\b",
                message: "最後のルールを @supports not (…) { … } で囲みましょう（消してしまうと、すりガラスにできないブラウザで文字が読みにくくなります）",
              },
              {
                kind: "sourceMatches",
                pattern: NOT_EITHER_BACKDROP,
                message: "条件には backdrop-filter と -webkit-backdrop-filter の両方を入れて、or でつなぎましょう（Safari 17 以前は -webkit- 付きだけに対応）",
              },
              {
                kind: "sourceMatches",
                pattern: "@supports\\s+not\\s*\\(\\s*\\(",
                message: "not と or を一緒に使うときは、or でつないだ全体をかっこで囲みます: not ((…) or (…))",
              },
              {
                kind: "sourceMatches",
                pattern: `${NOT_EITHER_BACKDROP}[^{]*${INSIDE}background`,
                message: "濃い背景のルール（.caption { background: … }）は消さずに、@supports の中へ移しましょう",
              },
            ],
          },
        ],
        hints: [
          "not のあとは、or でつないだ全体をもう一組のかっこで囲みます",
          "@supports not ((backdrop-filter: blur(8px)) or (-webkit-backdrop-filter: blur(8px))) { … }",
        ],
        solution: CAPTION_CSS("not ((backdrop-filter: blur(8px)) or (-webkit-backdrop-filter: blur(8px)))"),
      },
    },
  ],
};
