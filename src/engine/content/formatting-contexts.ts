import type { ValidatorSpec } from "../validate/primitives.js";
import { svgUri } from "./svg-uri.js";
import type { Track } from "./types.js";

// These lessons are judged by where boxes end up around a float and inside a
// grid: a card that establishes a block formatting context grows to contain
// its floated photo (12px padding and a 1px border below it); a cleared
// heading starts below the photo's margin edge at the left edge of the
// article; and with display: contents the two picks inside a wrapper become
// grid items, so all four cards share one row of equal columns. Lookalikes
// (overflow, a fixed height, a pushed-down heading, subgrid) pass the
// geometry and fail the last step, which reads the computed value taught.

const square = (fill: string, mark: string): string =>
  svgUri(96, 96, `<rect width='96' height='96' rx='8' fill='${fill}'/>${mark}`);

const CAMERA = square("#2f5fd0", "<rect x='22' y='34' width='52' height='36' rx='6' fill='#fff'/><circle cx='48' cy='52' r='11' fill='#2f5fd0'/>");
const TEA = square("#2f9d5b", "<path d='M26 40h44v12a22 22 0 0 1-44 0z' fill='#fff'/><path d='M70 44h6a6 6 0 0 1 0 12h-6' fill='none' stroke='#fff' stroke-width='4'/>");

const CARD_HTML =
  `<article data-id="card" class="card"><img data-id="photo" class="photo" src="${CAMERA}" alt="カメラ">` +
  '<p data-id="text">新しいカメラが入荷しました。</p></article><p data-id="after" class="after">ほかのお知らせ</p>';

const CARD_CSS = (extra: string): string =>
  `.card {\n  padding: 12px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n  background: #eef1f8;\n${extra}}\n.photo {\n  float: left;\n  margin-right: 12px;\n}\n.card p {\n  margin: 0;\n}\n.after {\n  margin: 8px 0 0;\n}\n`;

const POST_HTML =
  `<article data-id="post" class="post"><img data-id="photo" class="photo" src="${TEA}" alt="お茶">` +
  '<p data-id="lead" class="lead">新茶が入荷しました。</p><h3 data-id="next" class="next">淹れ方</h3>' +
  '<p data-id="tail" class="tail">80℃のお湯を注ぎ、1 分待ちます。</p></article>';

const POST_CSS = (extra: string): string =>
  `.photo {\n  float: left;\n  margin: 0 12px 8px 0;\n}\n.lead,\n.tail {\n  margin: 0;\n}\n.next {\n  margin: 16px 0 4px;\n  font-size: 16px;\n${extra}}\n`;

const GRID_HTML =
  '<div data-id="grid" class="grid"><div data-id="c1" class="card">はじめに</div>' +
  '<div data-id="group" class="group"><div data-id="c2" class="card pick">おすすめ 1</div><div data-id="c3" class="card pick">おすすめ 2</div></div>' +
  '<div data-id="c4" class="card">まとめ</div></div>';

const GRID_CSS = (extra: string): string =>
  `.grid {\n  display: grid;\n  grid-template-columns: repeat(4, 1fr);\n  gap: 8px;\n}\n.card {\n  padding: 12px 8px;\n  border-radius: 8px;\n  background: #dbe4fb;\n  font-size: 14px;\n}\n.pick {\n  background: #fff3c4;\n}\n${extra}`;

const sameWidth = (a: string, b: string): ValidatorSpec => ({ kind: "relativeSize", a, b, ratio: 1, dim: "w", tol: 1 });

