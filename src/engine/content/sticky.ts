import type { Track } from "./types.js";

// A sticky element only moves once its scroll container has been scrolled,
// and the sandbox has no script to scroll anything. The previews therefore
// start scrolled to the far end with CSS alone: a scroll container laid out as
// `flex-direction: column-reverse` (or `row-reverse`) has its scroll origin at
// the end, so it opens at the bottom (right) end, like a chat log. From there
// a stuck element sits on the scrollport edge and a non-sticky one is out of
// view, so these lessons are judged by geometry. The learner can still scroll
// the preview; the computed checks keep the result honest at any position.

const NEWS = [
  "年末年始の営業について",
  "新しい講座を追加しました",
  "メンテナンスのお知らせ",
  "夏季休業のご案内",
  "料金改定のお知らせ",
  "アプリを更新しました",
  "店舗が移転します",
  "開店 5 周年のお礼",
];

const NEWS_HTML =
  '<div data-id="box" class="box"><div class="page"><h2 data-id="head" class="head">お知らせ</h2>' +
  NEWS.map((t) => `<p class="item">${t}</p>`).join("") +
  "</div></div>";

const START_AT_BOTTOM =
  "/* プレビューは、一番下までスクロールした位置から始まります\n   （.box の column-reverse はそのための仕掛けです。このままで OK） */\n";

const NEWS_CSS = (extra: string): string =>
  `${START_AT_BOTTOM}.box {\n  display: flex;\n  flex-direction: column-reverse;\n  height: 220px;\n  overflow-y: auto;\n  background: #fff;\n}\n.head {\n  margin: 0;\n  padding: 10px 12px;\n  font-size: 16px;\n  color: #fff;\n  background: #18203a;\n${extra}}\n.item {\n  margin: 0;\n  padding: 12px;\n  border-bottom: 1px solid #dbe4fb;\n}\n`;

const MONTHS = ["4月", "5月", "6月", "7月", "8月", "9月"];
const SALES: ReadonlyArray<readonly [string, ...number[]]> = [
  ["りんご", 12, 18, 9, 14, 20, 16],
  ["みかん", 30, 22, 8, 5, 11, 27],
  ["ぶどう", 4, 6, 15, 28, 33, 19],
];

const SHEET_HTML =
  '<div data-id="scroller" class="scroller"><table class="sheet"><thead><tr><th data-id="corner">品名</th>' +
  MONTHS.map((m) => `<th>${m}</th>`).join("") +
  "</tr></thead><tbody>" +
  SALES.map(
    ([name, ...counts], i) => `<tr><th data-id="name${i + 1}">${name}</th>${counts.map((n) => `<td>${n}</td>`).join("")}</tr>`,
  ).join("") +
  "</tbody></table></div>";

const SHEET_CSS = (extra: string): string =>
  "/* プレビューは、表の右端までスクロールした位置から始まります\n   （.scroller の row-reverse はそのための仕掛けです。このままで OK） */\n" +
  `.scroller {\n  display: flex;\n  flex-direction: row-reverse;\n  width: 300px;\n  overflow-x: auto;\n}\n.sheet {\n  border-collapse: separate;\n  border-spacing: 0;\n}\n.sheet th,\n.sheet td {\n  min-width: 64px;\n  padding: 8px 12px;\n  border-bottom: 1px solid #dbe4fb;\n  background: #fff;\n  text-align: right;\n  white-space: nowrap;\n}\n/* 1 列目（品名） */\n.sheet tr > :first-child {\n  text-align: left;\n  background: #eef1f8;\n${extra}}\n`;

// The side links have no href: a link clicked inside the srcdoc preview would
// navigate the frame away from the lesson.
const DOC_HTML =
  '<div data-id="box" class="box"><div class="layout"><nav data-id="side" class="side"><a>概要</a><a>使い方</a><a>よくある質問</a></nav><article class="main">' +
  Array.from(
    { length: 6 },
    (_, i) => `<p>${i + 1} 段落目の本文です。サイドバーは、本文をスクロールしても上に残ってほしいところです。</p>`,
  ).join("") +
  "</article></div></div>";

// The side links have fixed heights, so the un-stretched sidebar is exactly
// 8 + 3 × 32 + 8 = 112px tall on any machine.
const DOC_CSS = (extra: string): string =>
  `${START_AT_BOTTOM}.box {\n  display: flex;\n  flex-direction: column-reverse;\n  height: 220px;\n  overflow-y: auto;\n}\n.layout {\n  display: grid;\n  grid-template-columns: 120px 1fr;\n  gap: 12px;\n  padding: 0 8px;\n}\n.side {\n  position: sticky;\n  top: 0;\n  padding: 8px;\n  background: #eef1f8;\n${extra}}\n.side a {\n  display: block;\n  height: 32px;\n  line-height: 32px;\n  color: #2f5fd0;\n}\n.main p {\n  margin: 0 0 12px;\n  line-height: 1.7;\n}\n`;

