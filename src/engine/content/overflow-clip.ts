import type { Edge, ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// What overflow cuts off is judged by hit-testing points just outside the
// card: past its right edge the striped ribbon must be clipped (the point
// reaches the box behind it), while the badge sticking out above it must still
// be there. The sticky lesson starts scrolled to the far end (column-reverse,
// as in the sticky track), where only a heading stuck to the box's top edge is
// in view; the float lesson measures whether the card reaches below the photo.

const between = (a: string, b: string, edgeA: Edge, edgeB: Edge, px: number): ValidatorSpec => ({
  kind: "offset",
  a,
  b,
  edgeA,
  edgeB,
  min: px - 0.5,
  max: px + 0.5,
});

const RIBBON = "  background: repeating-linear-gradient(45deg, #f5c400 0 8px, #18203a 8px 16px);\n";

const BADGE_HTML =
  '<div data-id="page" class="page"><article class="card"><span data-id="badge" class="badge">新着</span>' +
  '<h3 class="title">春の講座</h3><div data-id="ribbon" class="ribbon"></div></article></div>';

const BADGE_CSS = (overflow: string): string =>
  `.page {\n  padding: 24px 16px;\n}\n.card {\n  position: relative;\n  width: 220px;\n  padding: 16px;\n  border-radius: 12px;\n  background: #eef1f8;\n  /* 右へはみ出す帯だけを切りたい */\n  ${overflow}\n}\n.title {\n  margin: 0;\n  font-size: 18px;\n}\n.badge {\n  position: absolute;\n  top: -12px;\n  left: 12px;\n  padding: 2px 10px;\n  border-radius: 999px;\n  background: #2f5fd0;\n  color: #fff;\n  font-size: 12px;\n}\n.ribbon {\n  height: 10px;\n  margin: 12px -64px 0 0;\n${RIBBON}}\n`;

const NEWS = ["年末年始の営業について", "新しい講座を追加しました", "メンテナンスのお知らせ", "夏季休業のご案内", "料金改定のお知らせ", "アプリを更新しました", "店舗が移転します"];

const STICKY_HTML =
  '<div data-id="box" class="box"><section class="card"><h2 data-id="head" class="head">お知らせ</h2>' +
  NEWS.map((t) => `<p class="item">${t}</p>`).join("") +
  '<div data-id="ribbon" class="ribbon"></div></section></div>';

const STICKY_CSS = (overflow: string): string =>
  `/* プレビューは、一番下までスクロールした位置から始まります\n   （.box の column-reverse はそのための仕掛けです。このままで OK） */\n.box {\n  display: flex;\n  flex-direction: column-reverse;\n  height: 240px;\n  overflow-y: auto;\n}\n.card {\n  width: 240px;\n  border-radius: 12px;\n  background: #eef1f8;\n  /* 右へはみ出す帯を切る */\n  overflow: ${overflow};\n}\n.head {\n  position: sticky;\n  top: 0;\n  margin: 0;\n  padding: 8px 12px;\n  background: #2f5fd0;\n  color: #fff;\n  font-size: 16px;\n}\n.item {\n  margin: 0;\n  padding: 8px 12px;\n  border-top: 1px solid #d6dded;\n}\n.ribbon {\n  height: 10px;\n  margin-right: -40px;\n${RIBBON}}\n`;

const FLOAT_HTML =
  '<article data-id="card" class="card"><div data-id="photo" class="photo"></div>' +
  '<p class="text">海辺の町を歩く、日帰りの講座です。</p></article><p class="next">次の講座</p>';

const FLOAT_CSS = (extra: string): string =>
  `.card {\n  padding: 12px;\n  border-radius: 12px;\n  background: #eef1f8;\n  /* スクロールの箱にしないよう、hidden から clip に変えた */\n  overflow: clip;\n${extra}}\n.photo {\n  float: left;\n  width: 96px;\n  height: 96px;\n  margin-right: 12px;\n  border-radius: 8px;\n  background: linear-gradient(135deg, #9fd3f5, #2f5fd0);\n}\n.text {\n  margin: 0;\n}\n.next {\n  margin: 12px 0 0;\n}\n`;

export const overflowClipTrack: Track = {
  id: "overflow-clip",
  title: "はみ出しの切り取り（overflow: clip と hidden の違い）",
  summary: "overflow-x: hidden で縦まで切れるのを overflow-x: clip で防ぎ、sticky を止めずに切り取り、clip では囲めない float を display: flow-root で囲む。",
  emoji: "📎",
  lessons: [
    {
      id: "overflow-x-clip",
      title: "横だけ切る: overflow-x: clip",
      explanation:
        "<p><code>overflow-x</code> と <code>overflow-y</code> は別々に指定できますが、組み合わせに決まりがあります。片方を <code>hidden</code>・<code>scroll</code>・<code>auto</code> にすると、もう一方の <code>visible</code> は <code>auto</code> として、<code>clip</code> は <code>hidden</code> として扱われます。横だけを切るつもりで <code>overflow-x: hidden</code> と書くと、縦にはみ出したものも切る箱になり、上にはみ出した「新着」の印まで切れてしまいます。</p><p><code>overflow-x: clip</code> なら、<code>overflow-y</code> は <code>visible</code> のままなので、横にはみ出した帯だけを切れます。<code>clip</code> ははみ出しを切り取るだけで、スクロールの箱にはなりません。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/overflow-x",
      viz: { concept: "none" },
      challenge: {
        starterHTML: BADGE_HTML,
        starterCSS: BADGE_CSS("overflow-x: hidden;"),
        task: "右へはみ出す帯を切るために overflow-x: hidden を付けたら、上にはみ出した「新着」の印まで切れました。帯は切ったまま、印が全部見えるようにしよう。",
        snapshot: {
          props: [],
          hits: [
            { at: "ribbon", fx: 0.1, fy: 0.5 },
            { at: "ribbon", fx: 0.95, fy: 0.5 },
            { at: "badge", fx: 0.5, fy: 0.2 },
          ],
        },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "hitTarget", at: "ribbon", fx: 0.1, fy: 0.5, top: "ribbon" },
                  { kind: "hitTarget", at: "ribbon", fx: 0.95, fy: 0.5, top: "page" },
                ],
                message: "右へはみ出した帯が、カードの外まで見えています（帯の切り取りは残します）",
              },
              {
                kind: "hitTarget",
                at: "badge",
                fx: 0.5,
                fy: 0.2,
                top: "badge",
                message: "「新着」の印の上半分が切れています（overflow-x を hidden にすると、overflow-y の visible は auto として扱われ、縦も切られます。overflow-x: clip なら、overflow-y は visible のままです）",
              },
            ],
          },
        ],
        hints: ["横を hidden にすると、縦の visible も auto に変わります。切り取るだけの値を使います", ".card { overflow-x: clip; }"],
        solution: BADGE_CSS("overflow-x: clip;"),
      },
    },
    {
      id: "clip-keeps-sticky",
      title: "sticky を止めずに切る: overflow: clip",
      explanation:
        "<p><code>position: sticky</code> の要素は、<b>いちばん近い「スクロールの仕組みを持つ」祖先</b>に貼り付きます。<code>overflow</code> が <code>hidden</code>・<code>scroll</code>・<code>auto</code> の箱はその仕組みを持つので、帯を切るためにカードを <code>overflow: hidden</code> にすると、見出しはカードに貼り付こうとします。カード自体はスクロールしないので、外側の箱をスクロールしても見出しは止まりません。</p><p><code>overflow: clip</code> ははみ出しを切り取るだけで、スクロールの箱にはなりません。見出しは外側の箱のスクロールに貼り付き、帯も切れたままです。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/position",
      viz: { concept: "none" },
      challenge: {
        starterHTML: STICKY_HTML,
        starterCSS: STICKY_CSS("hidden"),
        task: "カードの帯を切るために overflow: hidden を付けたら、見出し「お知らせ」がスクロールしても上に残らなくなりました。帯は切ったまま、見出しが上に残るようにしよう。",
        snapshot: {
          props: ["position"],
          hits: [
            { at: "ribbon", fx: 0.1, fy: 0.5 },
            { at: "ribbon", fx: 0.95, fy: 0.5 },
          ],
        },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "hitTarget", at: "ribbon", fx: 0.1, fy: 0.5, top: "ribbon" },
                  { kind: "hitTarget", at: "ribbon", fx: 0.95, fy: 0.5, top: "box" },
                ],
                message: "右へはみ出した帯が、カードの外まで見えています（overflow を外すと、切り取りもなくなります。切り取るだけなら overflow: clip です）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "computedEquals", id: "head", prop: "position", value: "sticky" },
                  { kind: "alignedEdge", ids: ["head", "box"], edge: "top", tol: 1 },
                ],
                message: "見出しが、スクロールしても上に残っていません（overflow: hidden のカードはスクロールの仕組みを持つ箱になり、見出しはスクロールしないカードに貼り付こうとします。overflow: clip は切り取るだけで、スクロールの箱になりません）",
              },
            ],
          },
        ],
        hints: ["切り取るだけで、スクロールの箱にならない overflow の値があります", ".card { overflow: clip; }"],
        solution: STICKY_CSS("clip"),
      },
    },
    {
      id: "clip-flow-root",
      title: "clip では float を囲めない: display: flow-root と組む",
      explanation:
        "<p><code>overflow</code> の <code>hidden</code>・<code>scroll</code>・<code>auto</code> は新しいブロック整形文脈を作るので、中の float を囲みます。<code>clip</code> は（<code>visible</code> と同じく）作らないので、<code>hidden</code> から <code>clip</code> に変えると、カードは float の写真を囲まなくなり、カードの下にはみ出した部分が切り取られます。</p><p>clip のまま float を囲むには、<code>display: flow-root</code> を足します。MDN でも、clip で整形文脈がほしいときはこの組み合わせを勧めています。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/overflow",
      viz: { concept: "none" },
      challenge: {
        starterHTML: FLOAT_HTML,
        starterCSS: FLOAT_CSS(""),
        task: "overflow を hidden から clip に変えたら、写真（float）の下がカードからはみ出して切れました。overflow は clip のまま、カードが写真を囲むようにしよう。",
        snapshot: { props: ["overflow-x"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                ...between("photo", "card", "bottom", "bottom", 12),
                message: "写真の下がカードからはみ出して、切れています（clip は hidden と違って新しいブロック整形文脈を作らないので、float を囲みません。display: flow-root を足すと囲みます）",
              },
              {
                kind: "computedEquals",
                id: "card",
                prop: "overflow-x",
                value: "clip",
                message: "overflow は clip のままにしましょう（hidden に戻すとカードがスクロールの箱になり、中の sticky の見出しが止まらなくなります）",
              },
            ],
          },
        ],
        hints: ["clip のまま、新しいブロック整形文脈を作る display の値を足します", ".card { display: flow-root; }"],
        solution: FLOAT_CSS("  display: flow-root;\n"),
      },
    },
  ],
};
