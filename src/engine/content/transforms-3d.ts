import type { SnapshotRequest } from "../validate/snapshot.js";
import type { Track } from "./types.js";

// The transform-3d visualizer rebuilds the scene from these computed values:
// each child of the container becomes a plane, placed with its own and the
// container's transform matrices. A projected (3D-transformed) element's rect is
// the bounding box of what the browser draws, so perspective and preserve-3d are
// also checked by geometry; backface-visibility changes only paint, so that one
// reads the computed value.
const SPACE_PROPS: SnapshotRequest = {
  props: ["transform", "transform-style", "transform-origin", "perspective", "backface-visibility", "width", "height"],
};

const STAGE_HTML = '<div data-id="stage" class="stage"><div data-id="card" class="card">カード</div></div>';

const STAGE_CSS = (extra: string): string =>
  `.stage {\n  display: grid;\n  place-items: center;\n  width: 260px;\n  height: 180px;\n  background: #eef1f8;\n${extra}}\n.card {\n  display: grid;\n  place-items: center;\n  width: 160px;\n  height: 100px;\n  color: #fff;\n  background: #2f5fd0;\n  border-radius: 8px;\n  transform: rotateY(50deg);\n}\n`;

const CUBE_HTML =
  '<div data-id="scene" class="scene"><div data-id="cube" class="cube"><div data-id="front" class="face front">前</div><div data-id="right" class="face right">右</div><div data-id="top" class="face top">上</div></div></div>';

const CUBE_CSS = (extra: string): string =>
  `.scene {\n  display: grid;\n  place-items: center;\n  width: 240px;\n  height: 200px;\n  perspective: 600px;\n}\n.cube {\n  position: relative;\n  width: 100px;\n  height: 100px;\n  transform: rotateX(-25deg) rotateY(-35deg);\n${extra}}\n.face {\n  position: absolute;\n  inset: 0;\n  display: grid;\n  place-items: center;\n  font-size: 24px;\n  color: #fff;\n  opacity: 0.9;\n}\n.front {\n  background: #2f5fd0;\n  transform: translateZ(50px);\n}\n.right {\n  background: #2f9d5b;\n  transform: rotateY(90deg) translateZ(50px);\n}\n.top {\n  background: #b9791b;\n  transform: rotateX(90deg) translateZ(50px);\n}\n`;

// The checkbox flips the card through `:has(:checked)`, so the learner can turn
// it over in the preview without any script.
const FLIP_HTML =
  '<label class="toggle"><input type="checkbox"> 裏返す</label><div data-id="scene" class="scene"><div data-id="card" class="card"><div data-id="front" class="face front">表</div><div data-id="back" class="face back">裏</div></div></div>';

const FLIP_CSS = (extra: string): string =>
  `.scene {\n  width: 200px;\n  height: 120px;\n  margin-top: 12px;\n  perspective: 600px;\n}\n.card {\n  position: relative;\n  height: 100%;\n  transform-style: preserve-3d;\n  transition: transform 0.6s;\n}\n.toggle:has(:checked) + .scene .card {\n  transform: rotateY(180deg);\n}\n.face {\n  position: absolute;\n  inset: 0;\n  display: grid;\n  place-items: center;\n  font-size: 28px;\n  color: #fff;\n  border-radius: 10px;\n${extra}}\n.front {\n  background: #2f5fd0;\n}\n.back {\n  background: #2f9d5b;\n  transform: rotateY(180deg);\n}\n`;

