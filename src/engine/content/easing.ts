import type { ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// An easing is judged the way the keyframes track judges a motion: the preview
// shows the same animation paused at fixed moments (a negative animation-delay),
// so a snapshot reads the same positions on every run without any script.

const framesHtml = (times: readonly string[]): string =>
  times
    .map(
      (t, i) =>
        `<div class="frame f${i + 1}"><span class="time">${t} 秒</span><div data-id="l${i + 1}" class="lane"><div data-id="b${i + 1}" class="ball"></div></div></div>`,
    )
    .join("");

const framesCss = (lesson: string, times: readonly string[]): string =>
  "@keyframes slide {\n  from {\n    translate: 0;\n  }\n  to {\n    translate: 200px;\n  }\n}\n" +
  lesson +
  ".frame {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-top: 8px;\n}\n.time {\n  width: 52px;\n  font-size: 12px;\n  text-align: right;\n}\n.lane {\n  width: 232px;\n  border-radius: 16px;\n  background: #eef1f8;\n}\n.ball {\n  width: 32px;\n  height: 32px;\n  border-radius: 50%;\n  background: #2f5fd0;\n}\n" +
  "/* プレビュー用: 同じアニメーションを決まった時刻で止めたコマ */\n" +
  ".frame .ball {\n  animation-play-state: paused;\n}\n" +
  times.map((t, i) => `.f${i + 1} .ball {\n  animation-delay: -${t}s;\n}\n`).join("");

const ballRule = (animation: string): string => `.ball {\n  animation: ${animation};\n}\n`;

/** Ball `n` sits between `min` and `max` px from the start of its lane. */
const within = (n: number, min: number, max: number): ValidatorSpec => ({
  kind: "offset",
  a: `l${n}`,
  b: `b${n}`,
  edgeA: "left",
  edgeB: "left",
  min,
  max,
  message: "",
});

const at = (n: number, px: number): ValidatorSpec => within(n, px - 2, px + 2);

const BEZIER_TIMES = ["1", "2", "3"];
const LINEAR_TIMES = ["1", "2", "3"];
const ALTERNATE_TIMES = ["1.5", "2.5", "3.5"];

export const easingTrack: Track = {
  id: "easing",
  title: "動きの緩急（cubic-bezier()・linear()・animation-direction）",
  summary: "cubic-bezier() で速さの変化を自分で決め、linear() で折れ線の点を並べて弾む動きを作り、animation-direction: alternate で行って戻る動きにする。",
  emoji: "🏓",
  lessons: [
    {
      id: "cubic-bezier",
      title: "速さの変化を描く: cubic-bezier()",
      explanation:
        "<p><code>ease</code> や <code>ease-out</code> のようなキーワードの動きは、<code>cubic-bezier(x1, y1, x2, y2)</code> で自分で決められます。始点 (0, 0) と終点 (1, 1) の間を結ぶ曲線で、横軸が時間、縦軸が進み具合です。4 つの数は、曲線を引っぱる 2 つの制御点の座標です。</p><p>x は 0〜1 の範囲で書きます（外れると無効です）。y は範囲の外でもよく、1 を超えると終点を行き過ぎて戻る動きになります。最初の制御点の y を大きくすると、始めが速く、後はゆっくり止まる動きになります。メニューのように、すぐ反応して静かに止まりたいものに向いています。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/easing-function/cubic-bezier",
      viz: { concept: "none" },
      challenge: {
        starterHTML: framesHtml(BEZIER_TIMES),
        starterCSS: framesCss(ballRule("slide 4s linear both"), BEZIER_TIMES),
        task: "等速で動いているボールを、cubic-bezier() で「始めが速く、後はゆっくり止まる」動きにしよう。4 秒のうち 1 秒で 150px 以上進み、3 秒の時点では 190px 以上で、200px は超えないこと。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [within(1, 150, 200), within(2, 170, 200), within(3, 190, 200)],
            message: "1 秒で 150px 以上、3 秒で 190px 以上の位置に来ていません（ease-out でも足りません。cubic-bezier(0.1, 0.9, 0.2, 1) のように、最初の制御点の y を大きくします）",
          },
        ],
        hints: ["最初の 2 つの数が、始めの速さを決める制御点です", "animation: slide 4s cubic-bezier(0.1, 0.9, 0.2, 1) both;"],
        solution: framesCss(ballRule("slide 4s cubic-bezier(0.1, 0.9, 0.2, 1) both"), BEZIER_TIMES),
      },
    },
    {
      id: "linear-easing",
      title: "折れ線で弾ませる: linear()",
      explanation:
        "<p><code>linear()</code> 関数は、進み具合の点を並べて、その間を直線でつなぐイージングです（キーワードの <code>linear</code> とは別物です）。<code>0</code> が始点、<code>1</code> が終点で、1 を超える値も書けます。何も書かないと点は等間隔に置かれ、<code>0.7 50%</code> のように割合を添えると、その時点でその値になります。</p><p>曲線では表せない動きも、点を増やせば近づけられます。一度着いて少し戻り、また着く動きなら <code>linear(0, 1 25%, 0.7 50%, 1 75%)</code> です。キーフレームを増やさず、タイミングの指定だけで書けます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/easing-function/linear",
      viz: { concept: "none" },
      challenge: {
        starterHTML: framesHtml(LINEAR_TIMES),
        starterCSS: framesCss(ballRule("slide 4s linear both"), LINEAR_TIMES),
        task: "ボールが 1 秒で右端（200px）に着き、2 秒で 140px まで戻り、3 秒で右端にまた着くよう、linear() で動きを書こう（4 秒のアニメーションなので、1 秒は 25% です）。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [at(1, 200), at(2, 140), at(3, 200)],
            message: "1 秒で 200px、2 秒で 140px、3 秒で 200px になっていません（200px の 70% が 140px なので、linear(0, 1 25%, 0.7 50%, 1 75%)）",
          },
        ],
        hints: ["1 は右端、0.7 は 140px の位置です", "animation: slide 4s linear(0, 1 25%, 0.7 50%, 1 75%) both;"],
        solution: framesCss(ballRule("slide 4s linear(0, 1 25%, 0.7 50%, 1 75%) both"), LINEAR_TIMES),
      },
    },
    {
      id: "animation-direction",
      title: "行って戻る: animation-direction: alternate",
      explanation:
        "<p>繰り返すアニメーションは、ふつう 1 回終わるたびに<b>始めの状態へ飛んで</b>やり直します。<code>animation-direction: alternate</code> にすると、奇数回目は順方向、偶数回目は逆方向に再生され、行って戻る動きになります。</p><p>値はほかに、毎回逆から再生する <code>reverse</code>、逆方向から始める <code>alternate-reverse</code> があります。逆方向のときはイージングも逆になります（<code>ease-in</code> は <code>ease-out</code> になります）。<code>animation</code> の一括指定の中にも書けます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/animation-direction",
      viz: { concept: "none" },
      challenge: {
        starterHTML: framesHtml(ALTERNATE_TIMES),
        starterCSS: framesCss(ballRule("slide 2s linear infinite"), ALTERNATE_TIMES),
        task: "ボールは 2 秒ごとに左端へ飛んで戻っています。alternate を足して、行って戻る動きにしよう。1.5 秒で 150px、2.5 秒で（戻る途中の）150px、3.5 秒で 50px なら成功です。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [at(1, 150), at(2, 150), at(3, 50)],
            message: "2 秒を過ぎても戻っていません（animation に alternate を足します: animation: slide 2s linear infinite alternate）",
          },
        ],
        hints: ["1 回目は順方向、2 回目は逆方向に再生します", "animation: slide 2s linear infinite alternate;"],
        solution: framesCss(ballRule("slide 2s linear infinite alternate"), ALTERNATE_TIMES),
      },
    },
  ],
};
