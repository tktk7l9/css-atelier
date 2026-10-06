import type { SnapshotRequest } from "../validate/snapshot.js";
import type { Track } from "./types.js";

// The grid visualizer reads the parent grid's resolved tracks and gaps; the
// subgrid itself has no tracks of its own, which is the point of the lessons.
const GRID_PROPS: SnapshotRequest = {
  props: ["display", "grid-template-columns", "grid-template-rows", "column-gap", "row-gap"],
};

export const subgridTrack: Track = {
  id: "subgrid",
  title: "サブグリッド",
  summary: "入れ子のグリッドを親のトラックにそろえる subgrid。",
  emoji: "🧩",
  lessons: [
    {
      id: "subgrid-columns",
      title: "親の列にそろえる: grid-template-columns: subgrid",
      explanation:
        "<p>グリッドの中に入れ子のグリッドを作ると、子は<b>自分だけのトラック</b>を持つので、親の列とはそろいません。<code>grid-template-columns: subgrid</code> を指定すると、入れ子のグリッドは新しい列を作らず、<b>またいでいる親の列</b>をそのまま使います。gap も親から引き継ぎます。</p><p>subgrid は主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Guides/Grid_layout/Subgrid",
      viz: { concept: "grid", containerId: "grid" },
      challenge: {
        starterHTML:
          '<div data-id="grid" class="grid"><div data-id="a" class="cell">A</div><div data-id="b" class="cell">B</div><div data-id="c" class="cell">C</div><div data-id="row" class="row"><div data-id="x" class="cell">X</div><div data-id="y" class="cell">Y</div><div data-id="z" class="cell">Z</div></div></div>',
        starterCSS:
          ".grid {\n  display: grid;\n  grid-template-columns: 60px 1fr 2fr;\n  gap: 8px;\n  width: 320px;\n}\n.row {\n  grid-column: 1 / -1;\n  display: grid;\n  \n}\n.cell {\n  padding: 8px;\n  background: #dbe4fb;\n}\n.row .cell {\n  background: #2f5fd0;\n  color: #fff;\n}\n",
        task: ".row の中の X・Y・Z を、親グリッドの 3 列（A・B・C）にぴったりそろえよう（subgrid を使う）。",
        snapshot: GRID_PROPS,
        validators: [
          { kind: "declarationEquals", selector: ".row", prop: "grid-template-columns", value: "subgrid" },
          { kind: "alignedEdge", ids: ["a", "x"], edge: "left", message: "X が A の列にそろっていません" },
          { kind: "alignedEdge", ids: ["b", "y"], edge: "left", message: "Y が B の列にそろっていません" },
          { kind: "alignedEdge", ids: ["c", "z"], edge: "left", message: "Z が C の列にそろっていません" },
          { kind: "relativeSize", a: "y", b: "b", ratio: 1, dim: "w" },
          { kind: "alignedEdge", ids: ["x", "y", "z"], edge: "top", message: "X・Y・Z が同じ行に並んでいません" },
        ],
        hints: ["入れ子のグリッド .row に指定します（.row は grid-column: 1 / -1 で 3 列をまたいでいます）", "grid-template-columns: subgrid"],
        solution:
          ".grid {\n  display: grid;\n  grid-template-columns: 60px 1fr 2fr;\n  gap: 8px;\n  width: 320px;\n}\n.row {\n  grid-column: 1 / -1;\n  display: grid;\n  grid-template-columns: subgrid;\n}\n.cell {\n  padding: 8px;\n  background: #dbe4fb;\n}\n.row .cell {\n  background: #2f5fd0;\n  color: #fff;\n}\n",
      },
    },
    {
      id: "subgrid-rows",
      title: "カードの中身をそろえる: grid-template-rows: subgrid",
      explanation:
        "<p>カードを横に並べると、タイトルの行数が違うだけで本文やフッターの位置がカードごとにずれます。各カードを親の <b>3 行ぶん</b>にまたがらせ（<code>grid-row: span 3</code>）、<code>grid-template-rows: subgrid</code> を指定すると、すべてのカードが<b>同じ行トラック</b>を共有し、タイトル・本文・フッターが横一直線にそろいます。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/grid-template-rows",
      viz: { concept: "grid", containerId: "cards" },
      challenge: {
        starterHTML:
          '<div data-id="cards" class="cards"><div data-id="card1" class="card"><h3 data-id="t1">春の新作<br>コレクション</h3><p data-id="p1">本文</p><div data-id="f1" class="foot">詳しく</div></div><div data-id="card2" class="card"><h3 data-id="t2">定番</h3><p data-id="p2">本文</p><div data-id="f2" class="foot">詳しく</div></div></div>',
        starterCSS:
          ".cards {\n  display: grid;\n  grid-template-columns: 150px 150px;\n  gap: 4px 12px;\n}\n.card {\n  display: grid;\n  \n  padding: 8px;\n  background: #dbe4fb;\n}\n.card h3,\n.card p {\n  margin: 0;\n  font-size: 16px;\n}\n.foot {\n  color: #2f5fd0;\n}\n",
        task: "2 枚のカードのタイトル・本文・「詳しく」が横にそろうよう、.card を親の 3 行にまたがらせて、行を subgrid にしよう。",
        snapshot: GRID_PROPS,
        validators: [
          { kind: "declarationEquals", selector: ".card", prop: "grid-template-rows", value: "subgrid" },
          { kind: "alignedEdge", ids: ["t1", "t2"], edge: "top", message: "タイトルの上端がそろっていません" },
          { kind: "alignedEdge", ids: ["p1", "p2"], edge: "top", message: "本文の上端がそろっていません" },
          { kind: "alignedEdge", ids: ["f1", "f2"], edge: "top", message: "「詳しく」の上端がそろっていません" },
        ],
        hints: ["まず grid-row: span 3 で、カードを親の 3 行にまたがらせます", "grid-template-rows: subgrid"],
        solution:
          ".cards {\n  display: grid;\n  grid-template-columns: 150px 150px;\n  gap: 4px 12px;\n}\n.card {\n  display: grid;\n  grid-row: span 3;\n  grid-template-rows: subgrid;\n  padding: 8px;\n  background: #dbe4fb;\n}\n.card h3,\n.card p {\n  margin: 0;\n  font-size: 16px;\n}\n.foot {\n  color: #2f5fd0;\n}\n",
      },
    },
  ],
};
