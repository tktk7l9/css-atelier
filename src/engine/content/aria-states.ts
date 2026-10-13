import type { Track } from "./types.js";

// The state lives in ARIA attributes, which a script would toggle; the
// preview runs no script, so the attributes in the markup are the state
// throughout a lesson. Lessons read the computed look of the elements in each
// state (and, for the accordion, the size of the collapsed answer), and the
// current-page lesson also checks that the selector reads aria-current, not a
// position or a class, so the look cannot drift from what is announced.

const BRAND = "rgb(47, 95, 208)";
const CLEAR = "rgba(0, 0, 0, 0)";
const WHITE = "rgb(255, 255, 255)";

const TABS_HTML =
  '<nav class="tabs" aria-label="記事の種類">' +
  '<a data-id="t1" href="#">すべて</a><a data-id="t2" href="#" aria-current="page">特集</a><a data-id="t3" href="#">お知らせ</a>' +
  "</nav>";

const TABS_CSS = (selector: string): string =>
  `.tabs {\n  display: flex;\n  gap: 4px;\n  border-bottom: 1px solid #c5cde0;\n}\n.tabs a {\n  padding: 8px 12px;\n  border-bottom: 3px solid transparent;\n  color: #5c6680;\n  text-decoration: none;\n}\n/* いま開いているページ */\n${selector} {\n  border-bottom-color: #2f5fd0;\n  color: #18203a;\n  font-weight: 700;\n}\n`;

const FAQ_HTML =
  '<div class="faq">' +
  '<button data-id="q1" class="q" type="button" aria-expanded="true" aria-controls="a1">送料はかかりますか<span data-id="c1" class="chev" aria-hidden="true">▾</span></button>' +
  '<div data-id="a1" id="a1" class="a">全国一律で無料です。</div>' +
  '<button data-id="q2" class="q" type="button" aria-expanded="false" aria-controls="a2">返品はできますか<span data-id="c2" class="chev" aria-hidden="true">▾</span></button>' +
  '<div data-id="a2" id="a2" class="a">届いてから 30 日以内なら返品できます。</div>' +
  "</div>";

const FAQ_CSS = (extra: string): string =>
  `.faq {\n  width: 280px;\n  border: 1px solid #c5cde0;\n  border-radius: 8px;\n}\n.q {\n  display: flex;\n  justify-content: space-between;\n  width: 100%;\n  padding: 10px 12px;\n  border: 0;\n  border-top: 1px solid #e3e8f4;\n  background: none;\n  font: inherit;\n  text-align: left;\n}\n.q:first-child {\n  border-top: 0;\n}\n.chev {\n  display: inline-block;\n}\n.a {\n  padding: 0 12px 10px;\n  color: #3d4766;\n}\n${extra}`;

const TOGGLES_HTML =
  '<div class="toggles">' +
  '<button data-id="b1" class="toggle" type="button" aria-pressed="true">写真のみ</button>' +
  '<button data-id="b2" class="toggle" type="button" aria-pressed="false">送料無料</button>' +
  '<button data-id="b3" class="toggle" type="button" aria-pressed="false">セール中</button>' +
  "</div>";

const TOGGLES_CSS = (extra: string): string =>
  `.toggles {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n}\n.toggle {\n  padding: 6px 14px;\n  border: 1px solid #2f5fd0;\n  border-radius: 999px;\n  background: #fff;\n  color: #2f5fd0;\n  font: inherit;\n}\n${extra}`;

