import type { ValidatorSpec } from "../validate/primitives.js";
import { svgUri } from "./svg-uri.js";
import type { Track } from "./types.js";

// Grid placement is judged by the cells items end up in. The galleries are
// 280px wide with three 88px columns, so a 2 × 2 item is 184 × 152 (rows of
// 72px, gaps of 8px) on any machine; with dense packing the fourth tile moves
// up into the hole at the end of the first row; and a caption placed in the
// photo's own cell sits inside the photo, flush with its bottom edge. Setting
// a size or a position by hand can mimic these, so the last step reads the
// computed grid-auto-flow or position.

const tiles = (ids: readonly string[], cls: (i: number) => string): string =>
  ids.map((id, i) => `<div data-id="${id}" class="tile${cls(i)}">${i + 1}</div>`).join("");

const GALLERY_CSS = (rowHeight: number, extra: string): string =>
  `.gallery {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  grid-auto-rows: ${rowHeight}px;\n  gap: 8px;\n  width: 280px;\n${extra}}\n.tile {\n  display: grid;\n  place-items: center;\n  border-radius: 8px;\n  background: #dbe4fb;\n  font-weight: 700;\n}\n`;

const SPAN_HTML = `<div data-id="gallery" class="gallery">${tiles(["t1", "t2", "t3", "t4", "t5"], (i) => (i === 0 ? " featured" : ""))}</div>`;

const SPAN_CSS = (featured: string): string =>
  `${GALLERY_CSS(72, "")}.featured {\n  background: #fff3c4;\n${featured}}\n`;

const DENSE_HTML = `<div data-id="gallery" class="gallery">${tiles(["d1", "d2", "d3", "d4", "d5"], (i) => (i === 2 ? " wide" : ""))}</div>`;

const DENSE_CSS = (extra: string): string => `${GALLERY_CSS(56, extra)}.wide {\n  grid-column: span 2;\n  background: #fff3c4;\n}\n`;

const LAKE = svgUri(
  240,
  150,
  "<rect width='240' height='150' fill='#9fd3f5'/><path d='M0 96l60-40 50 30 50-36 80 46v54H0z' fill='#2f9d5b'/><rect y='112' width='240' height='38' fill='#2f5fd0'/>",
);

const CAPTION_HTML =
  `<figure data-id="card" class="card"><img data-id="photo" class="photo" src="${LAKE}" width="240" height="150" alt="湖と山の写真">` +
  '<figcaption data-id="cap" class="cap">朝の湖</figcaption></figure>';

const CAPTION_CSS = (extra: string): string =>
  `.card {\n  display: grid;\n  width: 240px;\n  margin: 0;\n}\n.photo {\n  display: block;\n  width: 100%;\n  height: auto;\n}\n.cap {\n  padding: 8px 12px;\n  background: rgb(24 32 58 / 0.7);\n  color: #fff;\n  font-size: 14px;\n}\n${extra}`;

const bottomFlush = (a: string, b: string): ValidatorSpec => ({ kind: "offset", a, b, edgeA: "bottom", edgeB: "bottom", min: -1, max: 1 });

