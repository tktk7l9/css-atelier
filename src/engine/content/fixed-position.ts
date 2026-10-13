import type { Edge, ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Fixed positioning is judged against the 280px preview: the buy bar must run
// from the left to the right edge of the page and end at the bottom of the
// screen (280px below the page's top), which a bar positioned inside its card
// (absolute against the card, or fixed but trapped by the card's will-change)
// does not do. The pages are shorter than the preview, so nothing scrolls and
// the page's top stays at the top of the screen. The header lesson measures
// where the heading starts below the fixed header.

const between = (a: string, b: string, edgeA: Edge, edgeB: Edge, min: number, max: number): ValidatorSpec => ({
  kind: "offset",
  a,
  b,
  edgeA,
  edgeB,
  min,
  max,
});

const SCREEN_HEIGHT = 280;

const SHOP_HTML =
  '<div data-id="page" class="page"><article class="card"><h3 class="title">春のコート</h3><p class="price">¥12,800</p>' +
  '<div data-id="bar" class="bar"><button class="buy" type="button">カートに入れる</button></div></article></div>';

const SHOP_CSS = (card: string, bar: string): string =>
  `.page {\n  padding: 16px;\n}\n.card {\n  position: relative;\n  width: 220px;\n  padding: 12px;\n  border-radius: 12px;\n  background: #eef1f8;\n${card}}\n.title {\n  margin: 0;\n  font-size: 18px;\n}\n.price {\n  margin: 4px 0 12px;\n}\n/* 画面の下に固定したい購入バー */\n.bar {\n${bar}  padding: 8px 12px;\n  border-top: 1px solid #d6dded;\n  background: #fff;\n}\n.buy {\n  width: 100%;\n  padding: 8px;\n  border: 0;\n  border-radius: 6px;\n  background: #2f5fd0;\n  color: #fff;\n  font: inherit;\n}\n`;

const FIXED_BAR = "  position: fixed;\n  inset: auto 0 0;\n";

/** The bar spans the page and ends at the bottom of the screen. */
const barOnScreen = (message: string): ValidatorSpec => ({
  kind: "allOf",
  of: [
    { kind: "alignedEdge", ids: ["page", "bar"], edge: "left", tol: 0.5 },
    { kind: "alignedEdge", ids: ["page", "bar"], edge: "right", tol: 0.5 },
    between("page", "bar", "top", "bottom", SCREEN_HEIGHT - 0.5, SCREEN_HEIGHT + 0.5),
  ],
  message,
});

const HEADER_HTML =
  '<header data-id="head" class="head">講座のご案内</header>' +
  '<main class="main"><h2 data-id="title">春の講座</h2><p>受付を始めました。定員になりしだい締め切ります。</p></main>';

const HEADER_CSS = (extra: string): string =>
  `/* 画面の上に固定したヘッダー（高さ 48px） */\n.head {\n  position: fixed;\n  inset: 0 0 auto;\n  height: 48px;\n  padding: 12px 16px;\n  background: #2f5fd0;\n  color: #fff;\n}\n.main {\n  padding: 0 16px;\n${extra}}\n.main h2 {\n  margin: 0 0 8px;\n}\n.main p {\n  margin: 0;\n}\n`;

export const fixedPositionTrack: Track = {
  id: "fixed-position",
  title: "画面に固定する（fixed・will-change の落とし穴・固定ヘッダーの下）",
  summary: "position: fixed で購入バーを画面の下端に固定し、will-change: transform の祖先に閉じ込められたバーを外に出し、固定ヘッダーの下から本文を始める。",
  emoji: "🧷",
  lessons: [
    {
      id: "fixed-bar",
      title: "画面の下に固定する: position: fixed",
      explanation:
        "<p><code>position: fixed</code> の要素は、ふつうの流れから外れ、<b>画面（ビューポート）</b>を基準に置かれます。<code>inset: auto 0 0</code>（下 0・左右 0）にすると、画面の下端に、左右いっぱいの幅で固定され、ページをスクロールしても動きません。</p><p><code>position: absolute</code> は、<code>position</code> を指定したいちばん近い祖先が基準なので、<code>position: relative</code> のカードの中では、カードの下に付くだけです。プレビューの高さは 280px です。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/position",
      viz: { concept: "none" },
      challenge: {
        starterHTML: SHOP_HTML,
        starterCSS: SHOP_CSS("", ""),
        task: "カードの中の購入バーを、画面の下端に、左右いっぱいの幅で固定しよう。",
        snapshot: { props: [] },
        validators: [
          barOnScreen(
            "購入バーが、画面の下端に左右いっぱいの幅で固定されていません（position: fixed で画面を基準にし、inset: auto 0 0 で下端と左右に付けます。absolute だと、position: relative の .card が基準になります）",
          ),
        ],
        hints: ["画面を基準に置く position の値があります", ".bar { position: fixed; inset: auto 0 0; }"],
        solution: SHOP_CSS("", FIXED_BAR),
      },
    },
    {
      id: "fixed-will-change",
      title: "fixed が箱に閉じ込められる: will-change と transform",
      explanation:
        "<p><code>position: fixed</code> の基準は、ふつうは画面ですが、祖先に <code>transform</code>・<code>filter</code>・<code>perspective</code> などが <code>none</code> 以外で付いていると、<b>その祖先が基準の箱</b>になります。<code>will-change: transform</code> も同じで、アニメーションのために付けたまま残っていると、中の fixed の要素がカードの中に閉じ込められます。</p><p><code>will-change</code> は、困っている表示の重さを直すための最後の手段で、前もって付けておくものではありません。使っていない <code>will-change</code> は外します。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Guides/Display/Containing_block",
      viz: { concept: "none" },
      challenge: {
        starterHTML: SHOP_HTML,
        starterCSS: SHOP_CSS("  /* 以前のアニメーションのなごり */\n  will-change: transform;\n", FIXED_BAR),
        task: "購入バーは position: fixed なのに、画面の下端ではなく、カードの下に付いています。バーを画面の下端に左右いっぱいの幅で固定しよう（カードのアニメーションは、もう使っていません）。",
        snapshot: { props: ["position"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "computedEquals",
                id: "bar",
                prop: "position",
                value: "fixed",
                message: "購入バーは position: fixed のままにしましょう",
              },
              barOnScreen(
                "購入バーが、カードの中に閉じ込められています（transform や filter、will-change: transform を持つ祖先は、fixed の要素の基準の箱になります。使っていない will-change は外します）",
              ),
            ],
          },
        ],
        hints: ["fixed の基準の箱を作ってしまう指定が、カードに残っています", ".card の will-change: transform を消します"],
        solution: SHOP_CSS("", FIXED_BAR),
      },
    },
    {
      id: "fixed-header-offset",
      title: "固定ヘッダーの下から本文を始める: padding-top",
      explanation:
        "<p><code>position: fixed</code> の要素は、ふつうの流れから外れ、<b>ページの中に場所を取りません</b>。画面の上に固定したヘッダーがあっても、本文はページのいちばん上から始まるので、見出しがヘッダーの下に隠れます。</p><p>本文の上に、ヘッダーと同じ高さ（48px）の余白を空けておけば、見出しはヘッダーのすぐ下から始まります。ヘッダーの高さを変えたら、余白も合わせて変えます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/position",
      viz: { concept: "none" },
      challenge: {
        starterHTML: HEADER_HTML,
        starterCSS: HEADER_CSS(""),
        task: "見出し「春の講座」が、画面の上に固定したヘッダーの下に隠れています。ヘッダーは固定したまま、見出しがヘッダーのすぐ下から始まるようにしよう。",
        snapshot: { props: ["position"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "computedEquals",
                id: "head",
                prop: "position",
                value: "fixed",
                message: "ヘッダーは position: fixed のままにしましょう",
              },
              {
                ...between("head", "title", "bottom", "top", -0.5, 16.5),
                message: "見出しが、ヘッダーのすぐ下から始まっていません（fixed のヘッダーはページの中に場所を取らないので、本文の上に、ヘッダーの高さと同じ 48px の余白を空けます）",
              },
            ],
          },
        ],
        hints: ["本文の上に、ヘッダーの高さと同じ余白を空けます", ".main { padding-top: 48px; }"],
        solution: HEADER_CSS("  padding-top: 48px;\n"),
      },
    },
  ],
};
