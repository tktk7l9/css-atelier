import type { ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Flex items are judged by where they land and how wide they stay. The shelf
// and the message row are 280px wide, so the cards and the icon measure the
// same on any machine and in a narrow preview; the navigation bar fills the
// preview, so it is judged by gaps and edges rather than by absolute x.
// The last step of each lesson reads the computed value of the property it
// teaches, so a lookalike (a two-column grid, a min-width on the icon, an
// absolutely positioned button) fails with a message that says why.

const PRODUCTS = [
  ["ノート", "¥480"],
  ["ペン", "¥220"],
  ["定規", "¥160"],
  ["はさみ", "¥390"],
  ["のり", "¥120"],
] as const;

const SHELF_HTML =
  '<div data-id="shelf" class="shelf">' +
  PRODUCTS.map(([name, price], i) => `<div data-id="c${i + 1}" class="card"><b>${name}</b><span>${price}</span></div>`).join("") +
  "</div>";

const SHELF_CSS = (extra: string): string =>
  `.shelf {\n  display: flex;\n  gap: 12px;\n  width: 280px;\n  padding: 8px;\n  border-radius: 12px;\n  background: #eef1f8;\n${extra}}\n.card {\n  display: grid;\n  width: 120px;\n  padding: 8px 12px;\n  border-radius: 8px;\n  background: #dbe4fb;\n  font-size: 14px;\n}\n`;

const MESSAGE_HTML =
  '<div data-id="row" class="row"><div data-id="avatar" class="avatar"></div>' +
  '<p data-id="text" class="text">山田: 明日の打ち合わせは 10 時からに変更になりました。資料はチャンネルに置いてあります。</p></div>';

const MESSAGE_CSS = (extra: string): string =>
  `.row {\n  display: flex;\n  align-items: flex-start;\n  gap: 12px;\n  width: 280px;\n  padding: 12px;\n  border-radius: 12px;\n  background: #eef1f8;\n}\n.avatar {\n  width: 48px;\n  height: 48px;\n  border-radius: 50%;\n  background: linear-gradient(135deg, #2f5fd0, #2f9d5b);\n${extra}}\n.text {\n  margin: 0;\n  font-size: 14px;\n  line-height: 1.5;\n}\n`;

const NAV_HTML =
  '<nav data-id="nav" class="nav"><b data-id="logo" class="logo">Atelier</b>' +
  '<a data-id="l1" class="link" href="#price">料金</a><a data-id="l2" class="link" href="#guide">使い方</a>' +
  '<a data-id="login" class="login" href="#login">ログイン</a></nav>';

const NAV_CSS = (extra: string): string =>
  `.nav {\n  display: flex;\n  align-items: center;\n  gap: 16px;\n  padding: 8px 12px;\n  background: #eef1f8;\n}\n.logo {\n  color: #2f5fd0;\n}\n.link {\n  color: #18203a;\n  font-size: 14px;\n}\n.login {\n  padding: 6px 12px;\n  border-radius: 999px;\n  background: #2f5fd0;\n  color: #fff;\n  font-size: 14px;\n  text-decoration: none;\n${extra}}\n`;

/** The distance from `a`'s `edgeA` to `b`'s `edgeB` is `px`, give or take 2px. */
const spacing = (a: string, edgeA: "left" | "right", b: string, edgeB: "left" | "right", px: number): ValidatorSpec => ({
  kind: "offset",
  a,
  b,
  edgeA,
  edgeB,
  min: px - 2,
  max: px + 2,
});

/** A used margin wider than 0px: an auto margin that took the free space. */
const POSITIVE_PX = "^(?!0(?:\\.0+)?px$)\\d+(?:\\.\\d+)?px$";

export const flexPatternsTrack: Track = {
  id: "flex-patterns",
  title: "Flexbox の応用",
  summary: "flex-wrap で折り返し、flex-shrink: 0 で縮みを止め、margin-left: auto で 1 つだけ端に寄せる。",
  emoji: "🧵",
  lessons: [
    {
      id: "flex-wrap",
      title: "折り返して並べる: flex-wrap",
      explanation:
        "<p>flex コンテナーの子（フレックスアイテム）は、既定（<code>flex-wrap: nowrap</code>）では<b>1 行に並べられます</b>。入りきらないときは、アイテムが<b>縮んで</b>（<code>flex-shrink</code> の既定は 1）無理に収まり、縮みきれないぶんはコンテナーからはみ出します。</p><p><code>flex-wrap: wrap</code> を flex コンテナーに指定すると、入りきらないアイテムは<b>次の行へ折り返し</b>、それぞれの幅を保ったまま並びます。行の間も <code>gap</code> で空きます。<code>flex-direction</code> とまとめて <code>flex-flow: row wrap</code> とも書けます。<code>wrap-reverse</code> にすると、行が下から上へ積まれます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能。Chrome 29・Firefox 28・Safari 9 から）。行ごとの数をならす <code>wrap balance</code> という新しい指定もありますが、2026 年 10 月時点では Chrome 150 以降だけの実験的な機能です。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/flex-wrap",
      viz: { concept: "none" },
      challenge: {
        starterHTML: SHELF_HTML,
        starterCSS: SHELF_CSS(""),
        task: "5 枚の商品カードが 1 行に詰め込まれて細く縮み、棚からはみ出しています。カードの幅（120px）を保ったまま、入りきらないカードを次の行へ折り返そう。",
        snapshot: { props: ["flex-wrap"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "sizeApprox", id: "c1", w: 120 },
                  { kind: "sizeApprox", id: "c5", w: 120 },
                ],
                message: "カードが 120px より細く縮んでいます（1 行に詰め込まれています）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "alignedEdge", ids: ["c1", "c2"], edge: "top" },
                  { kind: "order", ids: ["c1", "c2"], axis: "x" },
                  { kind: "order", ids: ["c1", "c3"], axis: "y" },
                  { kind: "alignedEdge", ids: ["c1", "c3", "c5"], edge: "left" },
                  { kind: "insideContainer", id: "c4", containerId: "shelf" },
                ],
                message: "カードが棚の中で折り返していません（2 枚目は 1 枚目の横に、3 枚目は 2 行目の先頭に来るはずです）",
              },
              {
                kind: "computedEquals",
                id: "shelf",
                prop: "flex-wrap",
                value: "wrap",
                message: "grid で 2 列にしても見た目は同じですが、ここでは flex-wrap: wrap で折り返しましょう（カードの数や幅が変わっても、入るだけ並びます）",
              },
            ],
          },
        ],
        hints: ["折り返すかどうかは、並べている親（.shelf）で決めます", ".shelf { flex-wrap: wrap; }"],
        solution: SHELF_CSS("  flex-wrap: wrap;\n"),
      },
    },
    {
      id: "flex-shrink",
      title: "縮ませない: flex-shrink: 0",
      explanation:
        "<p>flex のアイテムが入りきらないとき、縮む割合を決めるのが <code>flex-shrink</code> です。既定は <code>1</code> で、すべてのアイテムが<b>もとの大きさ（flex-basis）に比例して</b>縮みます。長い文章の隣に置いたアイコンは、<code>width: 48px</code> と書いてあっても押されて細くなり、丸が楕円になってしまいます。</p><p>縮ませたくないアイテムに <code>flex-shrink: 0</code> を指定すると、その幅のまま残り、足りないぶんは<b>ほかのアイテムが縮んで</b>吸収します。<code>flex: none</code>（<code>flex: 0 0 auto</code> と同じ）と書いても同じです。なお、文章のように中身のあるアイテムは、ふつう中身の最小の幅（min-content）より細くは縮みません。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/flex-shrink",
      viz: { concept: "none" },
      challenge: {
        starterHTML: MESSAGE_HTML,
        starterCSS: MESSAGE_CSS(""),
        task: "長いメッセージに押されて、アイコン（48px の円）が横につぶれ、楕円になっています。アイコンを縮ませず、円のままにしよう。",
        snapshot: { props: ["flex-shrink"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "sizeApprox",
                id: "avatar",
                w: 48,
                h: 48,
                message: "アイコンが横につぶれています（幅が 48px より狭く、円になっていません）",
              },
              {
                kind: "allOf",
                of: [spacing("avatar", "right", "text", "left", 12), { kind: "insideContainer", id: "text", containerId: "row" }],
                message: "メッセージがアイコンの右（12px あけた位置）に収まっていません",
              },
              {
                kind: "computedEquals",
                id: "avatar",
                prop: "flex-shrink",
                value: "0",
                message: "幅は守れていますが、アイコン自身に flex-shrink: 0 を指定しましょう（「この要素は縮めない」と書くのがいちばん直接的で、アイコンの大きさを変えても書き直しが要りません）",
              },
            ],
          },
        ],
        hints: ["縮ませたくないのはアイコンです。アイコン自身に、縮む割合を指定します", ".avatar { flex-shrink: 0; }"],
        solution: MESSAGE_CSS("  flex-shrink: 0;\n"),
      },
    },
    {
      id: "flex-auto-margin",
      title: "1 つだけ右端へ: margin-left: auto",
      explanation:
        "<p>flex の主軸（横並びなら横）には <code>justify-self</code> が効かないので、「この 1 つだけ右端へ」という指定は <code>justify-content</code> ではできません。<code>justify-content: space-between</code> にすると、余ったスペースがすべてのアイテムの間に配られ、リンクまで離れてしまいます。</p><p>そこで使うのが <b>auto のマージン</b>です。flex のアイテムに <code>margin-left: auto</code> を指定すると、そのマージンが<b>余ったスペースをすべて吸収</b>し、そのアイテム（と後ろのアイテム）が右端へ押し出されます。書字方向に合わせるなら <code>margin-inline-start: auto</code> です。縦に並べたカードで <code>margin-top: auto</code> にすれば、ボタンを下端にそろえられます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Guides/Flexible_box_layout/Aligning_items",
      viz: { concept: "none" },
      challenge: {
        starterHTML: NAV_HTML,
        starterCSS: NAV_CSS(""),
        task: "ナビゲーションの「ログイン」ボタンだけを右端に寄せよう。ロゴとリンクは左に詰めたままにします。",
        snapshot: { props: ["margin-left", "margin-right"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                ...spacing("login", "right", "nav", "right", 12),
                message: "ログインボタンが右端（余白 12px の位置）にありません",
              },
              {
                kind: "allOf",
                of: [spacing("logo", "right", "l1", "left", 16), spacing("l1", "right", "l2", "left", 16)],
                message: "リンクがロゴから離れています（余りはログインボタンの手前にだけ入れて、ロゴとリンクは左に詰めたままにします）",
              },
              {
                // The free space sits in an auto margin: before the button, or after the last link.
                kind: "anyOf",
                of: [
                  { kind: "computedMatches", id: "login", prop: "margin-left", pattern: POSITIVE_PX },
                  { kind: "computedMatches", id: "l2", prop: "margin-right", pattern: POSITIVE_PX },
                ],
                message: "ボタンの左のマージンを auto にして、余ったスペースを吸収させましょう（margin-left: auto）",
              },
            ],
          },
        ],
        hints: ["余ったスペースを、ログインボタンの左側のマージンに吸わせます", ".login { margin-left: auto; }"],
        solution: NAV_CSS("  margin-left: auto;\n"),
      },
    },
  ],
};
