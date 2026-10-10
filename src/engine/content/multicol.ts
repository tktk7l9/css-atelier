import type { ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Column boxes are anonymous, so the columns are judged through the blocks in
// them: in two columns the fourth of six one-line notices sits beside the
// first, a spanning heading is as wide as the container, and a card broken
// across the column boundary reports a bounding box that covers both columns.
// The container is 280px wide, so the column widths are the same on any
// machine and in a narrow preview. The cards must not be scroll containers
// (overflow other than visible): those are monolithic and never break, which
// would hide the problem the break-inside lesson is about.

const NOTICES = ["春の新作が入荷", "営業時間の変更", "臨時休業の案内", "スタッフ募集", "会員デーの案内", "夏の催しもの"];

const notices = (): string =>
  NOTICES.map((text, i) => `<p data-id="n${i + 1}" class="item">${text}</p>`).join("");

const ITEM_CSS =
  ".item {\n  margin: 0 0 8px;\n  padding: 0 8px;\n  font-size: 14px;\n  line-height: 24px;\n  background: #eef1f8;\n}\n";

const LIST_HTML = `<div data-id="news" class="news">${notices()}</div>`;

const LIST_CSS = (extra: string): string =>
  `.news {\n  width: 280px;\n  padding: 8px 0 0;\n  border: 1px solid #dbe4fb;\n  border-radius: 8px;\n${extra}}\n${ITEM_CSS}`;

const HEADED_HTML = `<div data-id="news" class="news"><h3 data-id="head" class="head">今週のお知らせ一覧</h3>${notices()}</div>`;

const HEADED_CSS = (extra: string): string =>
  `.news {\n  width: 280px;\n  padding: 8px 0 0;\n  columns: 2;\n  column-gap: 24px;\n  border: 1px solid #dbe4fb;\n  border-radius: 8px;\n}\n.head {\n  margin: 0 0 8px;\n  padding: 0 8px;\n  font-size: 16px;\n  line-height: 28px;\n  border-bottom: 2px solid #2f5fd0;\n${extra}}\n${ITEM_CSS}`;

const CARDS: ReadonlyArray<readonly [id: string, size: "tall" | "short", title: string, text: string]> = [
  ["c1", "tall", "店内イベント", "土曜はワークショップを開きます。"],
  ["c2", "short", "新商品のご案内", ""],
  ["c3", "tall", "営業時間の変更", "6 月から 19 時までの営業です。"],
  ["c4", "short", "スタッフ募集", ""],
  ["c5", "tall", "夏の催しもの", "7 月は限定メニューを用意します。"],
];

const CARDS_HTML =
  '<div data-id="wrap" class="wrap">' +
  CARDS.map(
    ([id, size, title, text]) =>
      `<article data-id="${id}" class="card ${size}"><h4>${title}</h4>${text ? `<p>${text}</p>` : ""}</article>`,
  ).join("") +
  "</div>";

const CARDS_CSS = (extra: string): string =>
  `.wrap {\n  width: 280px;\n  columns: 2;\n  column-gap: 24px;\n}\n.card {\n  margin: 0 0 8px;\n  padding: 8px;\n  border-radius: 6px;\n  background: #eef1f8;\n${extra}}\n.card h4 {\n  margin: 0;\n  font-size: 14px;\n  line-height: 20px;\n}\n.card p {\n  margin: 4px 0 0;\n  font-size: 12px;\n  line-height: 18px;\n}\n.tall {\n  height: 72px;\n}\n.short {\n  height: 48px;\n}\n`;

/** Each card keeps its own height and the column width: a card broken across
 *  the columns would report the width of both columns and the column height. */
const cardsIntact: ValidatorSpec = {
  kind: "allOf",
  of: CARDS.map(([id, size]): ValidatorSpec => ({ kind: "sizeApprox", id, w: 128, h: size === "tall" ? 72 : 48 })),
  message: "カードが段の境目で上下に分かれています（1 枚のカードが、1 段目の下と 2 段目の上にまたがっています）",
};

export const multicolTrack: Track = {
  id: "multicol",
  title: "段組み（multi-column）",
  summary: "columns で中身を段に流し、column-gap・column-span・break-inside で段の間隔・またぎ・途切れを整える。",
  emoji: "🗞️",
  lessons: [
    {
      id: "multicol-columns",
      title: "段組みにする: columns",
      explanation:
        "<p>新聞のように、長い中身を<b>いくつかの段に流し込む</b>のが段組み（multi-column layout）です。<code>columns: 2</code> と書くと、中身は 1 段目の上から下へ流れ、収まらないぶんが 2 段目へ続きます。grid や flex で 2 列に並べるのと違い、段の高さは<b>中身の量から自動で</b>決まり、段の高さがそろいます。</p><p><code>columns</code> は <code>column-count</code>（段の数）と <code>column-width</code>（段の最小の幅）をまとめた略記です。段の間隔は <code>column-gap</code> で、指定しないと <code>normal</code>（1em）です。段の間に線を引く <code>column-rule</code> は <code>border</code> と同じ書き方です。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能。接頭辞なしは Chrome 50・Firefox 52・Safari 9 から）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/columns",
      viz: { concept: "none" },
      challenge: {
        starterHTML: LIST_HTML,
        starterCSS: LIST_CSS(""),
        task: "6 件のお知らせが 1 列に長く並んでいます。お知らせの箱（.news）を 2 段の段組みにして、段の間を 24px 空けよう。",
        snapshot: { props: ["column-count", "column-width"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "alignedEdge", ids: ["n1", "n4"], edge: "top" },
                  { kind: "order", ids: ["n1", "n4"], axis: "x" },
                  { kind: "alignedEdge", ids: ["n1", "n2", "n3"], edge: "left" },
                  { kind: "alignedEdge", ids: ["n4", "n5", "n6"], edge: "left" },
                ],
                message: "お知らせが 2 段に分かれていません（4 件目が、1 件目の横＝2 段目の先頭に来ていません）",
              },
              {
                kind: "offset",
                a: "n1",
                b: "n4",
                edgeA: "right",
                edgeB: "left",
                min: 22,
                max: 26,
                message: "段と段の間が 24px 空いていません（column-gap で指定します。指定しないと 1em です）",
              },
              {
                // A column count, or a column width the two columns come out of.
                kind: "anyOf",
                of: [
                  { kind: "computedEquals", id: "news", prop: "column-count", value: "2" },
                  { kind: "computedMatches", id: "news", prop: "column-width", pattern: "px" },
                ],
                message: "columns: 2（または column-count: 2）で段組みにしましょう（flex や grid で 2 列に並べると、段の高さが中身の量に合わせて決まりません）",
              },
            ],
          },
        ],
        hints: ["段組みは、段を作りたい親（.news）に指定します", ".news { columns: 2; column-gap: 24px; }"],
        solution: LIST_CSS("  columns: 2;\n  column-gap: 24px;\n"),
      },
    },
    {
      id: "multicol-span",
      title: "段をまたぐ見出し: column-span",
      explanation:
        "<p>段組みの中の要素は、ふつう段の幅に収まります。見出しのように<b>すべての段をまたいで</b>横いっぱいに置きたい要素には <code>column-span: all</code> を指定します。またいだ要素より前の中身は上側で段に分かれ、後の中身は見出しの下から改めて段に分かれます。</p><p>値は <code>none</code>（またがない）か <code>all</code>（すべての段をまたぐ）の 2 つだけで、「2 段だけまたぐ」ような指定はできません。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能。Firefox は 71 から）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/column-span",
      viz: { concept: "none" },
      challenge: {
        starterHTML: HEADED_HTML,
        starterCSS: HEADED_CSS(""),
        task: "段組みの中の見出し（h3）が 1 段目の幅に押し込められ、2 行に折れています。見出しだけ段をまたいで横いっぱいに置き、お知らせはその下から 2 段に分かれるようにしよう。",
        snapshot: { props: ["column-span"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "relativeSize",
                a: "head",
                b: "news",
                ratio: 1,
                dim: "w",
                message: "見出し（h3）が 1 段目の幅のままです（段をまたいでいません）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "order", ids: ["head", "n1"], axis: "y" },
                  { kind: "alignedEdge", ids: ["n1", "n4"], edge: "top" },
                ],
                message: "お知らせが、見出しの下から 2 段に分かれていません",
              },
              {
                kind: "computedEquals",
                id: "head",
                prop: "column-span",
                value: "all",
                message: "column-span: all で、見出しにすべての段をまたがせましょう",
              },
            ],
          },
        ],
        hints: ["またがせたい要素（見出し）のほうに指定します", ".head { column-span: all; }"],
        solution: HEADED_CSS("  column-span: all;\n"),
      },
    },
    {
      id: "multicol-break",
      title: "途中で段を変えない: break-inside",
      explanation:
        "<p>段組みでは、中身は<b>段の境目で切られて</b>次の段へ続きます。文章ならそれでよいのですが、カードのように<b>ひとかたまりで見せたい箱</b>が途中で切れると、上半分が 1 段目の下、下半分が 2 段目の上に分かれてしまいます。</p><p><code>break-inside: avoid</code> を箱に指定すると、箱の内側では段を変えなくなり、収まらない箱はまるごと次の段へ送られます。段だけを対象にする <code>avoid-column</code> もあります（印刷のページ送りには <code>avoid-page</code>）。古い <code>page-break-inside: avoid</code> は同じ意味の別名です。なお、画像や、<code>overflow</code> が visible 以外の箱（スクロールコンテナ）はもともと途中で切られません。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能。Chrome 50・Firefox 65・Safari 10 から。<code>avoid-column</code> は Firefox 92 から）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/break-inside",
      viz: { concept: "none" },
      challenge: {
        starterHTML: CARDS_HTML,
        starterCSS: CARDS_CSS(""),
        task: "2 段に分けたお知らせカードのうち、3 枚目が段の境目で上下に切れています。カード（.card）の途中で段が変わらないようにしよう。",
        snapshot: { props: ["break-inside"] },
        validators: [
          {
            kind: "allOf",
            of: [
              cardsIntact,
              {
                kind: "computedMatches",
                id: "c3",
                prop: "break-inside",
                pattern: "^avoid(-column)?$",
                message: "break-inside: avoid で、カードの途中で段が変わらないようにしましょう（display: inline-block や overflow: hidden でも分かれなくなりますが、段組みや印刷のための本来の指定は break-inside です）",
              },
            ],
          },
        ],
        hints: ["切られたくない箱のほうに指定します", ".card { break-inside: avoid; }"],
        solution: CARDS_CSS("  break-inside: avoid;\n"),
      },
    },
  ],
};
