import type { ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Units are judged by what they compute to. The card row is fluid, so three
// cards must fill it exactly whatever the preview width; the nested list
// reads each level's computed font-size; the main area is measured against
// the preview's fixed 280px height (the iframe's viewport, so 100dvh = 280px).
// A hard-coded px value that happens to match passes the geometry and then
// fails the last step, which looks for the unit the lesson teaches.

const MONTHS = ["1 月", "2 月", "3 月", "4 月", "5 月", "6 月"];

const CARDS_HTML =
  '<div data-id="cards" class="cards">' + MONTHS.map((m, i) => `<div data-id="c${i + 1}" class="card">${m}</div>`).join("") + "</div>";

const CARDS_CSS = (width: string): string =>
  `.cards {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n}\n.card {\n  width: ${width};\n  padding: 12px;\n  border-radius: 8px;\n  background: #dbe4fb;\n  font-size: 14px;\n}\n`;

const TREE_HTML =
  '<ul class="tree"><li data-id="i1">資料<ul><li data-id="i2">2026 年<ul><li data-id="i3">10 月の議事録</li></ul></li></ul></li></ul>';

const TREE_CSS = (size: string): string =>
  `.tree,\n.tree ul {\n  margin: 0;\n  padding-left: 16px;\n}\n.tree li {\n  font-size: ${size};\n  line-height: 1.6;\n}\n`;

const SHELL_HTML = '<header data-id="head" class="head">アプリ</header><main data-id="main" class="main">メイン</main>';

const SHELL_CSS = (extra: string): string =>
  `.head {\n  height: 56px;\n  padding: 16px;\n  background: #18203a;\n  color: #fff;\n}\n.main {\n  height: 100%;\n  padding: 16px;\n  background: #eef1f8;\n${extra}}\n`;

const fontSize = (id: string): ValidatorSpec => ({ kind: "computedEquals", id, prop: "font-size", value: "14px" });

export const relativeUnitsTrack: Track = {
  id: "relative-units",
  title: "単位の使い分け（calc()・rem・dvh）",
  summary: "calc() で単位を混ぜて計算し、rem で入れ子でも変わらない大きさに、dvh で画面の高さに合わせる。",
  emoji: "⚖️",
  lessons: [
    {
      id: "calc-columns",
      title: "gap を引いて 3 等分: calc()",
      explanation:
        "<p><code>calc()</code> は、CSS の値を<b>計算で</b>決める関数です。<code>calc(100% - 24px)</code> のように <b>% と px のような違う単位を混ぜられる</b>のがいちばんの特徴で、「親の幅から固定の余白を引いた残り」をそのまま書けます。<code>+</code> と <code>-</code> の前後には空白が必要です（<code>*</code> と <code>/</code> は空白なしでも書けます）。</p><p>3 列のつもりで <code>width: 33.333%</code> にすると、<code>gap</code> の 12px × 2 のぶん行からあふれて 2 列になります。<code>calc((100% - 24px) / 3)</code> なら、先に gap を引いてから 3 等分するので、親の幅が変わってもぴったり 3 枚並びます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/calc",
      viz: { concept: "none" },
      challenge: {
        starterHTML: CARDS_HTML,
        starterCSS: CARDS_CSS("33.333%"),
        task: "3 列のつもりで width: 33.333% にしたのに、gap（12px × 2）のぶん入りきらず 2 列になっています。gap を引いた幅を 3 等分して、1 行に 3 枚並べよう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "alignedEdge", ids: ["c1", "c2", "c3"], edge: "top" },
                  { kind: "order", ids: ["c1", "c2", "c3"], axis: "x" },
                  { kind: "order", ids: ["c1", "c4"], axis: "y" },
                  { kind: "alignedEdge", ids: ["c1", "c4"], edge: "left" },
                ],
                message: "1 行に 3 枚並んでいません（4 枚目が 2 行目の先頭に来るはずです）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "offset", a: "c3", b: "cards", edgeA: "right", edgeB: "right", min: -1, max: 1 },
                  { kind: "relativeSize", a: "c1", b: "c3", ratio: 1, dim: "w", tol: 1 },
                ],
                message: "3 枚で行の幅ぴったりになっていません（gap の 24px を引いてから 3 で割ります）",
              },
              {
                // The width, or the flex basis that stands for it, is calculated.
                kind: "sourceMatches",
                pattern: "(?:width|flex-basis|flex)\\s*:[^;}]*calc\\(",
                message: "ほかの方法でも 3 列にできますが、ここでは .card の幅を calc((100% - 24px) / 3) で計算しましょう（gap を引いて 3 等分するので、幅が変わってもぴったり収まります）",
              },
            ],
          },
        ],
        hints: ["全体（100%）から gap 2 つぶん（24px）を引いて、3 で割ります", ".card { width: calc((100% - 24px) / 3); }"],
        solution: CARDS_CSS("calc((100% - 24px) / 3)"),
      },
    },
    {
      id: "rem-nested",
      title: "入れ子でも同じ大きさ: rem",
      explanation:
        "<p><code>em</code> は<b>その要素の文字の大きさ</b>が基準で、<code>font-size</code> に使うと<b>親の文字の大きさ</b>が基準になります。<code>li { font-size: 0.875em; }</code> を入れ子のリストに書くと、階層ごとに 0.875 倍が掛け算され、深いほど小さくなります（14px → 12.25px → 約 10.7px）。</p><p><code>rem</code> は<b>ルート要素（html）の文字の大きさ</b>が基準なので、どこに書いても同じ値になります（ブラウザの既定はふつう 16px なので、<code>0.875rem</code> は 14px）。<code>px</code> で固定するのと違い、利用者がブラウザの設定で文字を大きくすると、それに合わせて大きくなります。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/length",
      viz: { concept: "none" },
      challenge: {
        starterHTML: TREE_HTML,
        starterCSS: TREE_CSS("0.875em"),
        task: "入れ子のリストで、深い階層ほど文字が小さくなっています（0.875em が親の大きさに掛け算されるため）。どの階層の項目も 14px にそろえよう。",
        snapshot: { props: ["font-size"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [fontSize("i1"), fontSize("i2"), fontSize("i3")],
                message: "入れ子の項目の文字が 14px にそろっていません（em は親の文字の大きさが基準なので、階層ごとに 0.875 倍されます）",
              },
              {
                kind: "sourceMatches",
                pattern: "font-size\\s*:\\s*[\\d.]+rem",
                message: "14px と固定してもそろいますが、rem にしましょう（利用者がブラウザで文字を大きくすると、それに合わせて大きくなります）",
              },
            ],
          },
        ],
        hints: ["親ではなく、ルート要素（html）の文字の大きさを基準にする単位を使います", ".tree li { font-size: 0.875rem; }"],
        solution: TREE_CSS("0.875rem"),
      },
    },
    {
      id: "dvh-height",
      title: "画面の残りの高さ: calc(100dvh - 56px)",
      explanation:
        "<p><code>height: 100%</code> は<b>親の高さ</b>の 100% なので、親の高さが中身で決まる（<code>auto</code>）ときは効きません。画面いっぱいの高さにしたいときは、<b>ビューポート（画面）の高さ</b>を基準にする単位を使います。</p><p><code>1vh</code> は画面の高さの 1% です。スマートフォンではアドレスバーが出たり引っ込んだりして画面の高さが変わるため、<code>vh</code> は「バーが引っ込んだときの高さ（lvh）」になり、下が隠れることがあります。<code>dvh</code> は<b>そのときの実際の高さ</b>に合わせて変わります（<code>svh</code> はバーが出ているときの高さ）。<code>calc(100dvh - 56px)</code> と書けば、ヘッダーを除いた残りの高さになります。</p><p><code>dvh</code> は Chrome 108・Firefox 101・Safari 15.4 から使え、Baseline: 広く利用可能です（2025 年 6 月から）。プレビューの高さは 280px なので、<code>100dvh</code> は 280px です。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/length",
      viz: { concept: "none" },
      challenge: {
        starterHTML: SHELL_HTML,
        starterCSS: SHELL_CSS(""),
        task: "メインの領域を、ヘッダー（56px）を除いた画面の残りの高さいっぱいに広げよう（プレビューの高さは 280px なので 224px）。いまの height: 100% は、親の高さが決まっていないので効いていません。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "sizeApprox",
                id: "main",
                h: 224,
                tol: 1,
                message: "メインの高さが、画面の残り（280px − 56px ＝ 224px）になっていません",
              },
              {
                kind: "sourceMatches",
                pattern: "\\d(?:s|l|d)?vh\\b",
                message: "224px と固定すると、画面の高さが変わったときに合いません。100dvh（画面の高さ）から 56px を引きましょう",
              },
            ],
          },
        ],
        hints: ["画面の高さを表す 100dvh から、ヘッダーの 56px を calc() で引きます", ".main { min-height: calc(100dvh - 56px); }"],
        solution: SHELL_CSS("  min-height: calc(100dvh - 56px);\n"),
      },
    },
  ],
};
