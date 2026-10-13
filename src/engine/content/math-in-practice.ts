import type { Edge, ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Math functions in practice are judged by what they produce at more than one
// size: the band's text is 480px wide and centred at 560px but keeps 16px of
// padding at 320px; the cards keep their 200px minimum where it fits (two
// columns at 560px, one at 360px) yet shrink to a 160px list; and the
// headings follow --ratio in two articles with different ratios (1.25 and
// 1.2), so writing the sizes out in px fails.

const between = (a: string, b: string, edgeA: Edge, edgeB: Edge, px: number): ValidatorSpec => ({
  kind: "offset",
  a,
  b,
  edgeA,
  edgeB,
  min: px - 0.5,
  max: px + 0.5,
});

const inset = (outer: string, inner: string, px: number): ValidatorSpec[] => [
  between(outer, inner, "left", "left", px),
  between(inner, outer, "right", "right", px),
];

const BAND_HTML =
  '<section data-id="band" class="band"><p data-id="text">春の講座の受付を始めました。定員になりしだい締め切りますので、お早めにお申し込みください。</p></section>';

const BAND_CSS = (padding: string): string =>
  `/* 帯の背景は端から端まで、文章は 480px の幅で真ん中に */\n.band {\n  padding-block: 12px;\n  padding-inline: ${padding};\n  background: #dbe4fb;\n}\n.band p {\n  margin: 0;\n}\n`;

const CARDS_HTML =
  '<div class="layout"><ul data-id="main" class="cards main"><li data-id="m1">春の講座</li><li data-id="m2">夏の講座</li></ul>' +
  '<ul data-id="side" class="cards side"><li data-id="s1">お知らせ</li><li data-id="s2">よくある質問</li></ul></div>';

const CARDS_CSS = (min: string): string =>
  `.layout {\n  display: flex;\n  flex-direction: column;\n  gap: 16px;\n}\n.cards {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(${min}, 1fr));\n  gap: 12px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n/* サイドバーの一覧は幅 160px */\n.side {\n  width: 160px;\n}\n.cards li {\n  padding: 10px 12px;\n  border-radius: 8px;\n  background: #dbe4fb;\n}\n`;

const DOCS_HTML = ["", " compact"]
  .map(
    (variant, i) =>
      `<article class="doc${variant}"><h1 data-id="h1-${i}">講座のご案内</h1><h2 data-id="h2-${i}">春の講座</h2><h3 data-id="h3-${i}">持ち物</h3></article>`,
  )
  .join("");

const DOCS_CSS = (h2: string, h1: string): string =>
  `.doc {\n  --ratio: 1.25;\n  margin-bottom: 12px;\n}\n/* 詰めた記事は、比を小さくする */\n.doc.compact {\n  --ratio: 1.2;\n}\n.doc h1,\n.doc h2,\n.doc h3 {\n  margin: 0;\n  line-height: 1.3;\n}\n/* 見出しは、本文（1rem）に --ratio を 1 回・2 回・3 回かけた大きさ */\n.doc h3 {\n  font-size: calc(1rem * var(--ratio));\n}\n.doc h2 {\n  font-size: ${h2};\n}\n.doc h1 {\n  font-size: ${h1};\n}\n`;

/** h3, h2 and h1 of one article: 16px times the ratio to the 1st, 2nd and 3rd power. */
const scale = (i: number, sizes: readonly [RegExp, RegExp, RegExp]): ValidatorSpec[] =>
  (["h3", "h2", "h1"] as const).map((h, n) => ({
    kind: "computedMatches",
    id: `${h}-${i}`,
    prop: "font-size",
    pattern: sizes[n]!.source,
  }));

export const mathInPracticeTrack: Track = {
  id: "math-in-practice",
  title: "数学関数の応用（max() の余白・minmax と min()・pow() の比）",
  summary: "max() で狭い画面でも余白を残し、minmax(min(200px, 100%), 1fr) で狭い箱からはみ出さないようにし、pow() で見出しの大きさを 1 つの比から決める。",
  emoji: "➗",
  lessons: [
    {
      id: "max-gutter",
      title: "最低限の余白を残す: max()",
      explanation:
        "<p>帯の背景を端から端まで敷き、文章だけを 480px の幅で真ん中に置くには、左右の padding を <code>(100% - 480px) / 2</code> にします（padding の % は親の幅が基準）。でも画面が 480px より狭いと、この計算は負の数になり、padding には負の値を使えないので、余白がなくなって文章が端にくっつきます。</p><p><code>max(16px, (100% - 480px) / 2)</code> と書くと、2 つのうち<b>大きいほう</b>が使われるので、狭い画面でも 16px より小さくなりません。max() は「最低でもこれだけ」を決める関数です。max() の中では calc() を書かずに計算できます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。プレビューは幅 560px で採点し、320px でも確かめます。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/max",
      viz: { concept: "none" },
      challenge: {
        viewport: 560,
        starterHTML: BAND_HTML,
        starterCSS: BAND_CSS("calc((100% - 480px) / 2)"),
        task: "幅 320px の画面で、帯の文章が左右の端にくっついています。広い画面では今のまま（480px の幅で真ん中）、狭い画面でも左右に 16px の余白が残るようにしよう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: inset("band", "text", 40),
            message: "幅 560px で、文章が 480px の幅で真ん中に来ていません（広い画面は今のままにします）",
          },
        ],
        states: [
          {
            viewport: 320,
            validators: [
              {
                kind: "allOf",
                of: inset("band", "text", 16),
                message: "幅 320px で、文章の左右に 16px の余白がありません（(100% - 480px) / 2 は狭い画面で負になり、padding には負の値を使えないので、余白がなくなります。max(16px, …) なら 16px より小さくなりません）",
              },
            ],
          },
        ],
        hints: ["2 つの値のうち大きいほうを使う関数があります", ".band { padding-inline: max(16px, (100% - 480px) / 2); }"],
        solution: BAND_CSS("max(16px, (100% - 480px) / 2)"),
      },
    },
    {
      id: "minmax-min",
      title: "狭い箱からはみ出さない: minmax(min(200px, 100%), 1fr)",
      explanation:
        "<p><code>repeat(auto-fill, minmax(200px, 1fr))</code> は、列の幅を<b>最低 200px</b> にします。この最低の幅は、一覧そのものが 200px より狭くても守られるので、幅 160px のサイドバーでは、カードが一覧からはみ出します。</p><p>最低の幅を <code>min(200px, 100%)</code> にすると、一覧が 200px 以上なら 200px、狭いときは<b>一覧の幅</b>になります。広い一覧の並び方（幅 560px で 2 列、360px で 1 列）は変わりません。最低の幅を 160px に下げると、360px の一覧が 2 列になってしまいます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。プレビューは幅 560px で採点し、360px でも確かめます。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/minmax",
      viz: { concept: "none" },
      challenge: {
        viewport: 560,
        starterHTML: CARDS_HTML,
        starterCSS: CARDS_CSS("200px"),
        task: "幅 160px のサイドバーの一覧で、カードが右にはみ出しています。カードが一覧に収まるようにしよう（広い一覧は今のまま、幅 560px で 2 列・360px で 1 列）。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "alignedEdge", ids: ["m1", "m2"], edge: "top", tol: 0.5 },
                  { kind: "order", ids: ["m1", "m2"], axis: "x" },
                ],
                message: "幅 560px で、広い一覧のカードが 2 列に並んでいません（広い一覧は今のままにします）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "insideContainer", id: "s1", containerId: "side" },
                  { kind: "sizeApprox", id: "s1", w: 160, tol: 0.5 },
                ],
                message: "サイドバーのカードが、幅 160px の一覧からはみ出しています（minmax の最小 200px は、一覧が狭くても守られます。最小を min(200px, 100%) にすると、狭いときは一覧の幅になります）",
              },
            ],
          },
        ],
        states: [
          {
            viewport: 360,
            validators: [
              {
                kind: "allOf",
                of: [
                  { kind: "order", ids: ["m1", "m2"], axis: "y" },
                  { kind: "alignedEdge", ids: ["main", "m1"], edge: "right", tol: 0.5 },
                ],
                message: "幅 360px で、広い一覧のカードが 1 列になっていません（最小の幅を 200px より小さくすると、列の数が変わります。min(200px, 100%) なら、広い一覧では 200px のままです）",
              },
            ],
          },
        ],
        hints: ["最小の幅を、200px と一覧の幅（100%）の小さいほうにします", "grid-template-columns: repeat(auto-fill, minmax(min(200px, 100%), 1fr));"],
        solution: CARDS_CSS("min(200px, 100%)"),
      },
    },
    {
      id: "pow-scale",
      title: "見出しの大きさを比で決める: pow()",
      explanation:
        "<p>見出しの大きさを、本文の大きさに<b>同じ比を何回かけたか</b>で決めると、段階がそろって見えます。<code>pow(1.25, 3)</code> は 1.25 の 3 乗（1.25 × 1.25 × 1.25）で、<code>calc(1rem * pow(var(--ratio), 3))</code> と書けば、本文 1rem（16px）に比を 3 回かけた大きさです。</p><p>比をカスタムプロパティ <code>--ratio</code> にしておけば、1 か所変えるだけで、すべての見出しが新しい比で並び直します。この記事は比 1.25、詰めた記事は比 1.2 です。px で大きさを書くと、比を変えても追いつきません。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/pow",
      viz: { concept: "none" },
      challenge: {
        starterHTML: DOCS_HTML,
        starterCSS: DOCS_CSS("24px", "32px"),
        task: "h3 は本文（1rem）に --ratio を 1 回かけた大きさです。h2 は 2 回、h1 は 3 回かけた大きさにしよう（比が 1.2 の詰めた記事でも、比に合わせて変わるように）。",
        snapshot: { props: ["font-size"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: scale(0, [/^20px$/, /^25px$/, /^31\.25px$/]),
                message: "比 1.25 の記事で、見出しが 20px・25px・31.25px（1.25 の 1 乗・2 乗・3 乗）になっていません",
              },
              {
                kind: "allOf",
                of: scale(1, [/^19\.2px$/, /^23\.04px$/, /^27\.64[78]px$/]),
                message: "比 1.2 の詰めた記事で、見出しが比に合わせて小さくなっていません（px で書くと比を変えても変わりません。calc(1rem * pow(var(--ratio), 2)) のように --ratio から計算します）",
              },
            ],
          },
        ],
        hints: ["pow(a, b) は a の b 乗です", ".doc h2 { font-size: calc(1rem * pow(var(--ratio), 2)); }（h1 は 3 乗）"],
        solution: DOCS_CSS("calc(1rem * pow(var(--ratio), 2))", "calc(1rem * pow(var(--ratio), 3))"),
      },
    },
  ],
};
