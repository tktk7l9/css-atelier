import type { Edge, ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Page-level grids are judged by where the boxes end up relative to each
// other, which holds at any preview width: the photo reaches 40px past the
// text on each side and the band spans the page; the two cards share a 560px
// row in halves but stack at 240px (so a fixed column count fails); and the
// header and footer keep their one-line height at the top and bottom of the
// 280px preview while the main text fills everything between them. Any grid
// (or flexbox) that produces those positions passes.

const between = (a: string, b: string, edgeA: Edge, edgeB: Edge, px: number): ValidatorSpec => ({
  kind: "offset",
  a,
  b,
  edgeA,
  edgeB,
  min: px - 0.5,
  max: px + 0.5,
});

const PAGE_HTML =
  '<main data-id="page" class="page"><h2>春の旅</h2><div data-id="hero" class="hero"></div>' +
  '<p data-id="text">桜の名所をめぐる、三泊四日の旅を紹介します。</p><div data-id="band" class="band">予約は 3 月末まで</div></main>';

const PAGE_CSS = (extra: string): string =>
  `.page {\n  display: grid;\n  grid-template-columns:\n    [full-start] 1fr\n    [wide-start] 40px\n    [content-start] min(240px, 100% - 96px) [content-end]\n    40px [wide-end]\n    1fr [full-end];\n  row-gap: 12px;\n}\n/* ふだんは本文の幅に置く */\n.page > * {\n  grid-column: content;\n  margin: 0;\n}\n.hero {\n  height: 72px;\n  border-radius: 8px;\n  background: linear-gradient(#9fd3f5, #2f5fd0);\n}\n.band {\n  padding: 8px 12px;\n  background: #fff3c4;\n}\n${extra}`;

const CARDS_HTML =
  '<div data-id="list" class="list"><article data-id="c1" class="card">春の講座</article><article data-id="c2" class="card">夏の講座</article></div>';

const CARDS_CSS = (repeat: string): string =>
  `.list {\n  display: grid;\n  grid-template-columns: repeat(${repeat}, minmax(120px, 1fr));\n  gap: 8px;\n}\n.card {\n  padding: 12px;\n  border-radius: 8px;\n  background: #dbe4fb;\n}\n`;

const FRAME_HTML =
  '<div data-id="page" class="page"><header data-id="head" class="head">講座のご案内</header>' +
  '<main data-id="main" class="main">春の講座の受付を始めました。</main><footer data-id="foot" class="foot">© 2026 学びの森</footer></div>';

const FRAME_CSS = (extra: string): string =>
  `.page {\n  min-height: 100dvh;\n  background: #dde3f0;\n${extra}}\n.head,\n.foot {\n  padding: 8px 12px;\n  background: #2f5fd0;\n  color: #fff;\n}\n.main {\n  padding: 12px;\n  background: #fff;\n}\n`;

// One line of 16px text at line-height 1.4 plus 8px of padding above and below.
const BAR_HEIGHT = 38.4;

export const gridLayoutsTrack: Track = {
  id: "grid-layouts",
  title: "ページのグリッド（名前付きの線・auto-fit・下端のフッター）",
  summary: "名前を付けた線で本文・少し広い範囲・全幅を使い分け、auto-fit で少ないカードを行いっぱいに広げ、auto 1fr auto でフッターを画面の下端に置く。",
  emoji: "🗺️",
  lessons: [
    {
      id: "named-lines",
      title: "名前付きの線で幅を使い分ける: grid-column: wide",
      explanation:
        "<p><code>grid-template-columns</code> では、列の線に <code>[content-start]</code> のように<b>名前</b>を付けられます。<code>名前-start</code> と <code>名前-end</code> の線ではさまれた範囲は、その名前の領域になるので、<code>grid-column: content</code> と書くだけで、その範囲に置けます。</p><p>このページには、本文の幅（content）・左右に 40px ずつ広い範囲（wide）・ページの端から端まで（full）の 3 つの範囲があり、ふだんはすべて本文の幅に置いています。写真は <code>grid-column: wide</code>、帯は <code>grid-column: full</code> と、名前を変えるだけで置き分けられます。列の数を数えて <code>2 / 5</code> のように書くより、あとで列を足しても崩れません。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Guides/Grid_layout/Named_grid_lines",
      viz: { concept: "none" },
      challenge: {
        starterHTML: PAGE_HTML,
        starterCSS: PAGE_CSS(""),
        task: "写真（.hero）を、本文より左右 40px ずつ広い範囲（wide）に、帯（.band）をページの端から端まで（full）に広げよう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [between("hero", "text", "left", "left", 40), between("text", "hero", "right", "right", 40)],
            message: "写真が、本文より左右 40px ずつ広い範囲に置かれていません（[wide-start] と [wide-end] ではさまれた範囲は、grid-column: wide で使えます）",
          },
          {
            kind: "allOf",
            of: [between("page", "band", "left", "left", 0), between("page", "band", "right", "right", 0)],
            message: "帯が、ページの端から端まで広がっていません（[full-start] と [full-end] ではさまれた範囲は、grid-column: full です）",
          },
        ],
        hints: ["名前-start と名前-end の線の間は、grid-column: 名前 で指定できます", ".hero { grid-column: wide; } .band { grid-column: full; }"],
        solution: PAGE_CSS(".hero {\n  grid-column: wide;\n}\n.band {\n  grid-column: full;\n}\n"),
      },
    },
    {
      id: "auto-fit",
      title: "少ないカードを広げる: auto-fill と auto-fit",
      explanation:
        "<p><code>repeat(auto-fill, minmax(120px, 1fr))</code> は、行に<b>入るだけの列</b>を作ります。カードが 2 枚しかなくても、幅 560px なら 4 列できて、残りの 2 列は空いたまま残るので、カードは狭いままです。</p><p><code>auto-fit</code> は、カードを置いたあとで<b>空いた列をたたむ</b>ので、2 枚のカードが <code>1fr</code> で行いっぱいに広がります。カードで列が埋まるときは、auto-fill と同じ並びです。<code>repeat(2, 1fr)</code> と列の数を決めてしまうと、狭い画面でも 2 列のままなので、auto-fit のまま使います。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。プレビューは幅 560px で採点し、240px でも確かめます。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/repeat",
      viz: { concept: "none" },
      challenge: {
        viewport: 560,
        starterHTML: CARDS_HTML,
        starterCSS: CARDS_CSS("auto-fill"),
        task: "カードが 2 枚しかないのに、空いた列のぶん狭くなっています。2 枚のカードを、行いっぱいに半分ずつ広げよう（狭い画面では今までどおり 1 列に並ぶように、列の数は決めずに）。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "sizeApprox", id: "c1", w: 276, tol: 1 },
              { kind: "sizeApprox", id: "c2", w: 276, tol: 1 },
              between("c2", "list", "right", "right", 0),
            ],
            message: "2 枚のカードが、行いっぱいに半分ずつ広がっていません（auto-fill は空いた列も残します。auto-fit なら、空いた列をたたみます）",
          },
        ],
        states: [
          {
            viewport: 240,
            validators: [
              {
                kind: "allOf",
                of: [
                  { kind: "order", ids: ["c1", "c2"], axis: "y" },
                  { kind: "alignedEdge", ids: ["list", "c1", "c2"], edge: "left", tol: 0.5 },
                  { kind: "alignedEdge", ids: ["list", "c1", "c2"], edge: "right", tol: 0.5 },
                ],
                message: "幅 240px で、カードが 1 列に並んでいません（repeat(2, 1fr) のように列の数を決めると、狭い画面でも 2 列のままです。auto-fit なら、入るだけの列になります）",
              },
            ],
          },
        ],
        hints: ["空いた列をたたむ、repeat の 1 つめの値があります", "repeat(auto-fit, minmax(120px, 1fr))"],
        solution: CARDS_CSS("auto-fit"),
      },
    },
    {
      id: "sticky-footer",
      title: "フッターを下端に: grid-template-rows: auto 1fr auto",
      explanation:
        "<p>ページの高さを画面の高さ以上（<code>min-height: 100dvh</code>）にしても、本文が短いと、フッターは本文のすぐ下に来て、その下が空いてしまいます。</p><p>ページをグリッドにして <code>grid-template-rows: auto 1fr auto</code> と書くと、ヘッダーとフッターの行（<code>auto</code>）は<b>中身の高さ</b>、真ん中の本文の行（<code>1fr</code>）は<b>残りの高さすべて</b>になり、フッターが画面の下端に来ます。本文が長くて画面に収まらないときは、フッターは本文の下に押し出されます。</p><p><code>display: grid</code> だけだと、3 つの行（どれも auto）に余りが等分され、ヘッダーとフッターまで高くなります。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。プレビューの高さは 280px です。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/grid-template-rows",
      viz: { concept: "none" },
      challenge: {
        starterHTML: FRAME_HTML,
        starterCSS: FRAME_CSS(""),
        task: "フッターが本文のすぐ下に来て、その下が空いています。本文（白い部分）がヘッダーとフッターの間の高さをすべて使い、フッターが画面の下端に来るようにしよう（ヘッダーとフッターの高さは今のまま）。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [between("page", "head", "top", "top", 0), { kind: "sizeApprox", id: "head", h: BAR_HEIGHT }],
            message: "ヘッダーが、上端に中身の高さのまま置かれていません（行の高さを auto にすると、中身の高さになります。display: grid だけでは、余りがヘッダーにも配られます）",
          },
          {
            kind: "allOf",
            of: [
              { kind: "sizeApprox", id: "page", h: 280, tol: 1 },
              between("foot", "page", "bottom", "bottom", 0),
              { kind: "sizeApprox", id: "foot", h: BAR_HEIGHT },
            ],
            message: "フッターが、画面の下端に中身の高さのまま置かれていません",
          },
          {
            kind: "allOf",
            of: [between("head", "main", "bottom", "top", 0), between("main", "foot", "bottom", "top", 0)],
            message: "本文が、ヘッダーとフッターの間の高さをすべて使っていません（真ん中の行を 1fr にすると、残りの高さを本文が受け取ります）",
          },
        ],
        hints: ["ページをグリッドにして、行の高さを上から auto・1fr・auto にします", ".page { display: grid; grid-template-rows: auto 1fr auto; }"],
        solution: FRAME_CSS("  display: grid;\n  grid-template-rows: auto 1fr auto;\n"),
      },
    },
  ],
};
