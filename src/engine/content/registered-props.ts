import type { Track } from "./types.js";

// The ring's animation is paused at a quarter of its cycle (negative delay), so
// a snapshot always reads a mid-animation frame: a registered <angle> has
// interpolated to 90deg, while an unregistered custom property animates
// discretely and still reads its start value. A checkbox lets the learner play
// the animation in the preview without any script.
const RING_HTML =
  '<label class="toggle"><input type="checkbox"> 回す</label><div data-id="ring" class="ring"></div>';

const RING_CSS = (registration: string): string =>
  `${registration}.ring {\n  width: 120px;\n  height: 120px;\n  margin-top: 12px;\n  border-radius: 50%;\n  background: conic-gradient(from var(--angle), #2f5fd0, #dbe4fb, #2f5fd0);\n  animation: spin 4s linear -1s infinite paused;\n}\n.toggle:has(:checked) + .ring {\n  animation-play-state: running;\n}\n@keyframes spin {\n  from {\n    --angle: 0deg;\n  }\n  to {\n    --angle: 360deg;\n  }\n}\n`;

export const registeredPropsTrack: Track = {
  id: "registered-props",
  title: "型付きカスタムプロパティ",
  summary: "@property で変数に型と初期値を与え、アニメーションできるようにする。",
  emoji: "🧬",
  lessons: [
    {
      id: "property-register",
      title: "変数に型を付ける: @property",
      explanation:
        "<p>ふつうのカスタムプロパティは<b>ただの文字列</b>です。<code>--space: 2em</code> と書けば、計算後も <code>2em</code> のまま残ります。</p><p><code>@property</code> で登録すると、変数に<b>型（syntax）・継承するか（inherits）・初期値（initial-value）</b>を与えられます。<code>&lt;length&gt;</code> として登録した <code>--space: 2em</code> は、ほかの長さと同じように <code>32px</code> へ計算されます。型に合わない値を代入すると無視され、初期値が使われます。</p><p><code>syntax</code> と <code>inherits</code> は必須で、<code>syntax</code> が <code>\"*\"</code> 以外なら <code>initial-value</code> も必須です。Baseline 2024（Chrome 85 / Firefox 128 / Safari 16.4 以降で利用可）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/At-rules/@property",
      viz: { concept: "none" },
      challenge: {
        starterHTML: '<div data-id="box" class="box">余白は --space</div>',
        starterCSS:
          ".box {\n  --space: 2em;\n  width: 200px;\n  padding: var(--space);\n  font-size: 16px;\n  background: #dbe4fb;\n}\n",
        task: "@property で --space を &lt;length&gt; 型（inherits: false、初期値 0px）として登録し、.box の --space が px に計算されるようにしよう（2em → 32px）。",
        snapshot: { props: ["--space"] },
        validators: [
          { kind: "sourceMatches", pattern: "@property\\s+--space\\s*\\{", message: "@property --space { … } で登録しましょう" },
          { kind: "computedEquals", id: "box", prop: "--space", value: "32px", message: "--space が 32px に計算されていません（syntax・inherits・initial-value の 3 つがそろっているか確かめましょう）" },
        ],
        hints: ["@property --space { syntax: \"<length>\"; inherits: false; initial-value: 0px; }", "3 つの記述子のどれかが欠けたり不正だったりすると、@property ごと無視されます"],
        solution:
          "@property --space {\n  syntax: \"<length>\";\n  inherits: false;\n  initial-value: 0px;\n}\n.box {\n  --space: 2em;\n  width: 200px;\n  padding: var(--space);\n  font-size: 16px;\n  background: #dbe4fb;\n}\n",
      },
    },
    {
      id: "property-animate",
      title: "変数をアニメーションさせる",
      explanation:
        "<p>型のないカスタムプロパティは、途中の値を計算できないので<b>アニメーションの真ん中でパッと切り替わる</b>だけです。グラデーションの角度を変数で回そうとしても、なめらかには回りません。</p><p><code>@property --angle { syntax: \"&lt;angle&gt;\"; … }</code> と<b>角度として登録</b>すると、ブラウザが 0deg と 360deg のあいだを補間できるようになり、<code>@keyframes</code> で変数そのものをなめらかに動かせます。</p><p>プレビューでは回転を 1/4 の位置で止めています。「回す」にチェックを入れると再生されます。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/At-rules/@property",
      viz: { concept: "none" },
      challenge: {
        starterHTML: RING_HTML,
        starterCSS: RING_CSS(""),
        task: "--angle を &lt;angle&gt; 型（inherits: false、初期値 0deg）として登録して、リングのグラデーションがなめらかに回るようにしよう。止まっている 1/4 の位置で --angle が 0deg と 360deg のあいだの値になれば成功です。",
        snapshot: { props: ["--angle"] },
        validators: [
          { kind: "sourceMatches", pattern: "@property\\s+--angle\\s*\\{", message: "@property --angle { … } で登録しましょう" },
          {
            kind: "computedMatches",
            id: "ring",
            prop: "--angle",
            // Strictly between 0deg and 360deg: only an interpolated value.
            pattern: "^(?:0\\.\\d*[1-9]\\d*|[1-9]\\d?(?:\\.\\d+)?|[12]\\d\\d(?:\\.\\d+)?|3[0-5]\\d(?:\\.\\d+)?)deg$",
            message: "--angle が途中の値になっていません（型が無いと、変数は途中でパッと切り替わるだけです）",
          },
        ],
        hints: ["@property --angle { syntax: \"<angle>\"; inherits: false; initial-value: 0deg; }", "@keyframes はそのままで大丈夫です。型が分かれば補間されます"],
        solution: RING_CSS(
          '@property --angle {\n  syntax: "<angle>";\n  inherits: false;\n  initial-value: 0deg;\n}\n',
        ),
      },
    },
  ],
};
