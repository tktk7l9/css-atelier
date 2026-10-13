import type { Edge, ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Implicit and auto grid tracks are judged by where the cards land: in one
// row, 140px wide and 12px apart, with the row itself scrolling sideways; the
// sidebar running from the first section's top to the last one's bottom; and
// cards that keep their one-line height (24px of padding plus a 22.4px line)
// with the second row starting 12px under the first instead of stretching
// down the 240px box.

const between = (a: string, b: string, edgeA: Edge, edgeB: Edge, px: number): ValidatorSpec => ({
  kind: "offset",
  a,
  b,
  edgeA,
  edgeB,
  min: px - 0.5,
  max: px + 0.5,
});

const COURSES = ["春の講座", "夏の講座", "秋の講座", "冬の講座", "特別講座"];

const ROW_HTML =
  '<ul data-id="row" class="row">' + COURSES.map((t, i) => `<li data-id="c${i + 1}">${t}</li>`).join("") + "</ul>";

const ROW_CSS = (extra: string): string =>
  `.row {\n  display: grid;\n  gap: 12px;\n${extra}  margin: 0;\n  padding: 0 0 8px;\n  list-style: none;\n}\n.row li {\n  padding: 12px;\n  border-radius: 8px;\n  background: #dbe4fb;\n}\n`;

const SIDE_HTML =
  '<div class="page"><nav data-id="side" class="side">目次</nav>' +
  '<section data-id="a" class="block">はじめに</section><section data-id="b" class="block">講座の内容</section>' +
  '<section data-id="c" class="block">申し込み</section></div>';

const SIDE_CSS = (rows: string): string =>
  `.page {\n  display: grid;\n  grid-template-columns: 100px 1fr;\n  gap: 8px;\n}\n/* 目次を、左の列の上から下まで通したい */\n.side {\n  grid-column: 1;\n  grid-row: ${rows};\n  padding: 8px;\n  border-radius: 8px;\n  background: #dbe4fb;\n}\n.block {\n  grid-column: 2;\n  padding: 12px;\n  border-radius: 8px;\n  background: #eef1f8;\n}\n`;

const BOX_HTML =
  '<ul data-id="grid" class="grid">' +
  COURSES.slice(0, 4)
    .map((t, i) => `<li data-id="c${i + 1}">${t}</li>`)
    .join("") +
  "</ul>";

const BOX_CSS = (extra: string): string =>
  `/* 一覧の箱に高さを付けた（カードが増えたらスクロール） */\n.grid {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 12px;\n  height: 240px;\n  overflow-y: auto;\n${extra}  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.grid li {\n  padding: 12px;\n  border-radius: 8px;\n  background: #dbe4fb;\n}\n`;

/** One line of 16px text at line-height 1.4 plus 12px of padding above and below. */
const CARD_HEIGHT = 46.4;

export const gridImplicitTrack: Track = {
  id: "grid-implicit",
  title: "グリッドの暗黙のトラック（横に流す・-1 が届かない・伸びる行）",
  summary: "grid-auto-flow: column で自動で足される列に横に流し、-1 が明示的な線までしか届かないことを span で補い、高さのある箱で伸びる auto の行を align-content: start で詰める。",
  emoji: "🛤️",
  lessons: [
    {
      id: "auto-flow-column",
      title: "横 1 列に流す: grid-auto-flow: column",
      explanation:
        "<p>グリッドは、ふつう<b>行を足しながら</b>アイテムを並べるので、列を決めていないと、カードは縦に 1 列に積まれます。<code>grid-auto-flow: column</code> にすると、<b>列を足しながら</b>横に並べます。自動で足される（暗黙の）列の幅は、<code>grid-auto-columns</code> で決めます。</p><p>入りきらないカードは、<code>overflow-x: auto</code> で箱の中を横にスクロールさせます。カードがいくつ増えても、同じ指定のまま横に流れていきます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/grid-auto-flow",
      viz: { concept: "none" },
      challenge: {
        starterHTML: ROW_HTML,
        starterCSS: ROW_CSS(""),
        task: "縦に積まれている講座のカードを、幅 140px で横 1 列に並べ、入りきらない分は一覧の箱の中で横にスクロールさせよう。",
        snapshot: { props: ["overflow-x"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "alignedEdge",
                ids: ["c1", "c3", "c5"],
                edge: "top",
                tol: 0.5,
                message: "カードが横 1 列に並んでいません（グリッドは、ふつう行を足しながら並べます。grid-auto-flow: column にすると、列を足しながら横に並べます）",
              },
              {
                kind: "allOf",
                of: [{ kind: "sizeApprox", id: "c1", w: 140, tol: 0.5 }, between("c1", "c2", "right", "left", 12)],
                message: "カードの幅が 140px になっていません（自動で足される列の幅は grid-auto-columns で決めます）",
              },
              {
                kind: "computedMatches",
                id: "row",
                prop: "overflow-x",
                pattern: "^(?:auto|scroll)$",
                message: "入りきらないカードが、一覧の箱の中で横にスクロールしません（overflow-x: auto）",
              },
            ],
          },
        ],
        hints: ["列を足しながら並べる grid-auto-flow の値と、その列の幅を決めるプロパティがあります", ".row { grid-auto-flow: column; grid-auto-columns: 140px; overflow-x: auto; }"],
        solution: ROW_CSS("  grid-auto-flow: column;\n  grid-auto-columns: 140px;\n  overflow-x: auto;\n"),
      },
    },
    {
      id: "minus-one-explicit",
      title: "-1 が届かない: grid-row: 1 / span 3",
      explanation:
        "<p><code>grid-row: 1 / -1</code> の <code>-1</code> は、<b>明示的なグリッド</b>（<code>grid-template-rows</code> で作った行）の最後の線です。行を作らずに、アイテムが自動で足した（暗黙の）行には届きません。このページは行を作っていないので、<code>1 / -1</code> は 1 行目だけになり、目次が上の段にしか伸びません。</p><p>何行またぐかがわかっているなら、<code>grid-row: 1 / span 3</code> のように <code>span</code> で書きます。<code>grid-template-rows</code> で 3 行を作っておけば、<code>1 / -1</code> も 3 行目の下まで届きます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Guides/Grid_layout/Line-based_placement",
      viz: { concept: "none" },
      challenge: {
        starterHTML: SIDE_HTML,
        starterCSS: SIDE_CSS("1 / -1"),
        task: "目次を左の列の上から下まで通したくて grid-row: 1 / -1 と書いたのに、1 段目にしか伸びていません。目次を、3 つの区画の上端から下端まで伸ばそう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "alignedEdge", ids: ["side", "a"], edge: "top", tol: 0.5 },
              { kind: "alignedEdge", ids: ["side", "c"], edge: "bottom", tol: 0.5 },
            ],
            message: "目次が、3 つの区画の上端から下端まで伸びていません（-1 は grid-template-rows で作った行の最後の線で、自動で足された行には届きません。grid-row: 1 / span 3 で 3 行ぶんまたがせます）",
          },
        ],
        hints: ["何行ぶんまたぐかを span で書きます", ".side { grid-row: 1 / span 3; }"],
        solution: SIDE_CSS("1 / span 3"),
      },
    },
    {
      id: "rows-stretch",
      title: "高さのある箱で行が伸びる: align-content: start",
      explanation:
        "<p>グリッドの箱に高さを付けると、余った高さは <code>auto</code> の行に<b>等しく配られ</b>、行が伸びます。カードは行いっぱいに伸びるので、中身が 1 行なのに縦に長くなります。</p><p><code>align-content: start</code> にすると、行は中身の高さのまま上に詰まり、余りは箱の下に残ります。<code>align-items: start</code> はカードを行の中で縮めるだけで、行そのものは伸びたままなので、2 段目のカードは離れたままです。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/align-content",
      viz: { concept: "none" },
      challenge: {
        starterHTML: BOX_HTML,
        starterCSS: BOX_CSS(""),
        task: "一覧の箱に高さ（240px）を付けたら、カードが縦に伸びました。カードを中身の高さのまま、上から 12px 間隔で並べよう（箱の高さはそのまま）。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "sizeApprox",
                id: "c1",
                h: CARD_HEIGHT,
                tol: 1,
                message: "カードが、中身の高さより縦に伸びています（箱の余った高さが auto の行に配られています。align-content: start で行を上に詰めます）",
              },
              {
                ...between("c1", "c3", "bottom", "top", 12),
                message: "2 段目のカードが、1 段目のすぐ下（12px）に来ていません（align-items: start はカードを縮めるだけで、行は伸びたままです。行そのものを上に詰めるのは align-content: start です）",
              },
              { kind: "sizeApprox", id: "grid", h: 240, tol: 0.5, message: "一覧の箱の高さは 240px のままにしましょう" },
            ],
          },
        ],
        hints: ["行そのものを、箱の上に詰める指定があります", ".grid { align-content: start; }"],
        solution: BOX_CSS("  align-content: start;\n"),
      },
    },
  ],
};