export const formattingContextsTrack: Track = {
  id: "formatting-contexts",
  title: "フロートを囲む・下げる（flow-root・clear・display: contents）",
  summary: "display: flow-root で float を囲み、clear で float の下から始め、display: contents で入れ物の箱をなくす。",
  emoji: "🧺",
  lessons: [
    {
      id: "flow-root",
      title: "float を囲む: display: flow-root",
      explanation:
        "<p><code>float</code> した要素は通常のフローから外れるので、<b>親の高さに含まれません</b>。カードの中で写真を <code>float</code> すると、文章が短いとカードの高さは文章のぶんだけになり、写真がカードの枠の下へはみ出します。</p><p><code>display: flow-root</code> は、要素を<b>新しいブロック整形コンテキスト（BFC）</b>の根にします。BFC は中の float をすべて囲むので、カードは写真の下端まで伸びます。BFC の中の子のマージンが親の外へはみ出す（相殺される）こともなくなります。<code>overflow: hidden</code> でも BFC になりますが、はみ出した影や中身が切れてしまうので、囲むためだけなら <code>flow-root</code> が副作用のない書き方です。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能。Chrome 58・Firefox 53・Safari 13 から）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/display",
      viz: { concept: "none" },
      challenge: {
        starterHTML: CARD_HTML,
        starterCSS: CARD_CSS(""),
        task: "カードの中で float した写真が、カードの枠の下にはみ出しています。カードが写真まで囲むようにしよう。",
        snapshot: { props: ["display"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "insideContainer", id: "photo", containerId: "card" },
                  { kind: "offset", a: "photo", b: "card", edgeA: "bottom", edgeB: "bottom", min: 12, max: 14 },
                ],
                message: "写真がカードの枠からはみ出しています（float した要素は、親の高さに含まれません）",
              },
              {
                kind: "computedEquals",
                id: "card",
                prop: "display",
                value: "flow-root",
                message: "overflow: hidden や高さの指定、clearfix でも囲めますが、display: flow-root を使いましょう（影や中身が切れたり、文章が増えて崩れたりせず、余計な指定も要りません）",
              },
            ],
          },
        ],
        hints: ["カード自身を、中の float を囲む新しいブロック整形コンテキストにします", ".card { display: flow-root; }"],
        solution: CARD_CSS("  display: flow-root;\n"),
      },
    },
    {
      id: "clear-float",
      title: "float の下から始める: clear",
      explanation:
        "<p>float した写真の横には、後ろに続く文章や見出しが回り込みます。説明が短いと、次の章の見出しまで写真の横に入り込んでしまいます。</p><p><code>clear</code> を指定した要素は、<b>前にある float の下まで押し下げられて</b>から始まります。<code>clear: left</code> は左の float、<code>clear: right</code> は右の float、<code>clear: both</code> は両方の下へ。書字方向に合わせた <code>inline-start</code> / <code>inline-end</code> もあります。余白で押し下げるのと違い、写真の大きさが変わっても、ちょうど写真の下（マージンの外側）から始まります。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/clear",
      viz: { concept: "none" },
      challenge: {
        starterHTML: POST_HTML,
        starterCSS: POST_CSS(""),
        task: "次の章の見出し「淹れ方」が、float した写真の横に回り込んでいます。見出しを写真の下から始めよう。",
        snapshot: { props: ["clear"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "offset", a: "photo", b: "next", edgeA: "bottom", edgeB: "top", min: 0 },
                  { kind: "offset", a: "post", b: "next", edgeA: "left", edgeB: "left", min: -1, max: 1 },
                ],
                message: "見出し「淹れ方」が、写真の横に回り込んでいます（写真の下から始めます）",
              },
              {
                kind: "computedMatches",
                id: "next",
                prop: "clear",
                pattern: "^(?:both|left|inline-start)$",
                message: "余白で押し下げるのではなく、clear で float の下へ送りましょう（写真の大きさが変わっても、ちょうど下から始まります）",
              },
            ],
          },
        ],
        hints: ["見出し（.next）を、前にある左の float の下まで押し下げます", ".next { clear: both; }"],
        solution: POST_CSS("  clear: both;\n"),
      },
    },
    {
      id: "display-contents",
      title: "入れ物の箱をなくす: display: contents",
      explanation:
        "<p>グリッドやフレックスに並ぶのは<b>直下の子</b>だけです。おすすめのカード 2 枚が <code>&lt;div class=\"group\"&gt;</code> で包まれていると、グリッドから見えるのは入れ物の 1 つだけで、中の 2 枚は 1 マスの中に縦に積まれます。</p><p><code>display: contents</code> を指定した要素は、<b>自分の箱を作らず</b>、子の箱だけが親の中に置かれます。入れ物が消えたのと同じになるので、中のカードがそのままグリッドのアイテムとして並びます（入れ物の背景や枠線、余白も表示されなくなります）。</p><p>入れ物の div のような使い方は Chrome 65・Firefox 37・Safari 11.1 から使えます。ただし、ボタンなどのフォーカスできる要素や特殊な要素に付けたときのふるまいがブラウザでそろっておらず（一部のブラウザでは、要素が読み上げソフトから消える問題も）、機能全体としては Baseline に入っていません（2026 年 10 月時点）。意味を持たない <code>div</code> だけに使いましょう。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/display",
      viz: { concept: "none" },
      challenge: {
        starterHTML: GRID_HTML,
        starterCSS: GRID_CSS(""),
        task: "4 列のグリッドで、おすすめのカード 2 枚が入れ物（.group）ごと 1 マスに入り、縦に積まれています。入れ物の箱をなくして、4 枚のカードを 1 行に並べよう。",
        snapshot: { props: ["display"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "alignedEdge", ids: ["c1", "c2", "c3", "c4"], edge: "top" },
                  { kind: "order", ids: ["c1", "c2", "c3", "c4"], axis: "x" },
                  sameWidth("c1", "c2"),
                  sameWidth("c1", "c4"),
                ],
                message: "おすすめの 2 枚が 1 マスの中に積まれています（入れ物の .group が、1 つのグリッドアイテムになっています）",
              },
              {
                kind: "computedEquals",
                id: "group",
                prop: "display",
                value: "contents",
                message: "subgrid などでも並べられますが、ここでは display: contents で入れ物の箱をなくしましょう",
              },
            ],
          },
        ],
        hints: ["入れ物（.group）が自分の箱を作らず、子だけがグリッドに並ぶようにします", ".group { display: contents; }"],
        solution: GRID_CSS(".group {\n  display: contents;\n}\n"),
      },
    },
  ],
};
