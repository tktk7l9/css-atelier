import type { ValidatorSpec } from "../validate/primitives.js";
import { svgUri } from "./svg-uri.js";
import type { Track } from "./types.js";

// Alignment moves boxes without resizing the grid, so these lessons are judged
// by position: the play button in the centre of the thumbnail, the running
// time in its bottom-right corner, the stamps in the centre of each card. The
// aligned boxes have fixed sizes (the running time sits flush in its corner),
// so their places are exact on any machine. The stamp cards come in two sizes,
// so one padding on .card cannot centre both. Each lesson also wants its
// place-* shorthand in the CSS (padding tuned per card, longhands or auto
// margins can reach the same places), as it is what the track teaches.

const VIDEO = svgUri(
  300,
  170,
  "<rect width='300' height='170' fill='#9fd3f5'/><circle cx='232' cy='46' r='20' fill='#fff3c4'/>" +
    "<path d='M0 170V108L64 52l52 50 40-34 70 64 74-40V170Z' fill='#2f5fd0'/><path d='M0 170V136Q150 108 300 140V170Z' fill='#2f9d5b'/>",
);

const thumbHTML = (extra: string): string =>
  `<div data-id="thumb" class="thumb"><img class="photo" src="${VIDEO}" width="300" height="170" alt="山の動画"><span data-id="play" class="play">▶</span>${extra}</div>`;

const THUMB_CSS = (stacked: string, thumb: string, rest = ""): string =>
  `.thumb {\n  display: grid;\n  width: 300px;\n  border-radius: 8px;\n  overflow: hidden;\n${thumb}}\n/* ${stacked}を、同じセル（1 行目・1 列目）に重ねる */\n.thumb > * {\n  grid-area: 1 / 1;\n}\n.photo {\n  display: block;\n}\n.play {\n  width: 56px;\n  height: 56px;\n  border-radius: 50%;\n  color: #fff;\n  background: rgb(24 32 58 / 0.7);\n  font-size: 22px;\n  line-height: 56px;\n  text-align: center;\n}\n${rest}`;

const TIME_CSS = (extra: string): string =>
  `.time {\n  padding: 2px 8px;\n  border-radius: 8px 0 0 0;\n  color: #fff;\n  background: rgb(24 32 58 / 0.85);\n  font-size: 13px;\n  line-height: 20px;\n${extra}}\n`;

/** Nine stamps, the first five collected. Only the middle one carries a data-id. */
const stamps = (prefix: string): string =>
  Array.from(
    { length: 9 },
    (_, i) => `<span${i === 4 ? ` data-id="${prefix}5"` : ""} class="stamp${i < 5 ? " done" : ""}">${i < 5 ? "★" : i + 1}</span>`,
  ).join("");

const CARDS_HTML = `<div class="cards"><div data-id="wide" class="card wide">${stamps("w")}</div><div data-id="square" class="card square">${stamps("s")}</div></div>`;

const CARDS_CSS = (extra: string): string =>
  `.cards {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: flex-start;\n  gap: 12px;\n}\n.card {\n  display: grid;\n  grid-template-columns: repeat(3, 40px);\n  grid-auto-rows: 40px;\n  gap: 8px;\n  border-radius: 12px;\n  background: #eef1f8;\n${extra}}\n.wide {\n  width: 300px;\n  height: 160px;\n}\n.square {\n  width: 180px;\n  height: 180px;\n}\n.stamp {\n  border: 2px dashed #9fb2e6;\n  border-radius: 50%;\n  color: #9fb2e6;\n  font-weight: 700;\n  line-height: 36px;\n  text-align: center;\n}\n.stamp.done {\n  border-style: solid;\n  border-color: #2f5fd0;\n  color: #fff;\n  background: #2f5fd0;\n}\n`;

/** The play button sits in the centre of the thumbnail, across and down. */
const PLAY_X: ValidatorSpec = { kind: "centeredIn", id: "play", axis: "x", containerId: "thumb" };
const PLAY_Y: ValidatorSpec = { kind: "centeredIn", id: "play", axis: "y", containerId: "thumb" };

/** The middle stamp of both cards is in the centre of its card along one axis. */
const stampsCentred = (axis: "x" | "y", message: string): ValidatorSpec => ({
  kind: "allOf",
  of: [
    { kind: "centeredIn", id: "w5", axis, containerId: "wide" },
    { kind: "centeredIn", id: "s5", axis, containerId: "square" },
  ],
  message,
});

