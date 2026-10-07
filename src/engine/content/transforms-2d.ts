import type { ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// A transformed element's rect is the bounding box of what the browser draws,
// so these lessons are judged by geometry: the needle turned about its foot
// lies along the gauge's radius, a sticker that is both tilted and enlarged
// has a bigger bounding box than one that is only enlarged, and the labels
// pulled back by half their own size sit in the centre of the photos. The
// boxes have fixed sizes, and the rotation and the scale are exact, so the
// boxes are the same on any machine. The two labels have different lengths,
// so a margin tuned for one label cannot centre both.

const GAUGE_HTML =
  '<div data-id="gauge" class="gauge"><span class="mark min">0</span><span class="mark max">MAX</span><div data-id="needle" class="needle"></div><div data-id="hub" class="hub"></div></div>';

const GAUGE_CSS = (extra: string): string =>
  `.gauge {\n  position: relative;\n  width: 200px;\n  height: 100px;\n  margin: 16px;\n  border-radius: 100px 100px 0 0;\n  background: conic-gradient(from -90deg at 50% 100%, #9fe0b8, #ffe9a3, #ffb4a8 50%, transparent 0);\n}\n.mark {\n  position: absolute;\n  top: 104px;\n  color: #4a5578;\n  font-size: 12px;\n}\n.min {\n  left: 0;\n}\n.max {\n  right: 0;\n}\n/* 針: 下端を中心の丸に合わせて立て、90 度回して右端の MAX を指す */\n.needle {\n  position: absolute;\n  left: 97px;\n  bottom: 0;\n  width: 6px;\n  height: 100px;\n  border-radius: 3px;\n  background: #18203a;\n  transform: rotate(90deg);\n${extra}}\n.hub {\n  position: absolute;\n  left: 92px;\n  bottom: -8px;\n  width: 16px;\n  height: 16px;\n  border-radius: 50%;\n  background: #18203a;\n}\n`;

const STICKERS_HTML =
  '<div class="board"><div data-id="s1" class="sticker">CSS</div><div data-id="s2" class="sticker picked">HTML</div><div data-id="s3" class="sticker">JS</div></div>';

const STICKERS_CSS = (picked: string): string =>
  `.board {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 24px;\n  padding: 24px;\n}\n.sticker {\n  width: 100px;\n  height: 60px;\n  border-radius: 10px;\n  color: #fff;\n  background: #2f5fd0;\n  font-weight: 700;\n  line-height: 60px;\n  text-align: center;\n  transform: rotate(var(--r));\n}\n.sticker:nth-child(1) {\n  --r: -6deg;\n}\n.sticker:nth-child(2) {\n  --r: 4deg;\n}\n.sticker:nth-child(3) {\n  --r: -3deg;\n}\n/* 選んだシールを 1.25 倍にする */\n.picked {\n  background: #2f9d5b;\n${picked}}\n`;

const PHOTOS_HTML =
  '<div class="photos">' +
  '<div data-id="p1" class="photo sea"><span data-id="b1" class="badge">SOLD OUT</span></div>' +
  '<div data-id="p2" class="photo forest"><span data-id="b2" class="badge">残りわずか・お早めに</span></div>' +
  "</div>";

const PHOTOS_CSS = (extra: string): string =>
  `.photos {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 16px;\n}\n.photo {\n  position: relative;\n  width: 200px;\n  height: 130px;\n  border-radius: 8px;\n}\n.sea {\n  background: linear-gradient(#9fd3f5 55%, #2f5fd0 55%);\n}\n.forest {\n  background: linear-gradient(#dbe4fb 40%, #2f9d5b 40%);\n}\n/* 写真の中央にラベルを重ねる */\n.badge {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  padding: 4px 10px;\n  border-radius: 6px;\n  color: #fff;\n  background: rgb(24 32 58 / 0.85);\n  font-size: 13px;\n  line-height: 20px;\n  white-space: nowrap;\n${extra}}\n`;

/** Both labels sit in the centre of their photos along one axis. */
const badgesCentred = (axis: "x" | "y", message: string): ValidatorSpec => ({
  kind: "allOf",
  of: [
    { kind: "centeredIn", id: "b1", axis, containerId: "p1" },
    { kind: "centeredIn", id: "b2", axis, containerId: "p2" },
  ],
  message,
});

export const transforms2dTrack: Track = {
  id: "transforms-2d",
  title: "変形の中心と組み合わせ",
  summary: "transform-origin と、rotate・scale・translate のプロパティで、回転の中心や変形の組み合わせを思いどおりに。",
  emoji: "🎡",
  lessons: [
    {
      id: "transform-origin",
      title: "回転の中心を決める: transform-origin",
      explanation:
        "<p><code>rotate()</code> や <code>scale()</code> などの変形は、<b>要素の中心</b>を基準に行われます。<code>transform-origin</code> の初期値が <code>50% 50%</code>（中央）だからです。メーターの針のように<b>根元を軸に</b>回したいものを中心で回すと、針は真ん中を軸に回り、宙に浮いてしまいます。</p><p><code>transform-origin</code> には、基準にする点を横・縦の順に、キーワード（<code>left</code>・<code>center</code>・<code>right</code>／<code>top</code>・<code>center</code>・<code>bottom</code>）、パーセント、長さで書きます（キーワードどうしなら順番は自由）。<code>transform-origin: bottom center</code>（<code>50% 100%</code> と同じ）なら下端の中央が軸になり、針は根元を中心に回ります。拡大（scale）も、この点を中心に広がります。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/transform-origin",
      viz: { concept: "none" },
      challenge: {
        starterHTML: GAUGE_HTML,
        starterCSS: GAUGE_CSS(""),
        task: "メーターの針（.needle）を 90 度回して右端の MAX を指したいのに、針の真ん中を中心に回ったので、宙に浮いています。針の根元（下端の中央）を中心に回るようにしよう。",
        snapshot: { props: ["transform-origin"] },
        validators: [
          // allOf reports only the first unmet step, so a fresh starter gets one message.
          {
            kind: "allOf",
            of: [
              {
                kind: "alignedEdge",
                ids: ["needle", "hub"],
                edge: "centery",
                message: "針の根元が中心の丸（.hub）から離れて、宙に浮いています（回転の中心が、針の下端の中央になっていません）",
              },
              {
                kind: "alignedEdge",
                ids: ["needle", "gauge"],
                edge: "right",
                message: "針の先が、右端の MAX に届いていません（回転の中心を、針の下端の中央にしましょう）",
              },
              { kind: "sourceMatches", pattern: "transform-origin", message: "transform-origin で、回転の中心を決めましょう" },
            ],
          },
        ],
        hints: ["回転の中心は transform-origin で決めます。初期値は要素の中央です", ".needle { transform-origin: bottom center; }"],
        solution: GAUGE_CSS("  transform-origin: bottom center;\n"),
      },
    },
    {
      id: "transform-individual",
      title: "回転と拡大を別々に: rotate と scale",
      explanation:
        "<p><code>transform</code> は 1 つのプロパティなので、別のルールで <code>transform: scale(1.25)</code> と書くと、先に書いた <code>transform: rotate(4deg)</code> は<b>まるごと上書き</b>されて消えます。両方を効かせるには、<code>transform: rotate(4deg) scale(1.25)</code> と全部を書き直す必要があります。</p><p><code>rotate</code>・<code>scale</code>・<code>translate</code> は、変形を<b>種類ごとに別のプロパティ</b>で書けます。別のプロパティどうしは上書きし合わないので、<code>scale: 1.25</code> を足すだけで、傾き（<code>rotate</code> や <code>transform</code>）はそのまま残ります。どの順に書いても、<code>transform: translate() rotate() scale()</code> と並べたのと同じ順に組み合わさり、その後に <code>transform</code> プロパティが続きます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能。Chrome 104・Firefox 72・Safari 14.1 から）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/scale",
      viz: { concept: "none" },
      challenge: {
        starterHTML: STICKERS_HTML,
        starterCSS: STICKERS_CSS("  transform: scale(1.25);\n"),
        task: "シールはそれぞれ少し傾けてあります。選んだシール（.picked）を 1.25 倍に大きくしたら、傾きが消えてまっすぐになりました。傾きはそのままに、1.25 倍にしよう。",
        snapshot: { props: ["scale", "rotate", "transform"] },
        validators: [
          {
            kind: "allOf",
            of: [
              // The drawn boxes of a 100 × 60 sticker: tilted by -6deg and -3deg …
              {
                kind: "allOf",
                of: [
                  { kind: "sizeApprox", id: "s1", w: 106, h: 70 },
                  { kind: "sizeApprox", id: "s3", w: 103, h: 65 },
                ],
                message: "ほかのシールの大きさと傾きは、そのままにしておきましょう",
              },
              // … and tilted by 4deg, then enlarged 1.25 times (125 × 75 without the tilt).
              {
                kind: "sizeApprox",
                id: "s2",
                w: 130,
                h: 84,
                message: "選んだシール（.picked）が、傾いたまま 1.25 倍になっていません（transform: scale() が、先に書いた transform: rotate() を上書きしています）",
              },
              {
                kind: "computedEquals",
                id: "s2",
                prop: "scale",
                value: "1.25",
                message: "拡大には scale プロパティを使いましょう（transform に書くと、rotate() まで書き直すことになります）",
              },
            ],
          },
        ],
        hints: ["scale プロパティは、transform の rotate() を上書きしません", ".picked { scale: 1.25; }（transform: scale(1.25) の代わりに）"],
        solution: STICKERS_CSS("  scale: 1.25;\n"),
      },
    },
    {
      id: "transform-translate-percent",
      title: "自分の大きさの分だけ戻す: translate: -50%",
      explanation:
        "<p><code>top: 50%</code> や <code>left: 50%</code> のパーセントは、<b>基準の箱の大きさ</b>に対する割合です。そのため、要素の<b>左上の角</b>が基準の箱の中央に来ます。要素の中心を合わせるには、さらに要素自身の幅と高さの半分だけ、左上へ戻す必要があります。</p><p><code>translate</code> のパーセントは、<b>要素自身の大きさ</b>に対する割合です。<code>translate: -50% -50%</code> と書けば、文字の長さで幅が変わるラベルでも、ちょうど半分ずつ戻ります（<code>transform: translate(-50%, -50%)</code> と同じ）。変形なので、まわりのレイアウトは動きません。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能。translate プロパティは Chrome 104・Firefox 72・Safari 14.1 から）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/translate",
      viz: { concept: "none" },
      challenge: {
        starterHTML: PHOTOS_HTML,
        starterCSS: PHOTOS_CSS(""),
        task: "写真の中央に重ねたつもりのラベル（.badge）が、右下にずれています。top: 50% と left: 50% で置いたので、ラベルの左上の角が写真の中央に来ているからです。ラベルの長さが違っても、ちょうど中央に来るようにしよう。",
        snapshot: { props: ["translate"] },
        validators: [
          {
            kind: "allOf",
            of: [
              badgesCentred("x", "ラベルが、写真の横の中央からずれています（left: 50% だけでは、ラベルの左端が中央に来ます）"),
              badgesCentred("y", "ラベルが、写真の縦の中央からずれています（top: 50% だけでは、ラベルの上端が中央に来ます）"),
              { kind: "sourceMatches", pattern: "translate", message: "translate で、ラベル自身の幅と高さの半分だけ戻しましょう" },
            ],
          },
        ],
        hints: ["translate のパーセントは、要素自身の幅と高さに対する割合です", ".badge { translate: -50% -50%; }"],
        solution: PHOTOS_CSS("  translate: -50% -50%;\n"),
      },
    },
  ],
};