export const stickyTrack: Track = {
  id: "sticky",
  title: "スクロール追従（sticky）",
  summary: "position: sticky で、見出しや表の列をスクロールしても画面の端に残す。",
  emoji: "📌",
  lessons: [
    {
      id: "sticky-header",
      title: "見出しを上に残す: position: sticky",
      explanation:
        "<p><code>position: sticky</code> は、ふだんは普通に並び、スクロールして<b>指定した位置まで来るとそこに貼り付く</b>配置です。貼り付く位置は <code>top</code>・<code>bottom</code>・<code>left</code>・<code>right</code>（論理プロパティなら <code>inset-block-start</code> など）で指定します。<code>top: 0</code> なら、スクロールする箱の上端に達したところで止まります。</p><p>よくあるつまずきが、<b>top などを書き忘れる</b>ことです。sticky だけでは止まる位置が決まらないので、普通の要素と同じようにスクロールで流れていきます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p><p>このプレビューは、一番下までスクロールした位置から始まります。上へスクロールすると、見出しが元の位置に戻るようすも確かめられます。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/position",
      viz: { concept: "none" },
      challenge: {
        starterHTML: NEWS_HTML,
        starterCSS: NEWS_CSS(""),
        task: "お知らせの一覧をスクロールしても、見出し（.head）が一覧の上端に残るようにしよう。",
        snapshot: { props: ["position", "top"] },
        validators: [
          // allOf reports only the first unmet step, so a fresh starter gets one message.
          {
            kind: "allOf",
            of: [
              { kind: "computedEquals", id: "head", prop: "position", value: "sticky", message: "見出し（.head）に position: sticky を指定しましょう" },
              { kind: "computedEquals", id: "head", prop: "top", value: "0px", message: "sticky だけでは止まる位置が決まりません。top: 0 も指定しましょう" },
              {
                kind: "alignedEdge",
                ids: ["head", "box"],
                edge: "top",
                message: "見出しが一覧の上端に貼り付いていません（間にある要素に overflow があると、そちらが基準になります）",
              },
            ],
          },
        ],
        hints: ["position: sticky に加えて、どこで止まるか（top）も指定します", "position: sticky; top: 0;"],
        solution: NEWS_CSS("  position: sticky;\n  top: 0;\n"),
      },
    },
    {
      id: "sticky-column",
      title: "表の 1 列目を残す: left: 0",
      explanation:
        "<p>sticky は縦だけでなく<b>横のスクロール</b>にも使えます。横に長い表で、1 列目に <code>position: sticky; left: 0</code> を指定すると、右へスクロールしても品名が左端に残り、どの行の数字なのか分からなくなりません。</p><p>貼り付いたセルの下を、ほかのセルが通り過ぎていきます。<b>背景色を塗っておく</b>のがコツです（透明だと文字が重なって見えます）。また、<code>border-collapse: collapse</code> の表では枠線がセルと一緒に動かないので、<code>separate</code> と <code>border-spacing: 0</code> にしておきます（ここでは用意済み）。表のセルへの sticky も、主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/left",
      viz: { concept: "none" },
      challenge: {
        starterHTML: SHEET_HTML,
        starterCSS: SHEET_CSS(""),
        task: "横に長い売上の表で、1 列目（品名）が表の左端に残るようにしよう。プレビューは表の右端までスクロールした位置から始まります。",
        snapshot: { props: ["position", "left"] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "computedEquals", id: "name1", prop: "position", value: "sticky", message: "1 列目（.sheet tr > :first-child）に position: sticky を指定しましょう" },
              { kind: "computedEquals", id: "name1", prop: "left", value: "0px", message: "横に貼り付けるので、left: 0 を指定しましょう" },
              { kind: "alignedEdge", ids: ["corner", "name1", "name3", "scroller"], edge: "left", message: "1 列目が表の左端に貼り付いていません" },
            ],
          },
        ],
        hints: ["横のスクロールで止まる位置は left で指定します", "position: sticky; left: 0;"],
        solution: SHEET_CSS("  position: sticky;\n  left: 0;\n"),
      },
    },
    {
      id: "sticky-sidebar",
      title: "グリッドの中で追従させる: align-self",
      explanation:
        "<p>sticky の要素が動けるのは、<b>親の箱（包含ブロック）の中だけ</b>です。親の端まで来ると、そこから先は親と一緒にスクロールして出ていきます。</p><p>グリッドやフレックスボックスの子は、既定で<b>行の高さいっぱいに引き伸ばされます</b>。サイドバーが行と同じ高さだと、親の中に動ける余白がなく、sticky と top を書いても動きません。<code>align-self: start</code> で中身の高さに縮めると、余った高さの分だけ、貼り付いたまま動けるようになります。</p><p>もう一つのつまずきは、間にある親要素の <code>overflow: hidden</code> や <code>auto</code> です。sticky は<b>いちばん近いスクロールの仕組みを持つ祖先</b>を基準にするので、意図しない箱が基準になって効かなくなります。<code>align-self</code> も主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/align-self",
      viz: { concept: "none" },
      challenge: {
        starterHTML: DOC_HTML,
        starterCSS: DOC_CSS(""),
        task: "サイドバー（.side）には position: sticky と top: 0 が書いてあるのに、本文と一緒に流れていきます。グリッドの行いっぱいに引き伸ばされているのが原因です。中身の高さに縮めて、上端に貼り付くようにしよう。",
        snapshot: { props: ["position", "align-self"] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "computedEquals", id: "side", prop: "position", value: "sticky", message: "サイドバーの position: sticky は残しておきましょう" },
              {
                kind: "sizeApprox",
                id: "side",
                h: 112,
                message: "サイドバーがグリッドの行の高さいっぱいに引き伸ばされています（align-self: start で中身の高さに）",
              },
              { kind: "alignedEdge", ids: ["side", "box"], edge: "top", message: "サイドバーが上端に貼り付いていません" },
            ],
          },
        ],
        hints: ["グリッドの子は、既定で行の高さいっぱいに伸びます（align-self: stretch 相当）", "align-self: start;"],
        solution: DOC_CSS("  align-self: start;\n"),
      },
    },
  ],
};
