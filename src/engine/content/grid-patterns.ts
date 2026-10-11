import type { ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Grids are judged by the cells their items land in. The two gallery lessons
// fix the preview at 560px and check it again at 320px, because what they
// teach only shows across widths: an auto-filled grid makes four 120px-plus
// columns at 560px and two at 320px, and a heading placed from line 1 to
// line -1 fills the row at both, while a hard-coded `span 4` adds implicit
// columns once only two fit. The code lesson is fluid: its two columns must
// come out equal wherever the preview ends.

const tiles = (from: number, count: number): string =>
  Array.from({ length: count }, (_, i) => `<div data-id="t${from + i}" class="tile"></div>`).join("");

const TILE_CSS =
  ".tile {\n  height: 56px;\n  border-radius: 8px;\n  background: linear-gradient(135deg, #9fd3f5, #2f5fd0);\n}\n";

const GALLERY_HTML = `<div data-id="gallery" class="gallery">${tiles(1, 6)}</div>`;

const GALLERY_CSS = (columns: string): string =>
  `.gallery {\n  display: grid;\n  grid-template-columns: ${columns};\n  gap: 12px;\n}\n${TILE_CSS}`;

const MONTHS_HTML =
  `<div data-id="gallery" class="gallery"><h3 data-id="oct" class="month">10 月</h3>${tiles(1, 3)}` +
  `<h3 data-id="sep" class="month">9 月</h3>${tiles(4, 2)}</div>`;

const MONTHS_CSS = (extra: string): string =>
  `.gallery {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));\n  gap: 8px 12px;\n}\n.month {\n  margin: 0;\n  font-size: 14px;\n${extra}}\n.tile {\n  height: 48px;\n  border-radius: 8px;\n  background: linear-gradient(135deg, #9fd3f5, #2f5fd0);\n}\n`;

const DOCS_HTML =
  '<div data-id="docs" class="docs"><article data-id="note" class="note"><h3>インストール</h3>' +
  "<p>次のコマンドで、プロジェクトに必要なパッケージをまとめて入れます。</p></article>" +
  '<article data-id="code" class="code"><pre data-id="pre">npm install --save-dev vite vitest @vitest/coverage-v8 typescript</pre></article></div>';

const DOCS_CSS = (columns: string): string =>
  `.docs {\n  display: grid;\n  grid-template-columns: ${columns};\n  gap: 12px;\n}\n.note h3 {\n  margin: 0 0 4px;\n  font-size: 15px;\n}\n.note p {\n  margin: 0;\n  font-size: 14px;\n}\n.code {\n  padding: 8px;\n  border-radius: 8px;\n  background: #18203a;\n}\n.code pre {\n  margin: 0;\n  overflow-x: auto;\n  color: #fff;\n  font-size: 13px;\n}\n`;

/** `id`'s right edge meets the gallery's right edge: the columns fill the row. */
const endsAtRight = (id: string): ValidatorSpec => ({
  kind: "offset",
  a: id,
  b: "gallery",
  edgeA: "right",
  edgeB: "right",
  min: -1,
  max: 1,
});

/** `id` is at least `px` wide. */
const atLeast = (id: string, px: number): ValidatorSpec => ({
  kind: "offset",
  a: id,
  b: id,
  edgeA: "left",
  edgeB: "right",
  min: px,
});

const sameWidth = (a: string, b: string): ValidatorSpec => ({ kind: "relativeSize", a, b, ratio: 1, dim: "w", tol: 2 });

/** The month headings span the row and the tiles start on the row below each. */
const headingsSpan: ValidatorSpec = {
  kind: "allOf",
  of: [sameWidth("oct", "gallery"), sameWidth("sep", "gallery")],
};

const tilesBelowHeadings: ValidatorSpec = {
  kind: "allOf",
  of: [
    { kind: "order", ids: ["oct", "t1"], axis: "y" },
    { kind: "alignedEdge", ids: ["oct", "t1", "t4"], edge: "left" },
    { kind: "order", ids: ["t3", "sep", "t4"], axis: "y" },
  ],
};

export const gridPatternsTrack: Track = {
  id: "grid-patterns",
  title: "グリッドの応用",
  summary: "repeat(auto-fill, minmax()) で列の数を幅に任せ、grid-column: 1 / -1 で行いっぱいに広げ、minmax(0, 1fr) で列の広がりを止める。",
  emoji: "🍱",
  lessons: [
    {
      id: "grid-auto-fill",
      title: "列の数を幅に任せる: repeat(auto-fill, minmax())",
      explanation:
        "<p>列の数を決め打ちした <code>repeat(4, 1fr)</code> は、狭い画面でも 4 列のままなので、タイルがどんどん細くなります。<code>repeat(auto-fill, minmax(120px, 1fr))</code> と書くと、<b>120px 以上の列が入るだけ</b>作られ、余りは <code>1fr</code> で列どうしが分け合います。メディアクエリを書かなくても、幅に合わせて列の数が変わります。</p><p><code>minmax(最小, 最大)</code> は列の幅の範囲です。<code>auto-fill</code> の代わりに <code>auto-fit</code> と書くと、アイテムの入らない空の列が幅 0 につぶれるので、アイテムが少ないときに行いっぱいまで広がります（アイテムで行が埋まるときは同じ結果です）。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。プレビューは幅 560px で採点し、320px でも確かめます。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/repeat",
      viz: { concept: "none" },
      challenge: {
        viewport: 560,
        starterHTML: GALLERY_HTML,
        starterCSS: GALLERY_CSS("repeat(4, 1fr)"),
        task: "写真のタイルが 4 列に決め打ちされていて、幅 320px では細くなりすぎます。タイルが 120px より細くならないよう、入るだけの列を自動で作り、余りは列どうしで分け合おう（幅 560px で 4 列、320px で 2 列）。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "alignedEdge", ids: ["t1", "t2", "t3", "t4"], edge: "top" },
                  { kind: "order", ids: ["t1", "t2", "t3", "t4"], axis: "x" },
                  { kind: "order", ids: ["t1", "t5"], axis: "y" },
                  { kind: "alignedEdge", ids: ["t1", "t5"], edge: "left" },
                ],
                message: "幅 560px で 4 列になっていません（1 段目に 4 枚、5 枚目は 2 段目の先頭に来るはずです）",
              },
              {
                kind: "allOf",
                of: [endsAtRight("t4"), atLeast("t1", 120)],
                message: "タイルが行の幅いっぱいに広がっていません（120px 以上の列を、余りを分け合って広げます）",
              },
              {
                ...sameWidth("t5", "t1"),
                message: "2 段目のタイルが 1 段目と同じ列の幅になっていません（グリッドの列にそろえましょう）",
              },
              {
                kind: "declarationMatches",
                selector: ".gallery",
                prop: "grid-template-columns",
                pattern: "repeat\\(\\s*auto-(?:fill|fit)\\s*,\\s*minmax\\(",
                message: "grid-template-columns を repeat(auto-fill, minmax(120px, 1fr)) にして、列の数をブラウザに任せましょう（列の数を決め打ちしたり、メディアクエリで切り替えたりせずに）",
              },
            ],
          },
        ],
        states: [
          {
            viewport: 320,
            validators: [
              {
                kind: "allOf",
                of: [
                  { kind: "alignedEdge", ids: ["t1", "t2"], edge: "top" },
                  { kind: "order", ids: ["t1", "t2"], axis: "x" },
                  { kind: "order", ids: ["t1", "t3"], axis: "y" },
                  { kind: "alignedEdge", ids: ["t1", "t3"], edge: "left" },
                  endsAtRight("t2"),
                  atLeast("t1", 120),
                ],
                message: "幅 320px で 2 列になっていません（タイルが 120px より細くならないよう、入るだけの列にします）",
              },
            ],
          },
        ],
        hints: ["列の数の代わりに auto-fill、列の幅に minmax(120px, 1fr) を書きます", ".gallery { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }"],
        solution: GALLERY_CSS("repeat(auto-fill, minmax(120px, 1fr))"),
      },
    },
    {
      id: "grid-full-row",
      title: "行いっぱいに広げる: grid-column: 1 / -1",
      explanation:
        "<p>グリッドの線には、<b>左から 1, 2, 3…</b>、<b>右から -1, -2…</b> と番号が付いています。<code>grid-column: 1 / -1</code> は「最初の線から最後の線まで」なので、列がいくつあっても<b>行いっぱい</b>に広がります。</p><p><code>grid-column: span 4</code> のように数を決め打ちすると、列が 4 つある幅ではそろいますが、列が 2 つしかない幅では、グリッドが足りない列を自動で足して（暗黙のグリッド）、ほかのアイテムの並びまで崩れます。<code>-1</code> が指すのは、<code>grid-template-columns</code> で作った列（明示的なグリッド）の最後の線です。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。プレビューは幅 560px で採点し、320px でも確かめます。</p>",
      mdnPath: "/ja/docs/Web/CSS/Guides/Grid_layout/Line-based_placement",
      viz: { concept: "none" },
      challenge: {
        viewport: 560,
        starterHTML: MONTHS_HTML,
        starterCSS: MONTHS_CSS(""),
        task: "月ごとの見出し（10 月・9 月）が、写真と同じ 1 マスに入っています。見出しを、列の数にかかわらず行いっぱいに広げよう（幅 560px でも 320px でも）。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              { ...headingsSpan, message: "見出し（10 月・9 月）が行の幅いっぱいに広がっていません" },
              { ...tilesBelowHeadings, message: "写真が、見出しの下の行から始まっていません" },
            ],
          },
        ],
        states: [
          {
            viewport: 320,
            validators: [
              {
                kind: "allOf",
                of: [
                  { ...headingsSpan, message: "幅 320px で、見出しが行の幅いっぱいに広がっていません" },
                  { ...tilesBelowHeadings, message: "幅 320px で、写真が見出しの下の行から始まっていません" },
                  {
                    kind: "allOf",
                    of: [endsAtRight("t2"), sameWidth("t1", "t3")],
                    message: "幅 320px で、写真が 2 列に並んでいません（span 4 のように列の数を決め打ちすると、列が足りない幅では空の列が足されます）",
                  },
                ],
              },
            ],
          },
        ],
        hints: ["見出し（.month）が、最初の線から最後の線までをまたぐようにします", ".month { grid-column: 1 / -1; }"],
        solution: MONTHS_CSS("  grid-column: 1 / -1;\n"),
      },
    },
    {
      id: "grid-minmax-zero",
      title: "1fr が広がるのを止める: minmax(0, 1fr)",
      explanation:
        "<p><code>1fr</code> は「残りを分け合う」幅ですが、じつは <code>minmax(auto, 1fr)</code> の略で、列の<b>最小の幅が auto</b>（ふつうは中身の最小の幅＝min-content）です。折り返せない長いコードの行があると、その列は中身の幅より細くなれず、<code>1fr 1fr</code> でも列の幅がそろいません。中の <code>pre</code> に <code>overflow-x: auto</code> を付けても、外側のグリッドのアイテムは中身の幅を最小として持ち続けます。</p><p><code>minmax(0, 1fr)</code> と最小を 0 にすると、列は中身に関係なく均等に分かれ、はみ出すぶんは <code>pre</code> の中でスクロールします。グリッドのアイテム（.code）に <code>min-width: 0</code> を指定しても同じ効果です。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/minmax",
      viz: { concept: "none" },
      challenge: {
        starterHTML: DOCS_HTML,
        starterCSS: DOCS_CSS("1fr 1fr"),
        task: "説明とコードの 2 列は 1fr 1fr なのに、長いコマンドの行のぶんコードの列が広がり、説明の列が細くなっています。2 つの列を同じ幅にして、長い行はコードの枠の中でスクロールさせよう。",
        snapshot: { props: ["min-width", "overflow-x"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                ...sameWidth("note", "code"),
                message: "説明とコードの列の幅がそろっていません（長いコマンドの行のぶん、コードの列が広がっています）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "insideContainer", id: "pre", containerId: "code" },
                  { kind: "insideContainer", id: "code", containerId: "docs" },
                ],
                message: "コードが枠からはみ出しています（pre の overflow-x: auto はそのままで、列が広がらないようにしましょう）",
              },
              {
                // The track minimum is 0, or the item itself may shrink below its content.
                kind: "anyOf",
                of: [
                  { kind: "declarationMatches", selector: ".docs", prop: "grid-template-columns", pattern: "minmax\\(\\s*0" },
                  { kind: "computedEquals", id: "code", prop: "min-width", value: "0px" },
                  { kind: "computedMatches", id: "code", prop: "overflow-x", pattern: "^(?:hidden|auto|scroll)$" },
                ],
                message: "1fr のまま、列の最小の幅を 0 にしましょう（grid-template-columns: repeat(2, minmax(0, 1fr))。50% などの固定の幅や、コードの折り返しでそろえるのではなく）",
              },
            ],
          },
        ],
        hints: ["1fr は minmax(auto, 1fr) と同じです。列の最小の幅を 0 にします", ".docs { grid-template-columns: repeat(2, minmax(0, 1fr)); }"],
        solution: DOCS_CSS("repeat(2, minmax(0, 1fr))"),
      },
    },
  ],
};