export const gridPlacementTrack: Track = {
  id: "grid-placement",
  title: "グリッドの配置（span・dense・同じマスに重ねる）",
  summary: "span で 1 枚だけ大きくし、grid-auto-flow: dense ですき間を埋め、同じマスに置いて写真とキャプションを重ねる。",
  emoji: "🧱",
  lessons: [
    {
      id: "grid-span",
      title: "1 枚だけ大きくする: grid-column: span 2",
      explanation:
        "<p>グリッドのアイテムは、ふつう 1 マスに 1 つずつ自動で置かれます。<code>grid-column: span 2</code> は「<b>横に 2 列ぶん</b>またぐ」、<code>grid-row: span 2</code> は「<b>縦に 2 行ぶん</b>またぐ」という指定で、開始位置は自動のまま、大きさだけを変えられます。</p><p>またいだぶんのマスは、ほかのアイテムが避けて、残りのマスに順に並びます。高さが自動で決まる行の大きさは、<code>grid-auto-rows</code> で決めておけます（ここでは 72px）。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Guides/Grid_layout/Line-based_placement",
      viz: { concept: "none" },
      challenge: {
        starterHTML: SPAN_HTML,
        starterCSS: SPAN_CSS(""),
        task: "3 列のギャラリーで、1 枚目（おすすめ）を横 2 列・縦 2 行ぶんの大きさにしよう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "sizeApprox",
                id: "t1",
                w: 184,
                h: 152,
                tol: 1,
                message: "1 枚目が横 2 列・縦 2 行ぶん（184 × 152px）になっていません",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "noOverlap", ids: ["t1", "t2", "t3", "t4"] },
                  { kind: "alignedEdge", ids: ["t1", "t2"], edge: "top" },
                  { kind: "alignedEdge", ids: ["t2", "t3"], edge: "left" },
                  { kind: "order", ids: ["t2", "t3"], axis: "y" },
                ],
                message: "ほかのタイルが、大きくした 1 枚目と重なっているか、右の列に縦に並んでいません（width や height で大きくしても、マスはまたぎません）",
              },
            ],
          },
        ],
        hints: ["横は grid-column、縦は grid-row で、何マスぶんまたぐかを span で指定します", ".featured { grid-column: span 2; grid-row: span 2; }"],
        solution: SPAN_CSS("  grid-column: span 2;\n  grid-row: span 2;\n"),
      },
    },
    {
      id: "grid-dense",
      title: "すき間を埋める: grid-auto-flow: dense",
      explanation:
        "<p>自動配置は、ふつう<b>前へ戻らずに</b>順に置いていきます（<code>grid-auto-flow: row</code>）。2 列ぶんの 3 枚目が 1 行目の残り 1 マスに入らないと、次の行へ送られ、1 行目の右端に<b>すき間</b>が残ります。</p><p><code>grid-auto-flow: dense</code>（<code>row dense</code> と同じ）にすると、後ろの小さなアイテムで<b>前のすき間を埋めます</b>。ただし、見た目の順番が HTML の順とずれるので、読み上げや Tab キーでの移動の順番と食い違います。並び順に意味がない写真のギャラリーなどに使いましょう。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/grid-auto-flow",
      viz: { concept: "none" },
      challenge: {
        starterHTML: DENSE_HTML,
        starterCSS: DENSE_CSS(""),
        task: "2 列ぶんの 3 枚目が 2 行目に送られ、1 行目の右端にすき間ができています。後ろのタイルでそのすき間を埋めよう。",
        snapshot: { props: ["grid-auto-flow"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "alignedEdge", ids: ["d1", "d4"], edge: "top" },
                  { kind: "offset", a: "d4", b: "gallery", edgeA: "right", edgeB: "right", min: -1, max: 1 },
                ],
                message: "1 行目の右端のすき間が埋まっていません（4 枚目が、すき間に入るはずです）",
              },
              {
                kind: "computedMatches",
                id: "gallery",
                prop: "grid-auto-flow",
                pattern: "dense",
                message: "1 枚ずつ置き場所を指定するのではなく、grid-auto-flow: dense で自動ですき間を埋めましょう（タイルが増えても埋まります）",
              },
            ],
          },
        ],
        hints: ["自動配置が前のすき間に戻って埋めるようにする値を、グリッド（.gallery）に指定します", ".gallery { grid-auto-flow: dense; }"],
        solution: DENSE_CSS("  grid-auto-flow: dense;\n"),
      },
    },
    {
      id: "grid-overlap",
      title: "同じマスに重ねる: grid-area: 1 / 1",
      explanation:
        "<p>グリッドでは、<b>複数のアイテムを同じマスに置けます</b>。写真とキャプションの両方に <code>grid-area: 1 / 1</code>（1 行目・1 列目）を指定すると、2 つは同じマスに重なり、後に書かれた要素が上に表示されます。キャプションは <code>align-self: end</code> でマスの下端にそろえます。</p><p><code>position: absolute</code> で重ねるのと違い、どちらも流れの中に残るので、<b>マスの高さは大きいほうに合わせて決まり</b>、キャプションが長くなっても枠からはみ出しません。重なり順は <code>z-index</code> でも変えられます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/grid-area",
      viz: { concept: "none" },
      challenge: {
        starterHTML: CAPTION_HTML,
        starterCSS: CAPTION_CSS(""),
        task: "写真の下にあるキャプションを、写真の下端に重ねて表示しよう（position は使わず、グリッドの同じマスに置く）。",
        snapshot: { props: ["position"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "insideContainer", id: "cap", containerId: "photo" },
                  bottomFlush("cap", "photo"),
                  bottomFlush("photo", "card"),
                  // Aligned to the end, not stretched over the whole cell.
                  { kind: "offset", a: "photo", b: "cap", edgeA: "top", edgeB: "top", min: 75 },
                ],
                message: "キャプションが、写真の下端に重なっていません（写真とキャプションを同じマスに置き、align-self: end で下端にそろえます。そろえないと、マス全体に引き伸ばされます）",
              },
              {
                kind: "computedEquals",
                id: "cap",
                prop: "position",
                value: "static",
                message: "position: absolute でも重なりますが、ここではグリッドの同じマスに置いて重ねましょう（キャプションが長くなっても、枠からはみ出しません）",
              },
            ],
          },
        ],
        hints: ["写真とキャプションの両方を 1 行目・1 列目に置き、キャプションを align-self: end で下端に", ".photo, .cap { grid-area: 1 / 1; } .cap { align-self: end; }"],
        solution: CAPTION_CSS(".photo,\n.cap {\n  grid-area: 1 / 1;\n}\n.cap {\n  align-self: end;\n}\n"),
      },
    },
  ],
};
