import type { ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Stacking is judged by hit tests: which element the pointer reaches at a
// point where two boxes overlap (hitTarget), the same order a click follows.
// Rects and computed values cannot show it: a menu hidden under a card has the
// same box either way. The points sit inside the overlapping boxes (as
// fractions of their size), so they stay on the overlap at any preview width.
// The layout checks keep the menu a dropdown over the card (a menu put back
// into the header's flow no longer overlaps anything), and the badge check
// keeps the card's position: relative, which the badge needs.

const NAV_HTML = (label: string, text: string): string =>
  '<header data-id="bar" class="bar"><span>Atelier</span><nav data-id="menu" class="menu"><a href="#">ホーム</a><a href="#">講座の一覧</a><a href="#">お問い合わせ</a></nav></header>' +
  `<section data-id="card" class="card"><span data-id="badge" class="badge">${label}</span><p>${text}</p></section>`;

const NAV_CSS = (bar: string, menu: string, card: string): string =>
  `.bar {\n  position: relative;\n${bar}  display: flex;\n  justify-content: space-between;\n  padding: 10px 12px;\n  border-radius: 8px;\n  background: #18203a;\n  color: #fff;\n}\n/* 開いたメニュー */\n.menu {\n  position: absolute;\n${menu}  top: 100%;\n  right: 12px;\n  display: grid;\n  width: 150px;\n  padding: 4px;\n  border: 1px solid #c5cde0;\n  border-radius: 8px;\n  background: #fff;\n}\n.menu a {\n  padding: 6px 8px;\n  color: #18203a;\n  text-decoration: none;\n}\n.card {\n  position: relative;\n${card}  margin-top: 12px;\n  padding: 20px 16px 16px;\n  border-radius: 12px;\n  background: #dbe4fb;\n}\n.badge {\n  position: absolute;\n  top: -8px;\n  left: 12px;\n  padding: 0 6px;\n  border-radius: 999px;\n  background: #c62828;\n  color: #fff;\n  font-size: 12px;\n}\n.card p {\n  margin: 0;\n}\n`;

const BLOB_HTML =
  '<article data-id="card" class="card"><span data-id="blob" class="blob"></span><h3 data-id="title">夏の旅特集</h3><p>海の見える宿を 30 軒えらびました。</p></article>';

const BLOB_CSS = (extra: string): string =>
  `.card {\n  position: relative;\n  width: 280px;\n  padding: 20px;\n  overflow: hidden;\n  border: 1px solid #c5cde0;\n  border-radius: 12px;\n  background: #fff;\n${extra}}\n/* 右上の飾りの丸（文字の下に置きたい） */\n.blob {\n  position: absolute;\n  z-index: -1;\n  top: -20px;\n  right: -20px;\n  width: 120px;\n  height: 120px;\n  border-radius: 50%;\n  background: #ffd75e;\n}\n.card h3 {\n  margin: 0 0 4px;\n  font-size: 20px;\n}\n.card p {\n  margin: 0;\n}\n`;

/** Where the open menu overlaps the card below it: in the middle, and on the
 *  menu's own 5px edge (border and padding), which only the menu's box covers. */
const MENU_POINTS = [
  { at: "menu", fx: 0.5, fy: 0.4 },
  { at: "menu", fx: 0.02, fy: 0.4 },
] as const;

const menuOnTop = (message: string): ValidatorSpec => ({
  kind: "allOf",
  of: MENU_POINTS.map((p): ValidatorSpec => ({ kind: "hitTarget", ...p, top: "menu" })),
  message,
});

/** The menu still opens right under the header, over the card, which keeps its place. */
const layoutKept: ValidatorSpec = {
  kind: "allOf",
  of: [
    { kind: "offset", a: "bar", b: "menu", edgeA: "bottom", edgeB: "top", min: -0.5, max: 0.5 },
    { kind: "offset", a: "bar", b: "card", edgeA: "bottom", edgeB: "top", min: 11.5, max: 12.5 },
  ],
  message: "メニューやカードの位置が変わっています（メニューは position: absolute のまま、ヘッダーのすぐ下に重ねて開きます）",
};

/** The badge still sits on the card's top-left corner, so the card keeps its position. */
const badgeOnCard: ValidatorSpec = {
  kind: "allOf",
  of: [
    { kind: "offset", a: "card", b: "badge", edgeA: "top", edgeB: "top", min: -8.5, max: -7.5 },
    { kind: "offset", a: "card", b: "badge", edgeA: "left", edgeB: "left", min: 11.5, max: 12.5 },
  ],
};

export const stackingTrack: Track = {
  id: "stacking",
  title: "重なり順（z-index・重ね合わせコンテキスト・isolation）",
  summary: "z-index で後ろの要素に隠れたメニューを手前に出し、重ね合わせコンテキストの中では z-index を大きくしても外に勝てないことを知り、isolation: isolate で飾りを文字の下に置く。",
  emoji: "📚",
  lessons: [
    {
      id: "z-index-order",
      title: "後ろの要素に隠れたメニューを出す: z-index",
      explanation:
        "<p>position を指定した要素どうしが重なると、<code>z-index</code> がなければ <b>HTML で後ろにある要素ほど上</b>に描かれます（position のない要素は、それらより下です）。ヘッダーの中で開いたメニューに、あとに続くカードがかぶさるのはそのためです。</p><p><code>z-index</code> は、position を指定した要素（と flex・grid のアイテム）の重なり順を決めます。数が大きいほど手前で、何も指定しない <code>auto</code> は 0 の高さなので、その上に出すなら <code>z-index: 1</code> で十分です。重なり順は見た目だけでなく、<b>押したときにどの要素が反応するか</b>も決めます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/z-index",
      viz: { concept: "none" },
      challenge: {
        starterHTML: NAV_HTML("NEW", "春の講座の受付を始めました。定員になりしだい締め切ります。"),
        starterCSS: NAV_CSS("", "", ""),
        task: "開いたメニューの一部が、あとに続くカードの下に隠れています。メニューをカードより手前に出そう（カードの position: relative は「NEW」の位置に使っているので残す）。",
        snapshot: { props: [], hits: [...MENU_POINTS] },
        validators: [
          {
            kind: "allOf",
            of: [
              menuOnTop("メニューが、あとに続くカードの下に隠れています（どちらも position 付きで z-index がないので、HTML で後ろにあるカードが上に描かれます）"),
              layoutKept,
              { ...badgeOnCard, message: "カードの「NEW」の位置が変わっています（カードの position: relative は残して、メニューのほうを手前に出します）" },
            ],
          },
        ],
        hints: ["position 付きの要素どうしは、z-index がなければ HTML で後ろのものが上に描かれます", ".menu { z-index: 1; }"],
        solution: NAV_CSS("", "  z-index: 1;\n", ""),
      },
    },
    {
      id: "stacking-context",
      title: "z-index: 999 でも出ない: 重ね合わせコンテキスト",
      explanation:
        "<p>position と <code>z-index</code>（auto 以外）を指定した要素は、<b>重ね合わせコンテキスト</b>を作ります。その中の要素の z-index は<b>同じコンテキストの中でだけ</b>比べられ、外の要素とは、コンテキストを作った要素がまとめて 1 枚として比べられます。</p><p>ここでは、ヘッダー（z-index: 1）がコンテキストを作っているので、中のメニューに 999 を付けても、z-index: 2 の枠より上には出ません。比べられているのは、ヘッダーの 1 と枠の 2 です。ヘッダーの z-index を枠より大きくするか、どちらかの z-index をなくしてコンテキストを作らないようにします。</p><p>opacity が 1 未満の要素や、transform を指定した要素なども重ね合わせコンテキストを作ります。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Guides/Positioned_layout/Stacking_context",
      viz: { concept: "none" },
      challenge: {
        starterHTML: NAV_HTML("特集", "夏の旅特集を公開しました。写真をめくって、行き先を選べます。"),
        starterCSS: NAV_CSS("  z-index: 1;\n", "  z-index: 999;\n", "  /* 中の写真の矢印を前に出すため */\n  z-index: 2;\n"),
        task: "メニューに z-index: 999 を付けているのに、あとに続く枠の下に隠れています。メニューの数をさらに大きくしても出ない理由を考えて、メニューを手前に出そう（枠の position: relative は残す）。",
        snapshot: { props: [], hits: [...MENU_POINTS] },
        validators: [
          {
            kind: "allOf",
            of: [
              menuOnTop("メニューが、あとに続く枠の下に隠れています（ヘッダーの z-index: 1 が重ね合わせコンテキストを作るので、中のメニューの 999 は外と比べられません。比べられるのは、ヘッダーの 1 と枠の 2 です）"),
              layoutKept,
              { ...badgeOnCard, message: "枠の「特集」の位置が変わっています（枠の position: relative は残して、z-index を見直します）" },
            ],
          },
        ],
        hints: ["メニューの z-index は、ヘッダーが作った重ね合わせコンテキストの中でしか比べられません", ".bar { z-index: 3; }（ヘッダーごと、枠の 2 より上に出す）"],
        solution: NAV_CSS("  z-index: 3;\n", "  z-index: 999;\n", "  /* 中の写真の矢印を前に出すため */\n  z-index: 2;\n"),
      },
    },
    {
      id: "isolation-isolate",
      title: "飾りを背景の上・文字の下に: isolation: isolate",
      explanation:
        "<p><code>z-index: -1</code> は、重ね合わせコンテキストの中で、ふつうの要素より下（コンテキストを作った要素の背景のすぐ上）に置く指定です。でも、カードがコンテキストを作っていないと、飾りはページ全体のコンテキストの下のほうまで沈み、<b>カードの白い背景の下に隠れて</b>しまいます。</p><p>カードに <code>isolation: isolate</code> を指定すると、z-index の数を書かずに<b>新しい重ね合わせコンテキスト</b>を作れます。飾りの -1 はカードの中で比べられるようになり、カードの背景の上・文字の下に描かれます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/isolation",
      viz: { concept: "none" },
      challenge: {
        starterHTML: BLOB_HTML,
        starterCSS: BLOB_CSS(""),
        task: "カードの右上に置いた黄色い丸の飾り（z-index: -1）が見えません。飾りを、カードの白い背景の上・見出しの文字の下に表示しよう。",
        snapshot: {
          props: ["background-color"],
          hits: [
            { at: "blob", fx: 0.75, fy: 0.5 },
            { at: "title", fx: 0.9, fy: 0.5 },
          ],
        },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "computedEquals",
                id: "card",
                prop: "background-color",
                value: "rgb(255, 255, 255)",
                message: "カードの白い背景が変わっています（背景は白のまま、飾りをその上に出します）",
              },
              {
                kind: "hitTarget",
                at: "blob",
                fx: 0.75,
                fy: 0.5,
                top: "blob",
                message: "飾りの丸が、カードの背景の下に隠れています（カードが重ね合わせコンテキストを作っていないので、z-index: -1 の飾りはページ全体の下のほうまで沈みます）",
              },
              {
                kind: "hitTarget",
                at: "title",
                fx: 0.9,
                fy: 0.5,
                top: "title",
                message: "飾りの丸が、見出しの文字の上に重なっています（飾りの z-index: -1 は残して、文字の下に置きます）",
              },
            ],
          },
        ],
        hints: ["カードに、z-index の数を使わずに重ね合わせコンテキストを作るプロパティがあります", ".card { isolation: isolate; }"],
        solution: BLOB_CSS("  isolation: isolate;\n"),
      },
    },
  ],
};
