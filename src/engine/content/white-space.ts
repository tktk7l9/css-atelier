import type { ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// White space is judged by where text ends up. Spans around the second and
// third lines of the address show whether each starts on its own line (an
// inline box's rect starts at its leftmost fragment and its first line, so a
// span that merely wraps still reads as starting on the first line). The
// price is one 24px line when it does not wrap, and the tabbed line starts a
// little way in, not eight spaces in. Computed values make sure the lesson's
// property did the work (display: block on the spans would also break lines).

const ADDRESS_HTML =
  '<p data-id="address" class="address">〒150-0001\n<span data-id="l2">東京都渋谷区神宮前 1-2-3</span>\n<span data-id="l3">アトリエビル 4 階</span></p>';

const ADDRESS_CSS = (extra: string): string =>
  `.address {\n  width: 280px;\n  margin: 0;\n  padding: 0;\n  line-height: 24px;\n${extra}}\n`;

const ITEM_HTML =
  '<article data-id="row" class="row"><h3 data-id="name" class="name">手織りのリネン ストール（ネイビー）</h3><p data-id="price" class="price">¥12,800（税込）</p></article>';

const ITEM_CSS = (extra: string): string =>
  `.row {\n  display: flex;\n  gap: 12px;\n  align-items: flex-start;\n  width: 260px;\n  padding: 12px;\n  border-radius: 8px;\n  background: #eef1f8;\n}\n.name {\n  flex: 1;\n  margin: 0;\n  font-size: 16px;\n  line-height: 24px;\n}\n.price {\n  margin: 0;\n  line-height: 24px;\n  font-weight: 700;\n${extra}}\n`;

const CODE_HTML =
  '<pre data-id="code" class="code"><code>if (open) {\n\t<span data-id="body">showMenu();</span>\n}</code></pre>';

const CODE_CSS = (extra: string): string =>
  `.code {\n  margin: 0;\n  padding: 12px;\n  border-radius: 8px;\n  background: #18203a;\n  color: #e6ecff;\n  font: 14px/1.5 ui-monospace, Menlo, Consolas, monospace;\n${extra}}\n`;

/** The span starts its own line `line` (1-based) at the left edge of the address. */
const ownLine = (id: string, line: number): ValidatorSpec => ({
  kind: "allOf",
  of: [
    { kind: "offset", a: "address", b: id, edgeA: "left", edgeB: "left", min: -0.5, max: 0.5 },
    { kind: "offset", a: "address", b: id, edgeA: "top", edgeB: "top", min: (line - 1) * 24 - 0.5, max: (line - 1) * 24 + 0.5 },
  ],
});

export const whiteSpaceTrack: Track = {
  id: "white-space",
  title: "空白と改行（pre-line・nowrap・tab-size）",
  summary: "white-space: pre-line で HTML の改行を表示に残し、nowrap で値段を途中で折り返さず、tab-size でコードのタブの幅を詰める。",
  emoji: "↩️",
  lessons: [
    {
      id: "white-space-pre-line",
      title: "HTML の改行をそのまま: white-space: pre-line",
      explanation:
        "<p>ふつう（<code>white-space: normal</code>）は、HTML の中の改行も空白と同じに扱われ、続けて 1 行に並びます。住所やお知らせのように、<b>書いたとおりの改行で見せたい</b>文章には <code>white-space: pre-line</code> を指定します。</p><p><code>pre-line</code> は、改行は残し、続いた空白は 1 つにまとめ、枠の端では折り返します。空白もそのまま残したいなら <code>pre-wrap</code>、折り返しもしないなら <code>pre</code> です。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/white-space",
      viz: { concept: "none" },
      challenge: {
        starterHTML: ADDRESS_HTML,
        starterCSS: ADDRESS_CSS(""),
        task: "住所を HTML では 3 行に分けて書いたのに、続けて表示されています。HTML の改行のとおりに、3 行で表示しよう。",
        snapshot: { props: ["white-space"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [ownLine("l2", 2), ownLine("l3", 3)],
                message: "住所が、HTML の改行のとおり 3 行になっていません（ふつうは改行も空白と同じに扱われます。white-space: pre-line）",
              },
              {
                kind: "computedMatches",
                id: "address",
                prop: "white-space",
                pattern: "^pre",
                message: "行ごとに span を block にするのではなく、white-space で HTML の改行を残しましょう",
              },
            ],
          },
        ],
        hints: ["改行を残し、空白はまとめる white-space の値があります", ".address { white-space: pre-line; }"],
        solution: ADDRESS_CSS("  white-space: pre-line;\n"),
      },
    },
    {
      id: "white-space-nowrap",
      title: "値段を途中で折り返さない: white-space: nowrap",
      explanation:
        "<p>日本語の文章は、ほとんどの文字のあいだで折り返せます。flex で商品名と値段を横に並べると、値段の箱も縮められ、「¥12,800（税込）」が途中で 2 行に分かれてしまいます。</p><p>値段に <code>white-space: nowrap</code> を指定すると、<b>中で折り返さなくなり</b>、1 行の幅より縮まなくなります。そのぶん、残りの幅に収まるよう商品名のほうが折り返されます。ただし、長い文章に使うと枠からはみ出すので、短いまとまりにだけ使います。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/white-space",
      viz: { concept: "none" },
      challenge: {
        starterHTML: ITEM_HTML,
        starterCSS: ITEM_CSS(""),
        task: "値段「¥12,800（税込）」が途中で 2 行に分かれています。値段は 1 行のまま、商品名のほうを折り返そう（値段は枠からはみ出さない）。",
        snapshot: { props: ["white-space"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "sizeApprox",
                id: "price",
                h: 24,
                tol: 0.5,
                message: "値段が 1 行になっていません（日本語はどこでも折り返せます。値段に white-space: nowrap）",
              },
              {
                kind: "offset",
                a: "price",
                b: "row",
                edgeA: "right",
                edgeB: "right",
                min: 11.5,
                message: "値段が枠からはみ出しています（商品名を flex: 1 のまま縮めて、折り返させます）",
              },
            ],
          },
        ],
        hints: ["折り返しを止める white-space の値を、値段だけに付けます", ".price { white-space: nowrap; }"],
        solution: ITEM_CSS("  white-space: nowrap;\n"),
      },
    },
    {
      id: "tab-size",
      title: "コードのタブの幅を詰める: tab-size",
      explanation:
        "<p><code>pre</code> 要素の中ではタブ文字がそのまま表示され、その幅は初期値で<b>半角スペース 8 つ分</b>（<code>tab-size: 8</code>）です。字下げの深いコードは、すぐ右にはみ出してしまいます。</p><p><code>tab-size: 2</code> にすると、タブの幅がスペース 2 つ分になります（px などの長さでも書けます）。HTML のタブはそのままで、見た目の字下げだけが変わります。<code>tab-size</code> は受け継がれます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/tab-size",
      viz: { concept: "none" },
      challenge: {
        starterHTML: CODE_HTML,
        starterCSS: CODE_CSS(""),
        task: "コードの 2 行目の字下げ（タブ）が、スペース 8 つ分と広すぎます。タブの幅をスペース 2 つ分にしよう。",
        snapshot: { props: ["tab-size"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "offset",
                a: "code",
                b: "body",
                edgeA: "left",
                edgeB: "left",
                min: 20,
                max: 40,
                message: "2 行目の字下げが、スペース 2 つ分ほどになっていません（タブの幅は初期値で 8 つ分です。tab-size: 2）",
              },
              {
                kind: "computedEquals",
                id: "code",
                prop: "tab-size",
                value: "2",
                message: "字下げの幅は、tab-size: 2 で決めましょう（HTML のタブはそのままです）",
              },
            ],
          },
        ],
        hints: ["タブの幅を、スペースの数で指定するプロパティがあります", ".code { tab-size: 2; }"],
        solution: CODE_CSS("  tab-size: 2;\n"),
      },
    },
  ],
};