export const gridAlignmentTrack: Track = {
  id: "grid-alignment",
  title: "グリッドでそろえる",
  summary: "place-items・place-self・place-content で、セルの中の位置と、トラック全体の位置をそろえる。",
  emoji: "🔲",
  lessons: [
    {
      id: "grid-place-items",
      title: "セルの中央に置く: place-items",
      explanation:
        "<p>グリッドの子は、<b>自分のセル（グリッド領域）の中で</b>位置をそろえます。横（行の方向）は <code>justify-items</code>、縦（列の方向）は <code>align-items</code> で決まり、既定の <code>normal</code> では、幅や高さを決めていない子はセルいっぱいに引き伸ばされ、決めてある子はセルの左上に置かれます。</p><p><code>place-items</code> は、この 2 つを 1 行で書く略記です。順番は <code>place-items: 縦 横</code> で、値を 1 つだけ書くと両方に効きます。<code>place-items: center</code> なら、子はセルの中央に来ます。</p><p>同じセルに 2 つの子を置くと、position を使わずに<b>重ねられます</b>（ここでは <code>grid-area: 1 / 1</code> で、写真と再生ボタンをどちらも 1 行目・1 列目に）。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/place-items",
      viz: { concept: "none" },
      challenge: {
        starterHTML: thumbHTML(""),
        starterCSS: THUMB_CSS("写真と再生ボタン", ""),
        task: "動画のサムネイルに重ねた再生ボタン（.play）が、左上の角にあります。.thumb に place-items を指定して、再生ボタンを写真のちょうど中央に置こう。",
        snapshot: { props: [] },
        validators: [
          // allOf reports only the first unmet step, so a fresh starter gets one message.
          {
            kind: "allOf",
            of: [
              { ...PLAY_X, message: "再生ボタンが、写真の横の中央にありません" },
              {
                ...PLAY_Y,
                message: "再生ボタンが、写真の縦の中央にありません（place-items は「縦 横」の順で、値を 1 つだけ書くと両方に効きます）",
              },
              { kind: "sourceMatches", pattern: "place-items", message: "place-items で、縦と横をまとめてそろえましょう" },
            ],
          },
        ],
        hints: ["place-items は「縦 横」の順です。値を 1 つだけ書くと、縦と横の両方に効きます", ".thumb { place-items: center; }"],
        solution: THUMB_CSS("写真と再生ボタン", "  place-items: center;\n"),
      },
    },
    {
      id: "grid-place-self",
      title: "1 つだけ別の位置に: place-self",
      explanation:
        "<p>親の <code>place-items</code> は、<b>子全員の既定の位置</b>を決めます。1 つの子だけ別の位置にしたいときは、その子に <code>place-self</code>（<code>align-self</code> と <code>justify-self</code> の略記）を書きます。子に書いた値は、親の <code>place-items</code> より優先されます。</p><p>値は <code>start</code>（始まり）・<code>center</code>（中央）・<code>end</code>（終わり）・<code>stretch</code>（引き伸ばす）などで、横書きでは start が上と左、end が下と右です。<code>place-self: end</code> なら縦も横も終わり側、つまり<b>右下の角</b>。<code>place-self: start end</code> なら右上です（縦が start、横が end）。</p><p>グリッドの子に使う place-self は、主要ブラウザすべてで使えます（Baseline: 広く利用可能）。絶対配置の要素にも効くようになったのは最近で、こちらは Baseline 2025（Safari は 26 から）です。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/place-self",
      viz: { concept: "none" },
      challenge: {
        starterHTML: thumbHTML('<span data-id="time" class="time">12:34</span>'),
        starterCSS: THUMB_CSS("写真・再生ボタン・再生時間", "  place-items: center;\n", TIME_CSS("")),
        task: "再生時間のラベル（.time）が、再生ボタンと重なって写真の中央にあります。再生ボタンは中央のまま、再生時間だけを写真の右下の角に置こう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "alignedEdge", ids: ["time", "thumb"], edge: "right" },
                  { kind: "alignedEdge", ids: ["time", "thumb"], edge: "bottom" },
                ],
                message: "再生時間（.time）が、写真の右下の角にありません",
              },
              {
                kind: "allOf",
                of: [PLAY_X, PLAY_Y],
                message: "再生ボタンは、写真の中央のままにしておきましょう（親の place-items: center は変えずに）",
              },
              { kind: "sourceMatches", pattern: "place-self", message: "place-self で、再生時間だけ位置を変えましょう" },
            ],
          },
        ],
        hints: ["子に place-self を書くと、親の place-items より優先されます", ".time { place-self: end; }"],
        solution: THUMB_CSS("写真・再生ボタン・再生時間", "  place-items: center;\n", TIME_CSS("  place-self: end;\n")),
      },
    },
    {
      id: "grid-place-content",
      title: "トラック全体を動かす: place-content",
      explanation:
        "<p><code>place-items</code> と <code>place-self</code> が動かすのは、<b>セルの中での子の位置</b>でした。列や行（トラック）の大きさを <code>40px</code> のように決めていて、グリッド全体がコンテナより小さいときは、<b>トラックのまとまりそのもの</b>をコンテナのどこに置くかも決められます。横は <code>justify-content</code>、縦は <code>align-content</code>、その略記が <code>place-content</code>（<code>place-content: 縦 横</code>）です。</p><p>既定ではトラックがコンテナの左上に寄り、右と下に余白が残ります。<code>place-content: center</code> なら、トラック全体がコンテナの中央に来ます。トラックの間に余白を配る <code>space-between</code> などの値もあります。名前に <b>items</b> が付くとセルの中の子、<b>content</b> が付くとトラック全体の位置、と覚えましょう。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/place-content",
      viz: { concept: "none" },
      challenge: {
        starterHTML: CARDS_HTML,
        starterCSS: CARDS_CSS(""),
        task: "スタンプカードのスタンプ（3 × 3）が、大きさの違う 2 枚のカードのどちらでも左上に寄っています。スタンプの大きさは変えずに、スタンプの並び全体をカードの中央に置こう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              stampsCentred("x", "スタンプの並びが、カードの横の中央にありません"),
              stampsCentred("y", "スタンプの並びが、カードの縦の中央にありません（place-content は「縦 横」の順で、値を 1 つだけ書くと両方に効きます）"),
              {
                kind: "sizeApprox",
                id: "w5",
                w: 40,
                h: 40,
                message: "スタンプの大きさ（40px）が変わっています（place-items はセルの中の位置を決めるので、スタンプが中身の大きさに縮みます）",
              },
              { kind: "sourceMatches", pattern: "place-content", message: "place-content で、トラック全体の位置をそろえましょう" },
            ],
          },
        ],
        hints: ["セルの中ではなく、トラック全体の位置を決めるのは place-content です", ".card { place-content: center; }"],
        solution: CARDS_CSS("  place-content: center;\n"),
      },
    },
  ],
};
