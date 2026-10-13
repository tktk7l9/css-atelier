import type { Edge, ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Card rows are judged by box edges, so any layout that lines the boxes up
// passes: the buttons share the cards' bottom edge (12px inside the padding)
// while the short card's heading and text stay packed at the top; both
// wrapped cards fill their list items, as wide as before and only as tall as
// the taller card's content; and the last row starts under the first column,
// 20px apart, with the first row unchanged.

const between = (a: string, b: string, edgeA: Edge, edgeB: Edge, px: number): ValidatorSpec => ({
  kind: "offset",
  a,
  b,
  edgeA,
  edgeB,
  min: px - 0.5,
  max: px + 0.5,
});

const LONG_TEXT = "桜の名所をめぐる、三泊四日の旅です。お弁当がつきます。";
const SHORT_TEXT = "海辺の町を歩きます。";

const FOOT_HTML =
  '<div class="list">' +
  `<article data-id="a" class="card"><h3>春の講座</h3><p>${LONG_TEXT}</p><span data-id="ba" class="more">詳しく</span></article>` +
  `<article data-id="b" class="card"><h3 data-id="hb">夏の講座</h3><p data-id="pb">${SHORT_TEXT}</p><span data-id="bb" class="more">詳しく</span></article>` +
  "</div>";

const FOOT_CSS = (card: string, more: string): string =>
  `.list {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 12px;\n}\n.card {\n${card}  padding: 12px;\n  border-radius: 8px;\n  background: #eef1f8;\n}\n.card h3 {\n  margin: 0 0 4px;\n  font-size: 16px;\n}\n.card p {\n  margin: 0 0 8px;\n  font-size: 14px;\n}\n.more {\n  display: block;\n  width: fit-content;\n${more}  padding: 4px 12px;\n  border-radius: 6px;\n  background: #2f5fd0;\n  color: #fff;\n  font-size: 14px;\n}\n`;

const WRAP_HTML =
  '<ul class="list">' +
  `<li data-id="la"><article data-id="ca" class="card"><h3>春の講座</h3><p data-id="pa">${LONG_TEXT}</p></article></li>` +
  `<li data-id="lb"><article data-id="cb" class="card"><h3>夏の講座</h3><p>${SHORT_TEXT}</p></article></li>` +
  "</ul>";

const WRAP_CSS = (extra: string): string =>
  `.list {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 12px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n${extra}.card {\n  padding: 12px;\n  border-radius: 8px;\n  background: #eef1f8;\n}\n.card h3 {\n  margin: 0 0 4px;\n  font-size: 16px;\n}\n.card p {\n  margin: 0;\n  font-size: 14px;\n}\n`;

const ROW_HTML =
  '<div data-id="list" class="list">' +
  [1, 2, 3, 4, 5].map((n) => `<div data-id="i${n}" class="item">${n}</div>`).join("") +
  "</div>";

const ROW_CSS = (spacing: string): string =>
  `.list {\n  display: flex;\n  flex-wrap: wrap;\n${spacing}  width: 280px;\n}\n.item {\n  display: grid;\n  place-items: center;\n  width: 80px;\n  height: 56px;\n  border-radius: 8px;\n  background: #dbe4fb;\n}\n`;

export const cardRowsTrack: Track = {
  id: "card-rows",
  title: "カードの並び（ボタンを下端に・高さをそろえる・最後の行）",
  summary: "縦向きの flex と margin-top: auto でボタンを下端にそろえ、li に包まれたカードを li いっぱいに伸ばし、space-between で離れる最後の行を gap で左から詰める。",
  emoji: "🃏",
  lessons: [
    {
      id: "push-footer",
      title: "ボタンを下端にそろえる: margin-top: auto",
      explanation:
        "<p>グリッドの同じ行のカードは、背の高いカードに合わせて<b>同じ高さに伸びます</b>。でも、カードの中はふつうのブロックの並びなので、ボタンは本文のすぐ下に来て、本文の短いカードではボタンが上にずれます。</p><p>カードを縦向きの flex（<code>display: flex; flex-direction: column</code>）にして、ボタンに <code>margin-top: auto</code> を付けると、auto のマージンが<b>余った高さをすべて吸収</b>し、ボタンがカードの下端へ押し出されます。見出しと本文は上に詰めたままです。<code>justify-content: space-between</code> だと、余りが見出し・本文・ボタンの間に分けられ、本文が真ん中に浮きます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Guides/Flexible_box_layout/Aligning_items",
      viz: { concept: "none" },
      challenge: {
        starterHTML: FOOT_HTML,
        starterCSS: FOOT_CSS("", ""),
        task: "本文の短いカードでは、「詳しく」ボタンが上にずれています。2 枚のカードのボタンを、カードの下端にそろえよう（見出しと本文は上に詰めたまま）。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [{ kind: "alignedEdge", ids: ["ba", "bb"], edge: "bottom", tol: 0.5 }, between("bb", "b", "bottom", "bottom", 12)],
            message: "2 枚のカードのボタンが、カードの下端（内側の余白 12px）にそろっていません（カードを縦向きの flex にして、ボタンに margin-top: auto を付けると、余りがボタンの上に集まります）",
          },
          {
            kind: "allOf",
            of: [between("b", "hb", "top", "top", 12), between("hb", "pb", "bottom", "top", 4)],
            message: "短いカードの見出しと本文が、上に詰めて並んでいません（余りはボタンの上だけに集めます。justify-content: space-between では、本文まで動きます）",
          },
        ],
        hints: ["カードを縦向きの flex にすると、auto のマージンが余りを吸収します", ".card { display: flex; flex-direction: column; } .more { margin-top: auto; }"],
        solution: FOOT_CSS("  display: flex;\n  flex-direction: column;\n", "  margin-top: auto;\n"),
      },
    },
    {
      id: "stretch-cards",
      title: "li に包んだカードの高さをそろえる: li もグリッドに",
      explanation:
        "<p>カードを <code>&lt;li&gt;</code> で包んだ一覧では、グリッドのアイテムは <code>li</code> なので、<b>伸びるのは li だけ</b>です。中のカードは中身の高さのままなので、背景の高さがそろいません。</p><p><code>li</code> もグリッド（<code>display: grid</code>）にすると、中のカードが li のグリッドアイテムになり、<b>幅も高さも li いっぱいに</b>伸びます。<code>display: flex</code> だと、高さは伸びますが、横並びの flex のアイテムは中身の幅までしか広がらないので、本文の短いカードが細くなります。カードの高さを px で決めると、本文が変わったときに合わなくなります。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Guides/Grid_layout/Box_alignment",
      viz: { concept: "none" },
      challenge: {
        starterHTML: WRAP_HTML,
        starterCSS: WRAP_CSS(""),
        task: "li に包んだカードの背景の高さがそろっていません。2 枚のカードを、li の幅と高さいっぱいに伸ばして、背の高いカードに高さをそろえよう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "alignedEdge", ids: ["la", "ca", "cb"], edge: "top", tol: 0.5 },
              { kind: "alignedEdge", ids: ["la", "ca", "cb"], edge: "bottom", tol: 0.5 },
            ],
            message: "2 枚のカードの高さがそろっていません（伸びているのは li だけで、中のカードは中身の高さのままです。li をグリッドにすると、中のカードも li いっぱいに伸びます）",
          },
          {
            kind: "allOf",
            of: [
              { kind: "alignedEdge", ids: ["lb", "cb"], edge: "left", tol: 0.5 },
              { kind: "alignedEdge", ids: ["lb", "cb"], edge: "right", tol: 0.5 },
            ],
            message: "短いカードが、li の幅いっぱいではなくなりました（li を display: flex にすると、中のカードは中身の幅までしか広がりません。display: grid なら、幅も高さも伸びます）",
          },
          {
            ...between("pa", "ca", "bottom", "bottom", 12),
            message: "背の高いカードの本文の下に、余白 12px より広いすき間ができています（高さを px で決めずに、背の高いカードの中身に合わせて伸ばします）",
          },
        ],
        hints: ["li をグリッドにすると、中のカードが li のグリッドアイテムになって伸びます", ".list li { display: grid; }"],
        solution: WRAP_CSS(".list li {\n  display: grid;\n}\n"),
      },
    },
    {
      id: "last-row",
      title: "最後の行が離れる: space-between の代わりに gap",
      explanation:
        "<p><code>justify-content: space-between</code> は、余ったスペースを<b>行ごとに</b>アイテムの間へ配ります。折り返した最後の行のアイテムが少ないと、その行でも最初と最後のアイテムが両端へ離れるので、上の行と列がそろいません。</p><p>間隔は <code>gap</code>（ここでは横 20px）で決めて、<code>justify-content</code> は既定（行の始まりから詰める）に戻すと、最後の行も上の行と同じ位置から並びます。1 行目は 80px × 3 ＋ 20px × 2 ＝ 280px で、幅ぴったりです。上下の行の列をきちんとそろえたいときは、グリッドを使う方法もあります。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/justify-content",
      viz: { concept: "none" },
      challenge: {
        starterHTML: ROW_HTML,
        starterCSS: ROW_CSS("  justify-content: space-between;\n  row-gap: 12px;\n"),
        task: "2 行目の 4 と 5 が両端に離れています。1 行目の並び（3 つ・間隔 20px・両端ぴったり）はそのままに、2 行目も左から 20px 間隔で並べよう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "alignedEdge", ids: ["list", "i1"], edge: "left", tol: 0.5 },
              between("i1", "i2", "right", "left", 20),
              { kind: "alignedEdge", ids: ["i3", "list"], edge: "right", tol: 0.5 },
              { kind: "alignedEdge", ids: ["i1", "i2", "i3"], edge: "top", tol: 0.5 },
            ],
            message: "1 行目の並び（3 つ・間隔 20px・両端ぴったり）が変わりました（横の間隔を gap: 20px にすれば、1 行目は今と同じ位置になります）",
          },
          {
            kind: "allOf",
            of: [
              { kind: "order", ids: ["i1", "i4"], axis: "y" },
              { kind: "alignedEdge", ids: ["i1", "i4"], edge: "left", tol: 0.5 },
              between("i4", "i5", "right", "left", 20),
              { kind: "alignedEdge", ids: ["i4", "i5"], edge: "top", tol: 0.5 },
            ],
            message: "2 行目が、左から 20px 間隔で並んでいません（space-between は行ごとに余りを配るので、最後の行の 2 つも両端へ離れます。間隔は gap で決めて、左から詰めます）",
          },
        ],
        hints: ["space-between をやめて、横の間隔を gap で決めます", ".list { gap: 12px 20px; }（justify-content: space-between は消します）"],
        solution: ROW_CSS("  gap: 12px 20px;\n"),
      },
    },
  ],
};
