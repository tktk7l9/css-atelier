import type { ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// An animation is judged from three frames of it. The preview shows the same
// ball animation three times, each one paused at a fixed moment by a negative
// animation-delay (a time-lapse of the motion), so a snapshot reads the same
// positions on every run without any script: 50 / 100 / 150px for a linear
// 4s slide at 1, 2 and 3 seconds, 0 / 50 / 100px for steps(4) at 0.5, 1.5 and
// 2.5 seconds, and a ball back at 0 after a 2s run without a fill mode. The
// pausing rules are more specific than `.ball`, so writing the `animation`
// shorthand there does not undo them. A checkbox plays the motion on a fourth
// ball, which no check reads (switching animation-name restarts it).

const LANE_WIDTH = 232;

const framesHtml = (times: readonly string[]): string =>
  '<label class="toggle"><input type="checkbox"> 動きを再生</label>' +
  '<div class="frame demo"><span class="time">再生</span><div class="lane"><div class="ball"></div></div></div>' +
  times
    .map(
      (t, i) =>
        `<div class="frame f${i + 1}"><span class="time">${t} 秒</span><div data-id="l${i + 1}" class="lane"><div data-id="b${i + 1}" class="ball"></div></div></div>`,
    )
    .join("");

/** The lesson's own rules, then the layout, then the rules that pause the frames. */
const framesCss = (lesson: string, times: readonly string[]): string =>
  lesson +
  `.frame {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-top: 8px;\n}\n.time {\n  width: 52px;\n  font-size: 12px;\n  text-align: right;\n}\n.lane {\n  width: ${LANE_WIDTH}px;\n  border-radius: 16px;\n  background: #eef1f8;\n}\n.ball {\n  width: 32px;\n  height: 32px;\n  border-radius: 50%;\n  background: #2f5fd0;\n}\n` +
  "/* プレビュー用: 下の 3 つは、同じアニメーションを決まった時刻で止めたコマ */\n" +
  ".f1 .ball,\n.f2 .ball,\n.f3 .ball {\n  animation-play-state: paused;\n}\n" +
  times.map((t, i) => `.f${i + 1} .ball {\n  animation-delay: -${t}s;\n}\n`).join("") +
  "/* プレビュー用: チェックを入れると、いちばん上のボールが動く */\n" +
  ".demo .ball {\n  animation-name: none;\n  background: #2f9d5b;\n}\n.toggle:has(:checked) ~ .demo .ball {\n  animation-name: slide;\n}\n";

const KEYFRAMES = "@keyframes slide {\n  from {\n    translate: 0;\n  }\n  to {\n    translate: 200px;\n  }\n}\n";

const ballRule = (animation: string): string => `.ball {\n  animation: ${animation};\n}\n`;

/** Ball `n` sits `px` (±2) from the start of its lane. */
const at = (n: number, px: number): ValidatorSpec => ({
  kind: "offset",
  a: `l${n}`,
  b: `b${n}`,
  edgeA: "left",
  edgeB: "left",
  min: px - 2,
  max: px + 2,
});

const DEFINE_TIMES = ["1", "2", "3"];
const STEP_TIMES = ["0.5", "1.5", "2.5"];
const FILL_TIMES = ["0.5", "1.5", "2.5"];

export const keyframesTrack: Track = {
  id: "keyframes",
  title: "キーフレームアニメーション",
  summary: "@keyframes で動きを定義し、steps() でコマ送りに、animation-fill-mode で終わったあとの状態を保つ。",
  emoji: "🎠",
  lessons: [
    {
      id: "keyframes-define",
      title: "動きを定義する: @keyframes",
      explanation:
        "<p>トランジションが「2 つの状態のあいだ」を動かすのに対して、<b>アニメーション</b>は <code>@keyframes</code> で動きそのものを定義し、ページを開いただけで再生できます。<code>@keyframes slide { from { … } to { … } }</code> の <code>from</code> は 0%、<code>to</code> は 100% の時点のスタイルで、<code>50% { … }</code> のように途中の時点も足せます。<code>from</code> を省くと、要素のいまのスタイルから始まります。</p><p>定義した動きは、要素の <code>animation</code> で名前を指定して使います。<code>animation: slide 4s linear infinite</code> は「slide を 4 秒かけて、一定の速さで、くり返し再生」。名前は大文字と小文字も区別されるので、<code>@keyframes</code> と同じつづりにします。</p><p>プレビューの下の 3 本は、同じアニメーションを 1 秒・2 秒・3 秒の時点で止めて並べた「コマ撮り」です（CSS の後半の「プレビュー用」のルールで止めています）。「動きを再生」にチェックを入れると、いちばん上のボールが動きます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/At-rules/@keyframes",
      viz: { concept: "none" },
      challenge: {
        starterHTML: framesHtml(DEFINE_TIMES),
        starterCSS: framesCss(ballRule("slide 4s linear infinite"), DEFINE_TIMES),
        task: ".ball には animation: slide 4s linear infinite が書いてありますが、@keyframes slide がまだありません。ボールが左端（0）から右端（200px）まで動く @keyframes slide を書こう。1 秒・2 秒・3 秒のコマで、ボールが 50px・100px・150px の位置に来れば成功です。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "offset",
                a: "l2",
                b: "b2",
                edgeA: "left",
                edgeB: "left",
                min: 10,
                message: "ボールが動いていません（@keyframes slide を書きましょう。名前は animation の slide とそろえます）",
              },
              {
                kind: "allOf",
                of: [at(1, 50), at(2, 100), at(3, 150)],
                message: "コマの位置が合っていません（1 秒で 50px、2 秒で 100px、3 秒で 150px。from で 0、to で 200px まで動かしましょう）",
              },
            ],
          },
        ],
        hints: ["@keyframes slide { from { … } to { … } } の形で、from と to に translate を書きます", "@keyframes slide { from { translate: 0; } to { translate: 200px; } }"],
        solution: framesCss(ballRule("slide 4s linear infinite") + KEYFRAMES, DEFINE_TIMES),
      },
    },
    {
      id: "keyframes-steps",
      title: "コマ送りにする: steps()",
      explanation:
        "<p><code>animation-timing-function</code>（<code>animation</code> の中にも書けます）は、時間に対して<b>どんな速さで</b>進むかを決めます。<code>linear</code> は一定の速さ、既定の <code>ease</code> はゆっくり始まって急に加速し、終わりに向けてゆっくりになります。</p><p><code>steps(4)</code> は、時間を 4 つの区間に分けて、<b>区間の終わりごとに一気に進む</b>コマ送りにします。時計の秒針や、パラパラ漫画のような絵（スプライト）の切り替えに使います。<code>steps(4)</code> は <code>steps(4, end)</code>（<code>jump-end</code>）と同じです。<code>steps(4, start)</code> は区間の始めに進むので、最初の一歩が再生と同時に起こります。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能。<code>jump-start</code> などの <code>jump-</code> の書き方は Chrome 77・Firefox 65・Safari 14 から）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/easing-function/steps",
      viz: { concept: "none" },
      challenge: {
        starterHTML: framesHtml(STEP_TIMES),
        starterCSS: framesCss(ballRule("slide 4s linear infinite") + KEYFRAMES, STEP_TIMES),
        task: "ボールがなめらかに動いています。50px ずつ、4 段階でカクッ、カクッと進むコマ送りにしよう。0.5 秒・1.5 秒・2.5 秒のコマで、ボールが 0px・50px・100px にあれば成功です。",
        snapshot: { props: ["animation-timing-function"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "anyOf",
                of: [at(1, 0), at(1, 50)],
                message: "50px ずつのコマ送りになっていません（途中の位置でも止まっています。steps(4) で 4 段階にしましょう）",
              },
              {
                ...at(1, 0),
                message: "最初の一歩が早すぎます（steps(4, start) は区間の始めで進みます。区間の終わりで進む steps(4) にしましょう）",
              },
              {
                kind: "allOf",
                of: [at(2, 50), at(3, 100)],
                message: "4 段階になっていません（0.5 秒・1.5 秒・2.5 秒のコマで、0px・50px・100px に止まるはずです）",
              },
              {
                kind: "computedMatches",
                id: "b1",
                prop: "animation-timing-function",
                pattern: "^steps\\(",
                message: "キーフレームを細かく刻んでも作れますが、ここでは timing function の steps(4) でコマ送りにしましょう",
              },
            ],
          },
        ],
        hints: ["animation の linear を、コマ送りの timing function に変えます", ".ball { animation: slide 4s steps(4) infinite; }"],
        solution: framesCss(ballRule("slide 4s steps(4) infinite") + KEYFRAMES, STEP_TIMES),
      },
    },
    {
      id: "keyframes-fill-mode",
      title: "終わった状態を保つ: animation-fill-mode",
      explanation:
        "<p>アニメーションは、<b>再生していないあいだは何のスタイルも当てません</b>（既定の <code>animation-fill-mode: none</code>）。そのため、1 回だけ再生するアニメーションが終わると、要素は<b>アニメーションの前の見た目</b>に戻ります。右へ滑り込んだボールが、終わった瞬間に左端へ戻ってしまうのはこのためです。</p><p><code>animation-fill-mode: forwards</code> を指定すると、終わったあとも<b>最後のキーフレーム</b>のスタイルを保ちます。<code>backwards</code> は開始前（<code>animation-delay</code> の待ち時間）に最初のキーフレームを当て、<code>both</code> はその両方です。<code>animation</code> の中に <code>forwards</code> と書いても同じです。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/animation-fill-mode",
      viz: { concept: "none" },
      challenge: {
        starterHTML: framesHtml(FILL_TIMES),
        starterCSS: framesCss(ballRule("slide 2s linear") + KEYFRAMES, FILL_TIMES),
        task: "ボールのアニメーションは 1 回（2 秒）で終わりますが、終わった瞬間に左端へ戻ってしまいます（2.5 秒のコマ）。終わったあとも、ボールが右端（200px）に止まったままにしよう。",
        snapshot: { props: ["animation-fill-mode"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                ...at(3, 200),
                message: "終わったあと、ボールが右端に残っていません（いまは終わった瞬間に、アニメーションの前の位置＝左端に戻っています）",
              },
              {
                kind: "allOf",
                of: [at(1, 50), at(2, 150)],
                message: "途中のコマの位置が変わっています（0.5 秒で 50px、1.5 秒で 150px のまま、終わったあとだけ右端に残しましょう）",
              },
              {
                kind: "computedMatches",
                id: "b3",
                prop: "animation-fill-mode",
                pattern: "^(?:forwards|both)$",
                message: "ボールの位置そのものを 200px にしておいても残せますが、ここでは animation-fill-mode: forwards で最後のキーフレームを保ちましょう",
              },
            ],
          },
        ],
        hints: ["終わったあとのスタイルを決めるのは animation-fill-mode です", ".ball { animation: slide 2s linear forwards; }"],
        solution: framesCss(ballRule("slide 2s linear forwards") + KEYFRAMES, FILL_TIMES),
      },
    },
  ],
};
