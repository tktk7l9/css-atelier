import type { ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Margin collapsing is judged by the gaps between box edges, which do not
// depend on the font: the space between the heading and the paragraph, how far
// the card's heading sits below the card's top edge (and that the card itself
// did not move), and the gaps between flex items and the list's edges. Any
// change that produces those gaps passes; the messages explain the collapsing.

const gap = (a: string, b: string, edgeA: "top" | "bottom", edgeB: "top" | "bottom", px: number): ValidatorSpec => ({
  kind: "offset",
  a,
  b,
  edgeA,
  edgeB,
  min: px - 0.5,
  max: px + 0.5,
});

const POST_HTML = '<article class="post"><h2 data-id="title">夏の旅特集</h2><p data-id="text">海の見える宿を 30 軒えらびました。</p></article>';

const POST_CSS = (heading: string): string =>
  `.post h2 {\n  margin: 0 0 ${heading};\n  font-size: 22px;\n}\n.post p {\n  margin: 16px 0 0;\n}\n`;

const CARD_HTML =
  '<p data-id="intro" class="intro">新着のお知らせ</p>' +
  '<section data-id="card" class="card"><h3 data-id="title">春の講座</h3><p>受付を始めました。定員になりしだい締め切ります。</p></section>';

const CARD_CSS = (extra: string): string =>
  `.intro {\n  margin: 0;\n}\n.card {\n  border-radius: 12px;\n  background: #eef1f8;\n${extra}}\n.card h3 {\n  margin: 24px 16px 8px;\n}\n.card p {\n  margin: 0 16px 16px;\n}\n`;

const LIST_HTML =
  '<div data-id="list" class="list">' +
  '<article data-id="c1" class="item">春の講座</article><article data-id="c2" class="item">夏の講座</article><article data-id="c3" class="item">秋の講座</article>' +
  "</div>";

const LIST_CSS = (list: string, item: string): string =>
  `.list {\n  display: flex;\n  flex-direction: column;\n  padding: 0 12px;\n  background: #f6f7fb;\n${list}}\n.item {\n${item}  padding: 12px;\n  border-radius: 8px;\n  background: #dbe4fb;\n}\n`;

export const marginCollapseTrack: Track = {
  id: "margin-collapse",
  title: "マージンの相殺（兄弟・親子・flex と grid）",
  summary: "上下に並んだマージンが大きいほうだけになる相殺を知り、親を突き抜ける見出しのマージンを display: flow-root で中に収め、相殺しない flex の並びは gap で間をそろえる。",
  emoji: "🪜",
  lessons: [
    {
      id: "sibling-collapse",
      title: "16px + 16px が 16px になる: 兄弟のマージンの相殺",
      explanation:
        "<p>上下に並んだブロックのマージンは、足されずに<b>大きいほうだけ</b>になります（マージンの相殺）。見出しの下に 16px、段落の上に 16px を付けても、間は 32px ではなく 16px です。</p><p>間を 32px にしたいなら、どちらか一方のマージンを 32px にします（もう一方の 16px は、大きいほうに吸収されます）。相殺は上下方向だけで、左右のマージンは足されます。CSS のふつうのブロックの並びの決まりです。</p>",
      mdnPath: "/ja/docs/Web/CSS/Guides/Box_model/Margin_collapsing",
      viz: { concept: "none" },
      challenge: {
        starterHTML: POST_HTML,
        starterCSS: POST_CSS("16px"),
        task: "見出しの下に 16px、段落の上に 16px のマージンを付けたのに、間が 16px しかありません。見出しと段落の間を 32px にしよう。",
        snapshot: { props: [] },
        validators: [
          {
            ...gap("title", "text", "bottom", "top", 32),
            message: "見出しと段落の間が 32px になっていません（上下のマージンは足されず、大きいほうだけになります。どちらかを 32px に）",
          },
        ],
        hints: ["上下に並んだマージンは、大きいほうの値になります", ".post h2 { margin-bottom: 32px; }"],
        solution: POST_CSS("32px"),
      },
    },
    {
      id: "parent-collapse",
      title: "親を突き抜けるマージン: display: flow-root で中に収める",
      explanation:
        "<p>親の箱に上の枠線や padding がないと、最初の子のマージンは<b>親のマージンと相殺されて、親の外に出ます</b>。見出しの上の 24px が、カードの中ではなくカードの上に空いてしまい、見出しはカードの上端にくっつきます。</p><p>カードに <code>display: flow-root</code> を指定すると、カードが新しいブロック整形コンテキストを作り、子のマージンと相殺しなくなります。カードの <code>padding-top</code> で余白を作っても防げます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Guides/Box_model/Margin_collapsing",
      viz: { concept: "none" },
      challenge: {
        starterHTML: CARD_HTML,
        starterCSS: CARD_CSS(""),
        task: "見出しの上の 24px のマージンが、カードの内側ではなく外（上）に出ています。カードの位置は変えずに、見出しをカードの上端から 24px 下に置こう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                ...gap("card", "title", "top", "top", 24),
                message: "見出しが、カードの上端から 24px 下にありません（見出しのマージンが、カードの外に突き抜けています）",
              },
              {
                ...gap("intro", "card", "bottom", "top", 0),
                message: "カードの位置が下にずれています（突き抜けたマージンがカードの上に空いています。カードに display: flow-root）",
              },
            ],
          },
        ],
        hints: ["カードが新しいブロック整形コンテキストを作ると、子のマージンが外に出なくなります", ".card { display: flow-root; }"],
        solution: CARD_CSS("  display: flow-root;\n"),
      },
    },
    {
      id: "flex-no-collapse",
      title: "flex の中では相殺しない: gap で間をそろえる",
      explanation:
        "<p>マージンの相殺は、ふつうのブロックの並びだけで起こり、<b>flex や grid のコンテナの中では起こりません</b>。上下に 12px ずつマージンを付けたカードを flex で縦に並べると、カードの間は 24px になり、最初のカードの上にも 12px が空きます。</p><p>flex や grid では、アイテムのマージンをやめて、コンテナの <code>gap</code> で間を決めます。gap はアイテムの<b>あいだだけ</b>に入るので、最初と最後の外側には空きません。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/gap",
      viz: { concept: "none" },
      challenge: {
        starterHTML: LIST_HTML,
        starterCSS: LIST_CSS("", "  margin: 12px 0;\n"),
        task: "flex で縦に並べたカードの間が 24px になり、上と下にも余白があります。カードの間を 12px にそろえ、最初と最後のカードを並びの上端・下端にくっつけよう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [gap("c1", "c2", "bottom", "top", 12), gap("c2", "c3", "bottom", "top", 12)],
                message: "カードの間が 12px になっていません（flex の中ではマージンが相殺されず、12px + 12px になります）",
              },
              {
                kind: "allOf",
                of: [gap("list", "c1", "top", "top", 0), gap("c3", "list", "bottom", "bottom", 0)],
                message: "最初と最後のカードの外側に余白があります（gap ならアイテムのあいだだけに入ります）",
              },
            ],
          },
        ],
        hints: ["カードのマージンをやめて、並び（.list）に gap を付けます", ".list { gap: 12px; } .item { margin: 0; }"],
        solution: LIST_CSS("  gap: 12px;\n", ""),
      },
    },
  ],
};