export const transforms3dTrack: Track = {
  id: "transforms-3d",
  title: "3D 変形",
  summary: "perspective・preserve-3d・backface-visibility で、奥行きのある立体を組み立てる。",
  emoji: "🧊",
  lessons: [
    {
      id: "transform-perspective",
      title: "奥行きをつける: perspective",
      explanation:
        "<p><code>rotateY()</code> で要素を縦の軸まわりに回しても、そのままでは<b>横に縮んで見えるだけ</b>で、奥行きは感じられません。遠近法を使わずに描いているからです。</p><p>親に <code>perspective: 400px</code> を指定すると、<b>画面から 400px 手前にある目</b>から見た遠近法で描かれ、手前に来た辺は大きく、奥へ行った辺は小さくなります。値が小さいほど目が近づき、ゆがみが強くなります。要素自身に <code>transform: perspective(400px) rotateY(50deg)</code> と書く方法もありますが、親に書くと<b>子どうしで同じ視点（消失点）を共有</b>できます。</p><p>3D ビューの黒い点が目の位置で、目からカードの角を通る視線が画面（ステージ）と交わるところに、プレビューのカードが描かれます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/perspective",
      viz: { concept: "transform-3d", containerId: "stage", subjectId: "card" },
      challenge: {
        starterHTML: STAGE_HTML,
        starterCSS: STAGE_CSS(""),
        task: "ステージ（.stage）に perspective: 400px を指定して、縦の軸まわりに回したカードに奥行きをつけよう。手前の辺が大きく、奥の辺が小さく見えれば成功です。",
        snapshot: SPACE_PROPS,
        validators: [
          { kind: "computedEquals", id: "stage", prop: "perspective", value: "400px", message: ".stage に perspective: 400px を指定しましょう" },
          {
            kind: "sizeApprox",
            id: "card",
            h: 118,
            message: "カードに遠近感が出ていません（手前の辺が大きくなると、見た目の高さが 100px から約 118px に伸びます）",
          },
        ],
        hints: ["遠近法の強さは、回転させる要素の親に perspective で指定します", "perspective: 400px;"],
        solution: STAGE_CSS("  perspective: 400px;\n"),
      },
    },
    {
      id: "transform-preserve-3d",
      title: "立体を組み立てる: transform-style: preserve-3d",
      explanation:
        "<p>立方体の面を <code>translateZ()</code> や <code>rotateY()</code> で配置しても、親の <code>transform-style</code> が初期値の <code>flat</code> のままだと、子は<b>親の平面に押しつぶされて</b>描かれます。横や上の面は、真横から見た細い線になってしまいます。</p><p>親（ここでは .cube）に <code>transform-style: preserve-3d</code> を指定すると、子が<b>同じ 3D 空間</b>に置かれ、面が組み合わさって立体になります。継承されないので、入れ子が深いときは途中の要素にも指定します。</p><p>注意: 同じ要素に <code>opacity</code>（1 未満）・<code>filter</code>・<code>clip-path</code>・<code>mask-image</code>・<code>mix-blend-mode</code>・<code>overflow: hidden</code> などがあると、preserve-3d と書いても平面に戻されます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/transform-style",
      viz: { concept: "transform-3d", containerId: "cube" },
      challenge: {
        starterHTML: CUBE_HTML,
        starterCSS: CUBE_CSS(""),
        task: "前・右・上の 3 つの面が立方体として組み合わさるように、.cube の子を同じ 3D 空間に置こう。",
        snapshot: SPACE_PROPS,
        validators: [
          { kind: "computedEquals", id: "cube", prop: "transform-style", value: "preserve-3d", message: ".cube に transform-style: preserve-3d を指定しましょう" },
          {
            // The drawn size of the side faces: edge-on lines while flattened.
            kind: "allOf",
            of: [
              { kind: "sizeApprox", id: "right", w: 58, tol: 3 },
              { kind: "sizeApprox", id: "top", h: 51, tol: 3 },
            ],
            message: "右と上の面が平面に押しつぶされたままです（.cube に opacity や filter などがあると preserve-3d が効きません）",
          },
        ],
        hints: ["子を 3D 空間に置くかどうかは、親の transform-style で決まります", "transform-style: preserve-3d;"],
        solution: CUBE_CSS("  transform-style: preserve-3d;\n"),
      },
    },
    {
      id: "transform-backface",
      title: "裏側を隠す: backface-visibility",
      explanation:
        "<p>要素は<b>裏から見ても</b>、鏡に映したように反転して描かれます。表と裏の 2 枚を背中合わせに重ねたカードでは、こちらに背を向けている面が透けたり、手前に描かれたりしてしまいます。</p><p>両方の面に <code>backface-visibility: hidden</code> を指定すると、<b>背を向けている面は描かれなく</b>なり、こちらを向いている面だけが見えます。カードを <code>rotateY(180deg)</code> で裏返すと、表と裏がきれいに入れ替わります。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能。Safari は 15.4 から接頭辞なしで利用可）。プレビューの「裏返す」を付け外しすると、カードが回転します。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/backface-visibility",
      viz: { concept: "transform-3d", containerId: "card" },
      challenge: {
        starterHTML: FLIP_HTML,
        starterCSS: FLIP_CSS(""),
        task: "表（.front）と裏（.back）の両方で、こちらに背を向けている面が描かれないようにしよう。「裏返す」を付け外しして、表と裏がきれいに入れ替われば成功です。",
        snapshot: SPACE_PROPS,
        validators: [
          { kind: "computedEquals", id: "front", prop: "backface-visibility", value: "hidden", message: "表の面（.front）にも backface-visibility: hidden を指定しましょう" },
          { kind: "computedEquals", id: "back", prop: "backface-visibility", value: "hidden", message: "裏の面（.back）に backface-visibility: hidden を指定しましょう" },
        ],
        hints: ["2 枚の面に共通のクラス .face に指定すると、両方に効きます", "backface-visibility: hidden;"],
        solution: FLIP_CSS("  backface-visibility: hidden;\n"),
      },
    },
  ],
};
