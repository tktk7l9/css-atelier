import type { ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Flex sizing is judged at two widths where it matters. The 2:1 columns and
// the growing cards fix the preview at 560px and check it again at 320px, so
// widths hard-coded for one of them fail at the other: with flex: 2 and
// flex: 1 the main column is exactly twice the sidebar at both, and cards
// based on 140px make three per row at 560px and two at 320px, each row
// filled to the edge (the last row's cards stretch, unlike grid columns).
// The reordered row is judged by x order; the last steps read flex-grow and
// order so that percentages or a reversed row fail with a reason.

const LAYOUT_HTML =
  '<div data-id="layout" class="layout"><main data-id="main" class="main">本文</main><aside data-id="side" class="side">サイド</aside></div>';

const LAYOUT_CSS = (extra: string): string =>
  `.layout {\n  display: flex;\n  gap: 12px;\n}\n.main,\n.side {\n  flex: 1;\n  padding: 12px;\n  border-radius: 8px;\n  background: #dbe4fb;\n}\n.side {\n  background: #eef1f8;\n}\n${extra}`;

const CARDS_HTML =
  '<div data-id="cards" class="cards">' +
  ["朝", "昼", "夕", "夜", "深夜"].map((t, i) => `<div data-id="c${i + 1}" class="card">${t}</div>`).join("") +
  "</div>";

const CARDS_CSS = (size: string): string =>
  `.cards {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n}\n.card {\n${size}  padding: 12px;\n  border-radius: 8px;\n  background: #dbe4fb;\n}\n`;

const ROW_HTML =
  '<div data-id="row" class="row"><div data-id="a" class="item">新着 1</div><div data-id="b" class="item">新着 2</div><div data-id="hot" class="item hot">いち押し</div></div>';

const ROW_CSS = (extra: string): string =>
  `.row {\n  display: flex;\n  gap: 8px;\n}\n.item {\n  padding: 12px 16px;\n  border-radius: 8px;\n  background: #dbe4fb;\n}\n.hot {\n  background: #fff3c4;\n${extra}}\n`;

/** Main is twice the sidebar and the two fill the row. */
const twoToOne: ValidatorSpec = {
  kind: "allOf",
  of: [
    { kind: "relativeSize", a: "main", b: "side", ratio: 2, dim: "w", tol: 1 },
    { kind: "offset", a: "side", b: "layout", edgeA: "right", edgeB: "right", min: -1, max: 1 },
  ],
};

const endsAtRight = (id: string): ValidatorSpec => ({ kind: "offset", a: id, b: "cards", edgeA: "right", edgeB: "right", min: -1, max: 1 });

export const flexSizingTrack: Track = {
  id: "flex-sizing",
  title: "flex の伸び方と順番（flex の比・flex-basis・order）",
  summary: "flex の数で幅を 2:1 に分け、flex-basis を基準に折り返して行を埋め、order で見た目の順番だけを入れ替える。",
  emoji: "🎚️",
  lessons: [
    {
      id: "flex-ratio",
      title: "幅を 2:1 に分ける: flex: 2 と flex: 1",
      explanation:
        "<p><code>flex-grow</code> は、余ったスペースを<b>アイテムどうしの比</b>で分けます。<code>flex: 2</code> と <code>flex: 1</code> なら、2:1 の割合です。</p><p>一括指定の <code>flex: 2</code> は <code>flex: 2 1 0%</code> と同じで、<b>基準の幅（flex-basis）が 0</b> になります。全員の基準が 0 なので、行の幅（gap を除く）がそのまま 2:1 に分かれ、本文はサイドの<b>ちょうど 2 倍</b>になります。<code>flex-grow: 2</code> だけを書くと、基準の幅は中身の幅のまま（<code>auto</code>）で、<b>余り</b>だけが 2:1 に分かれるので、ちょうど 2 倍にはなりません。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。プレビューは幅 560px で採点し、320px でも確かめます。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/flex-grow",
      viz: { concept: "none" },
      challenge: {
        viewport: 560,
        starterHTML: LAYOUT_HTML,
        starterCSS: LAYOUT_CSS(""),
        task: "本文（.main）とサイド（.side）が同じ幅です。本文の幅を、サイドのちょうど 2 倍にしよう（幅 560px でも 320px でも 2:1）。",
        snapshot: { props: ["flex-grow"] },
        validators: [
          {
            kind: "allOf",
            of: [
              { ...twoToOne, message: "本文の幅が、サイドのちょうど 2 倍になっていません（flex: 2 と flex: 1 で 2:1 に分けます）" },
              {
                kind: "computedMatches",
                id: "main",
                prop: "flex-grow",
                pattern: "^(?!0$)",
                message: "幅を % や px で決めるのではなく、flex の数（flex-grow）の比で分けましょう",
              },
            ],
          },
        ],
        states: [
          {
            viewport: 320,
            validators: [{ ...twoToOne, message: "幅 320px で、本文の幅がサイドの 2 倍になっていません（幅を決め打ちすると、画面の幅が変わったときに崩れます）" }],
          },
        ],
        hints: ["本文に、サイド（flex: 1）の 2 倍の flex を指定します", ".main { flex: 2; }"],
        solution: LAYOUT_CSS(".main {\n  flex: 2;\n}\n"),
      },
    },
    {
      id: "flex-basis-wrap",
      title: "基準の幅で折り返して埋める: flex: 1 1 140px",
      explanation:
        "<p><code>flex-basis</code> は、伸び縮みする前の<b>基準の大きさ</b>です。<code>flex: 1 1 140px</code>（伸びる・縮む・基準 140px）を <code>flex-wrap: wrap</code> の中のアイテムに指定すると、1 行に<b>140px が入るだけ</b>並び、入りきらないものは折り返し、<b>各行の余りはその行のアイテムで分け合います</b>。メディアクエリなしで、幅に合わせて 1 行の数が変わります。</p><p>グリッドの <code>repeat(auto-fill, minmax(140px, 1fr))</code> と違い、行ごとに伸びるので、最後の行のアイテムは前の行より広くなります（列はそろいません）。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。プレビューは幅 560px で採点し、320px でも確かめます。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/flex-basis",
      viz: { concept: "none" },
      challenge: {
        viewport: 560,
        starterHTML: CARDS_HTML,
        starterCSS: CARDS_CSS("  width: 140px;\n"),
        task: "幅 140px のカードの右に、余りが空いています。カードの基準の幅を 140px にしたまま、各行の余りをカード同士で分け合って、行を端まで埋めよう（幅 560px で 1 行に 3 枚、320px で 2 枚）。",
        snapshot: { props: ["flex-grow"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "alignedEdge", ids: ["c1", "c2", "c3"], edge: "top" },
                  { kind: "order", ids: ["c1", "c4"], axis: "y" },
                  endsAtRight("c3"),
                  endsAtRight("c5"),
                ],
                message: "幅 560px で、各行がカードで端まで埋まっていません（1 行に 3 枚、最後の行は 2 枚が伸びて埋めます）",
              },
              {
                kind: "computedMatches",
                id: "c1",
                prop: "flex-grow",
                pattern: "^(?!0$)",
                message: "カードが伸びるように flex-grow を指定しましょう（flex: 1 1 140px）",
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
                  { kind: "alignedEdge", ids: ["c1", "c2"], edge: "top" },
                  { kind: "order", ids: ["c1", "c3"], axis: "y" },
                  endsAtRight("c2"),
                ],
                message: "幅 320px で、1 行に 2 枚並んで端まで埋まっていません（基準の幅は 140px のまま）",
              },
            ],
          },
        ],
        hints: ["flex の一括指定で「伸びる・縮む・基準の幅」をまとめて書きます", ".card { flex: 1 1 140px; }"],
        solution: CARDS_CSS("  flex: 1 1 140px;\n"),
      },
    },
    {
      id: "flex-order",
      title: "見た目の順番だけ入れ替える: order",
      explanation:
        "<p><code>order</code> は、flex（とグリッド）のアイテムの<b>表示される順番</b>を変えます。既定はすべて <code>0</code> で、小さい順に並び、同じ値なら HTML の順です。<code>order: -1</code> にしたアイテムは、ほかより前に出ます。</p><p>ただし、変わるのは<b>見た目だけ</b>です。読み上げソフトや Tab キーでの移動は HTML の順のままなので、見た目と操作の順番がずれると、使いにくくなります（MDN も注意を呼びかけています）。意味のある順番なら HTML 自体を並べ替え、<code>order</code> は画面の幅に応じた小さな配置の調整などにとどめましょう。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/order",
      viz: { concept: "none" },
      challenge: {
        starterHTML: ROW_HTML,
        starterCSS: ROW_CSS(""),
        task: "HTML では最後にある「いち押し」（.hot）を、ほかの 2 つの前（左端）に表示しよう。ほかの 2 つの順番はそのままにします。",
        snapshot: { props: ["order"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "order",
                ids: ["hot", "a", "b"],
                axis: "x",
                message: "「いち押し」が左端に来ていないか、ほかの 2 つの順番が変わっています（row-reverse では全体が逆になります）",
              },
              {
                kind: "anyOf",
                of: [
                  { kind: "computedMatches", id: "hot", prop: "order", pattern: "^-" },
                  { kind: "computedMatches", id: "a", prop: "order", pattern: "^[1-9]" },
                ],
                message: "order で表示の順番を変えましょう（いち押しを -1 にするなど）",
              },
            ],
          },
        ],
        hints: ["既定の order は 0 です。いち押しだけ小さい値にします", ".hot { order: -1; }"],
        solution: ROW_CSS("  order: -1;\n"),
      },
    },
  ],
};