export const ariaStatesTrack: Track = {
  id: "aria-states",
  title: "ARIA の状態で見た目を変える（aria-current・aria-expanded・aria-pressed）",
  summary: "aria-current=\"page\" で今のページに印を付け、aria-expanded で閉じた答えを隠して矢印を回し、aria-pressed で押されている切り替えボタンを塗りつぶす。見た目と読み上げを同じ属性からそろえる。",
  emoji: "🏷️",
  lessons: [
    {
      id: "aria-current",
      title: "いまのページに印: [aria-current=\"page\"]",
      explanation:
        "<p>ナビゲーションで、いま開いているページへのリンクだけ見た目を変えるときは、そのリンクに <code>aria-current=\"page\"</code> を付けます。見た目の違いが分からない人にも、支援技術が「現在のページ」だと伝えられます（MDN も、見た目で示した「いまの項目」を aria-current で伝えるよう勧めています）。</p><p>CSS でも、クラスや何番目かではなく、属性セレクタ <code>[aria-current=\"page\"]</code> で選びます。見た目と読み上げが<b>同じ属性から作られる</b>ので、片方だけ直し忘れて食い違うことがありません。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/Attribute_selectors",
      viz: { concept: "none" },
      challenge: {
        starterHTML: TABS_HTML,
        starterCSS: TABS_CSS(".tabs a.is-current"),
        task: "「特集」のリンクには aria-current=\"page\" が付いているのに、印（下線と太字）が付いていません。クラスではなく aria-current 属性で選んで、印を付けよう。",
        snapshot: { props: ["border-bottom-color", "font-weight"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "computedEquals", id: "t2", prop: "border-bottom-color", value: BRAND },
                  { kind: "computedEquals", id: "t2", prop: "font-weight", value: "700" },
                ],
                message: "いまのページ（特集）に、下線と太字の印が付いていません（HTML にはクラスがなく、aria-current=\"page\" だけが付いています）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "computedEquals", id: "t1", prop: "border-bottom-color", value: CLEAR },
                  { kind: "computedEquals", id: "t3", prop: "border-bottom-color", value: CLEAR },
                ],
                message: "ほかのリンクにも印が付いています（いまのページだけに付けます）",
              },
              {
                kind: "sourceMatches",
                pattern: "\\[aria-current",
                message: "何番目かやクラスではなく、[aria-current=\"page\"] で選びましょう（見た目と読み上げが同じ属性からそろいます）",
              },
            ],
          },
        ],
        hints: ["属性セレクタで、aria-current の値が page のリンクを選びます", '.tabs a[aria-current="page"] { … }'],
        solution: TABS_CSS('.tabs a[aria-current="page"]'),
      },
    },
    {
      id: "aria-expanded",
      title: "開閉の状態で見せ分ける: [aria-expanded]",
      explanation:
        "<p>アコーディオンの質問のボタンには、答えが開いているかを <code>aria-expanded</code>（true / false）で示します。スクリプトがこの属性を切り替えるなら、CSS は属性を見て、<b>閉じている答えを隠し、開いている質問の矢印を回す</b>だけで済みます。</p><p>答えはボタンのすぐ後ろにあるので、<code>.q[aria-expanded=\"false\"] + .a</code>（次兄弟結合子 <code>+</code>）で選べます。矢印は <code>rotate: 180deg</code> で上向きにします。見た目と、支援技術に伝わる開閉の状態が、いつも一致します。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/Next-sibling_combinator",
      viz: { concept: "none" },
      challenge: {
        starterHTML: FAQ_HTML,
        starterCSS: FAQ_CSS(""),
        task: "aria-expanded が false の質問（返品）の答えまで表示されています。閉じている答えを隠し、開いている質問（送料）の矢印（▾）を上向きに回そう。",
        snapshot: { props: ["rotate", "transform"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "sizeApprox",
                id: "a2",
                h: 0,
                tol: 0.5,
                message: "閉じている質問（aria-expanded=\"false\"）の答えが、場所を取ったまま残っています（.q[aria-expanded=\"false\"] + .a を display: none で隠します）",
              },
              {
                kind: "offset",
                a: "a1",
                b: "a1",
                edgeA: "top",
                edgeB: "bottom",
                min: 10,
                message: "開いている質問（aria-expanded=\"true\"）の答えまで隠れています",
              },
              {
                kind: "anyOf",
                of: [
                  { kind: "computedEquals", id: "c1", prop: "rotate", value: "180deg" },
                  { kind: "computedMatches", id: "c1", prop: "transform", pattern: "^matrix\\(-1, " },
                ],
                message: "開いている質問の矢印が、上向きになっていません（.q[aria-expanded=\"true\"] .chev に rotate: 180deg）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "computedEquals", id: "c2", prop: "rotate", value: "none" },
                  { kind: "computedEquals", id: "c2", prop: "transform", value: "none" },
                ],
                message: "閉じている質問の矢印まで回っています（開いている質問の矢印だけを回します）",
              },
            ],
          },
        ],
        hints: ["答えはボタンのすぐ後ろにあるので、+ で選べます", '.q[aria-expanded="false"] + .a { display: none; } .q[aria-expanded="true"] .chev { rotate: 180deg; }'],
        solution: FAQ_CSS('/* 閉じている答えは隠す */\n.q[aria-expanded="false"] + .a {\n  display: none;\n}\n/* 開いている質問の矢印は上向きに */\n.q[aria-expanded="true"] .chev {\n  rotate: 180deg;\n}\n'),
      },
    },
    {
      id: "aria-pressed",
      title: "押されている切り替えボタン: [aria-pressed=\"true\"]",
      explanation:
        "<p>絞り込みのボタンのように、押すたびにオン・オフが切り替わるボタンは、<code>aria-pressed</code>（true / false）で押されているかを示します。ボタンの文字は状態で変えず、そのまま使います（MDN も、切り替えボタンのラベルは状態で変えないよう注意しています）。</p><p>CSS では <code>[aria-pressed=\"true\"]</code> で押されているボタンを選び、塗りつぶして区別します。色だけに頼らず、塗りと文字色の両方で違いを出します。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/Attribute_selectors",
      viz: { concept: "none" },
      challenge: {
        starterHTML: TOGGLES_HTML,
        starterCSS: TOGGLES_CSS(""),
        task: "絞り込みのボタンのうち、押されている（aria-pressed=\"true\"）「写真のみ」が、ほかと同じ見た目です。押されているボタンだけを、青で塗りつぶして白い文字にしよう。",
        snapshot: { props: ["background-color", "color"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "computedEquals", id: "b1", prop: "background-color", value: BRAND },
                  { kind: "computedEquals", id: "b1", prop: "color", value: WHITE },
                ],
                message: "押されている「写真のみ」が、塗りつぶされていません（[aria-pressed=\"true\"] で選び、背景を青、文字を白に）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "computedEquals", id: "b2", prop: "background-color", value: WHITE },
                  { kind: "computedEquals", id: "b3", prop: "background-color", value: WHITE },
                ],
                message: "押されていないボタンまで塗りつぶされています（aria-pressed=\"true\" のボタンだけを選びます）",
              },
            ],
          },
        ],
        hints: ["属性セレクタで、aria-pressed の値が true のボタンを選びます", '.toggle[aria-pressed="true"] { background: #2f5fd0; color: #fff; }'],
        solution: TOGGLES_CSS('/* 押されている切り替えボタン */\n.toggle[aria-pressed="true"] {\n  background: #2f5fd0;\n  color: #fff;\n}\n'),
      },
    },
  ],
};
