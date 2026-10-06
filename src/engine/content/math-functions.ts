import type { ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// clamp() and min() are taught in the units track; this one covers the newer
// stepped and trigonometric functions. round() and the circle layout are judged
// by geometry (two shelves of different widths, guide marks on the dial), so a
// hard-coded size or position does not pass; mod() is judged by the computed
// delays it produces.

const TILES = "<span></span>".repeat(7);
const SHELVES_HTML =
  `<div class="shelf wide"><div data-id="wide-tiles" class="tiles">${TILES}</div></div>` +
  `<div class="shelf narrow"><div data-id="narrow-tiles" class="tiles">${TILES}</div></div>`;

const SHELVES_CSS = (extra: string): string =>
  `.shelf {\n  margin-bottom: 12px;\n  padding: 6px 0;\n  background: #eef1f8;\n}\n.wide {\n  width: 230px;\n}\n.narrow {\n  width: 170px;\n}\n.tiles {\n  display: flex;\n  flex-wrap: wrap;\n  margin-inline: auto;\n  outline: 2px dashed #2f5fd0;\n${extra}}\n.tiles span {\n  width: 40px;\n  height: 40px;\n  background: #2f5fd0;\n  border: 2px solid #fff;\n}\n`;

const GRID_HTML =
  '<label class="toggle"><input type="checkbox"> 表示する</label><div class="grid">' +
  Array.from({ length: 8 }, (_, i) => `<div data-id="t${i + 1}" class="tile">${i + 1}</div>`).join("") +
  "</div>";

const GRID_CSS = (delay: string): string =>
  `.grid {\n  display: grid;\n  grid-template-columns: repeat(4, 50px);\n  gap: 6px;\n  margin-top: 12px;\n}\n.tile {\n  display: grid;\n  place-items: center;\n  height: 50px;\n  color: #fff;\n  background: #2f5fd0;\n  opacity: 0.15;\n  transition: opacity 0.4s;\n  transition-delay: ${delay};\n}\n.toggle:has(:checked) + .grid .tile {\n  opacity: 1;\n}\n` +
  Array.from({ length: 8 }, (_, i) => `.tile:nth-child(${i + 1}) { --i: ${i}; }\n`).join("");

const DIAL_HTML =
  '<div class="dial">' +
  Array.from(
    { length: 6 },
    (_, i) =>
      `<div class="slot"><span data-id="g${i + 1}" class="guide"></span><span data-id="d${i + 1}" class="dot">${i + 1}</span></div>`,
  ).join("") +
  "</div>";

const DIAL_CSS = (extra: string): string =>
  `.dial {\n  position: relative;\n  width: 220px;\n  height: 220px;\n  border-radius: 50%;\n  background: #eef1f8;\n}\n.slot {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n}\n.guide,\n.dot {\n  position: absolute;\n  width: 32px;\n  height: 32px;\n  margin: -16px 0 0 -16px;\n  border-radius: 50%;\n}\n/* 目印: rotate() で回してから 80px 進めた位置（このままで OK） */\n.guide {\n  border: 2px dashed #9fb2e6;\n  transform: rotate(var(--a)) translateX(80px);\n}\n.dot {\n  display: grid;\n  place-items: center;\n  color: #fff;\n  font-weight: 700;\n  background: #2f5fd0;\n${extra}}\n` +
  Array.from({ length: 6 }, (_, i) => `.slot:nth-child(${i + 1}) { --a: ${i * 60}deg; }\n`).join("");

/** Dot n must sit on guide n (both centres line up). */
const onGuide = (n: number): ValidatorSpec => ({
  kind: "allOf",
  of: [
    { kind: "alignedEdge", ids: [`d${n}`, `g${n}`], edge: "centerx" },
    { kind: "alignedEdge", ids: [`d${n}`, `g${n}`], edge: "centery" },
  ],
  message: `${n} 番の点が目印に重なっていません`,
});

export const mathFunctionsTrack: Track = {
  id: "math-functions",
  title: "CSS の数学関数",
  summary: "round()・mod()・sin()/cos() — 値を倍数に丸め、くり返し、円周に並べる。",
  emoji: "🧮",
  lessons: [
    {
      id: "math-round",
      title: "倍数にそろえる: round()",
      explanation:
        "<p><code>round(丸め方, 値, 間隔)</code> は、値を<b>間隔の倍数</b>に丸めます。丸め方は <code>nearest</code>（いちばん近い倍数・省略時）、<code>up</code>（切り上げ）、<code>down</code>（切り捨て）、<code>to-zero</code>（0 に近いほう）の 4 つです。</p><p><code>width: round(down, 100%, 40px)</code> なら、親の幅を 40px の倍数に切り捨てます。親が 230px なら 200px、170px なら 160px。40px のタイルが<b>端数なくぴったり</b>並び、<code>margin-inline: auto</code> で余りを左右に振り分けられます。</p><p>Baseline 2024（Chrome 125 / Firefox 118 / Safari 15.4 以降で利用可）。割り算の余りを返す <code>mod()</code>・<code>rem()</code> も同じ時期にそろいました。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/round",
      viz: { concept: "none" },
      challenge: {
        starterHTML: SHELVES_HTML,
        starterCSS: SHELVES_CSS(""),
        task: "幅の違う 2 つの棚で、タイルの列（.tiles）の幅を 40px の倍数に切り捨てて、タイルが余白なくぴったり並ぶようにしよう（round() を使う）。",
        snapshot: { props: ["width"] },
        validators: [
          { kind: "sourceMatches", pattern: "round\\(\\s*down\\s*,", message: "round(down, …) で切り捨てましょう" },
          { kind: "sizeApprox", id: "wide-tiles", w: 200, message: "広い棚（230px）のタイルの列が 200px（40px × 5）になっていません" },
          { kind: "sizeApprox", id: "narrow-tiles", w: 160, message: "狭い棚（170px）のタイルの列が 160px（40px × 4）になっていません" },
        ],
        hints: ["100% は棚の幅です。round(丸め方, 値, 間隔) で、値を間隔の倍数に丸めます", "width: round(down, 100%, 40px);"],
        solution: SHELVES_CSS("  width: round(down, 100%, 40px);\n"),
      },
    },
    {
      id: "math-mod",
      title: "4 つごとにくり返す: mod()",
      explanation:
        "<p><code>mod(a, b)</code> は <b>a を b で割った余り</b>を返します。0, 1, 2, 3, 4, 5… に <code>mod(…, 4)</code> を使うと、0, 1, 2, 3, 0, 1… と<b>4 つごとに 0 へ戻る</b>値になります。</p><p>タイルの番号 <code>--i</code> から <code>calc(mod(var(--i), 4) * 0.1s)</code> を作ると、4 列のグリッドで<b>どの行も左から順に</b>現れる時間差になります。番号のままだと、下の行ほど待ち時間が長くなってしまいます。</p><p>よく似た <code>rem()</code> とは、割られる数が負のときだけ結果が違います（<code>mod()</code> は割る数の符号、<code>rem()</code> は割られる数の符号になります）。Baseline 2024（Chrome 125 / Firefox 118 / Safari 15.4 以降で利用可）。</p><p>プレビューの「表示する」を付け外しすると、時間差で現れるようすを確かめられます。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/mod",
      viz: { concept: "none" },
      challenge: {
        starterHTML: GRID_HTML,
        starterCSS: GRID_CSS("calc(var(--i) * 0.1s)"),
        task: "4 列のグリッドで、どの行のタイルも左から 0s・0.1s・0.2s・0.3s の時間差で現れるようにしよう。transition-delay の計算で、番号 --i を mod() で 4 つごとに 0 へ戻します。",
        snapshot: { props: ["transition-delay"] },
        validators: [
          { kind: "sourceMatches", pattern: "mod\\(", message: "mod() を使いましょう" },
          { kind: "computedEquals", id: "t2", prop: "transition-delay", value: "0.1s", message: "1 行目の 2 枚目が 0.1s 待つようにしましょう" },
          { kind: "computedEquals", id: "t5", prop: "transition-delay", value: "0s", message: "2 行目の 1 枚目（5 番）の待ち時間が 0s に戻っていません" },
          { kind: "computedEquals", id: "t8", prop: "transition-delay", value: "0.3s", message: "2 行目の 4 枚目（8 番）の待ち時間が 0.3s になっていません" },
        ],
        hints: ["mod(var(--i), 4) は 0, 1, 2, 3, 0, 1, 2, 3 とくり返します", "transition-delay: calc(mod(var(--i), 4) * 0.1s);"],
        solution: GRID_CSS("calc(mod(var(--i), 4) * 0.1s)"),
      },
    },
    {
      id: "math-trig",
      title: "円周に並べる: sin() と cos()",
      explanation:
        "<p><code>cos(角度)</code> と <code>sin(角度)</code> は三角関数です。半径 r の円周上で、角度 θ の点は中心から<b>横に r × cos(θ)、縦に r × sin(θ)</b> のところにあります（CSS は y 軸が下向きなので、角度は時計回りに増えます）。</p><p>中心に重ねた点を <code>translate: calc(cos(var(--a)) * 80px) calc(sin(var(--a)) * 80px)</code> でずらすと、角度 <code>--a</code> ごとに円周上へ並びます。目印のように <code>rotate()</code> で回してから進める方法もありますが、それだと中の文字まで回ってしまいます。三角関数なら位置だけを動かせます。</p><p><code>tan()</code>・<code>asin()</code>・<code>acos()</code>・<code>atan()</code>・<code>atan2()</code> もあります。主要ブラウザすべてで使えます（Baseline: 広く利用可能。Chrome 111 / Firefox 108 / Safari 15.4 以降）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/sin",
      viz: { concept: "none" },
      challenge: {
        starterHTML: DIAL_HTML,
        starterCSS: DIAL_CSS(""),
        task: "6 つの点（.dot）を、点線の目印に重ねよう。各点の角度は --a に入っています。cos() と sin() で半径 80px の円周上の位置を計算し、translate でずらします（文字は回さない）。",
        snapshot: { props: ["translate"] },
        validators: [
          { kind: "sourceMatches", pattern: "cos\\(", message: "横の位置に cos() を使いましょう" },
          { kind: "sourceMatches", pattern: "sin\\(", message: "縦の位置に sin() を使いましょう" },
          // Reports the first dot that is off its guide, not all six at once.
          { kind: "allOf", of: [1, 2, 3, 4, 5, 6].map(onGuide) },
        ],
        hints: [
          "横の位置は cos(角度) × 半径、縦の位置は sin(角度) × 半径です",
          "translate: calc(cos(var(--a)) * 80px) calc(sin(var(--a)) * 80px);",
        ],
        solution: DIAL_CSS("  translate: calc(cos(var(--a)) * 80px) calc(sin(var(--a)) * 80px);\n"),
      },
    },
  ],
};
