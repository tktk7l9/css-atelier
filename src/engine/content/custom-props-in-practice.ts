import type { Track } from "./types.js";

// Custom properties are judged by the values they end up producing (computed
// colours, and for the spacing scale the measured padding and gaps) on the
// elements that should change and on the ones that should not. Because the
// same look can be written without variables, each lesson also reads the
// source for the variable being set where the lesson asks, with a reason.

const BLUE = "rgb(47, 95, 208)";
const RED = "rgb(198, 40, 40)";
const OCHRE = "rgb(185, 121, 27)";

const BUTTONS_HTML =
  '<div class="actions"><button data-id="save" class="btn" type="button">保存する</button><button data-id="del" class="btn is-danger" type="button">削除する</button></div>';

const BUTTONS_CSS = (danger: string): string =>
  `.actions {\n  display: flex;\n  gap: 8px;\n}\n/* ボタンの色は --btn-color ひとつで決める */\n.btn {\n  --btn-color: #2f5fd0;\n  padding: 6px 14px;\n  border: 2px solid var(--btn-color);\n  border-radius: 999px;\n  background: #fff;\n  color: var(--btn-color);\n  font: inherit;\n}\n/* 危険な操作のボタン */\n.btn.is-danger {\n${danger}}\n`;

const THEMES_HTML =
  '<section class="news"><article data-id="a1" class="card">春の講座</article></section>' +
  '<section class="news warm"><article data-id="b1" class="card">夏の特集</article><article data-id="b2" class="card">秋の特集</article></section>';

const THEMES_CSS = (extra: string): string =>
  `:root {\n  --accent: #2f5fd0;\n}\n.news {\n  display: flex;\n  gap: 8px;\n  margin-bottom: 8px;\n}\n.card {\n  padding: 8px 12px;\n  border-left: 4px solid var(--accent);\n  border-radius: 4px;\n  background: #f6f7fb;\n}\n${extra}`;

const SPACING_HTML =
  '<section data-id="normal" class="panel"><div data-id="n1" class="box">通常の表示</div><div data-id="n2" class="box">2 つめ</div></section>' +
  '<section data-id="compact" class="panel compact"><div data-id="c1" class="box">詰めた表示</div><div data-id="c2" class="box">2 つめ</div></section>';

const SPACING_CSS = (extra: string): string =>
  `:root {\n  --space: 8px;\n}\n.panel {\n  display: grid;\n  gap: var(--space);\n  width: 280px;\n  margin-bottom: 12px;\n  padding: calc(var(--space) * 2);\n  border-radius: 12px;\n  background: #eef1f8;\n}\n.box {\n  padding: var(--space);\n  border-radius: 8px;\n  background: #dbe4fb;\n}\n${extra}`;

export const customPropsInPracticeTrack: Track = {
  id: "custom-props-in-practice",
  title: "カスタムプロパティの応用（部品ごとの上書き・受け継ぎ・calc）",
  summary: "修飾クラスで変数だけを上書きして部品の色をまとめて変え、親に置いた変数を子に受け継がせてテーマを切り替え、calc() と組み合わせた余白の基準を 1 か所で変える。",
  emoji: "🧰",
  lessons: [
    {
      id: "custom-prop-override",
      title: "変数だけを上書きする: 修飾クラスで --btn-color を変える",
      explanation:
        "<p>部品の色を、枠線・文字色など何か所にも書くと、別の色の部品を作るたびに全部を上書きすることになります。部品のルールで <code>--btn-color</code> を決め、各プロパティを <code>var(--btn-color)</code> で書いておけば、<code>.btn.is-danger { --btn-color: #c62828; }</code> と<b>変数を 1 つ上書きするだけ</b>で、その部品の色がまとめて変わります。</p><p>カスタムプロパティは、使われる要素で値が決まります。上書きした変数は、そのボタン（と中の要素）だけに効き、ほかのボタンはそのままです。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties",
      viz: { concept: "none" },
      challenge: {
        starterHTML: BUTTONS_HTML,
        starterCSS: BUTTONS_CSS("  color: #c62828;\n"),
        task: "「削除する」ボタンは文字だけ赤くなり、枠線は青のままです。.btn.is-danger では --btn-color だけを赤（#c62828）に上書きして、文字も枠線も赤にしよう。",
        snapshot: { props: ["color", "border-top-color"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "computedEquals", id: "del", prop: "color", value: RED },
                  { kind: "computedEquals", id: "del", prop: "border-top-color", value: RED },
                ],
                message: "「削除する」ボタンの文字と枠線が、両方とも赤になっていません（色は --btn-color から取っています。変数を上書きします）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "computedEquals", id: "save", prop: "color", value: BLUE },
                  { kind: "computedEquals", id: "save", prop: "border-top-color", value: BLUE },
                ],
                message: "「保存する」ボタンの色まで変わっています（危険な操作のボタンだけを変えます）",
              },
              {
                kind: "declarationMatches",
                selector: ".btn.is-danger",
                prop: "--btn-color",
                pattern: "#c62828",
                message: ".btn.is-danger の中で、--btn-color を #c62828 に上書きしましょう（枠線と文字色を 1 つずつ書くのではなく）",
              },
            ],
          },
        ],
        hints: ["色はすべて var(--btn-color) から取っています", ".btn.is-danger { --btn-color: #c62828; }"],
        solution: BUTTONS_CSS("  --btn-color: #c62828;\n"),
      },
    },
    {
      id: "custom-prop-inherit",
      title: "親に置いて子が受け継ぐ: 区画ごとのテーマ色",
      explanation:
        "<p>カスタムプロパティは、ふつうのプロパティの <code>color</code> などと同じく<b>子に受け継がれます</b>。<code>:root</code> に置いた <code>--accent</code> はページ全体で使えますが、ある区画（<code>.warm</code>）にだけ <code>--accent: #b9791b;</code> を置くと、その中の要素はその値を受け継ぎます。</p><p>カードのルールは <code>var(--accent)</code> のまま変えずに、置く場所を変えるだけで、区画ごとにテーマ色を切り替えられます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties",
      viz: { concept: "none" },
      challenge: {
        starterHTML: THEMES_HTML,
        starterCSS: THEMES_CSS(""),
        task: "暖かい色の区画（.news.warm）の中のカードだけ、左の線を黄土色（#b9791b）にしよう。カードのルールは変えずに、区画に --accent を置きます。",
        snapshot: { props: ["border-left-color"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "computedEquals", id: "b1", prop: "border-left-color", value: OCHRE },
                  { kind: "computedEquals", id: "b2", prop: "border-left-color", value: OCHRE },
                ],
                message: "暖かい色の区画のカードの線が、黄土色になっていません（区画 .warm に --accent を置くと、中のカードが受け継ぎます）",
              },
              {
                kind: "computedEquals",
                id: "a1",
                prop: "border-left-color",
                value: BLUE,
                message: "ほかの区画のカードの色まで変わっています（.warm の中だけを変えます）",
              },
              {
                kind: "declarationMatches",
                selector: ".warm",
                prop: "--accent",
                pattern: "#b9791b",
                message: "カードのルールではなく、区画（.warm）に --accent: #b9791b を置きましょう（中の要素がまとめて受け継ぎます）",
              },
            ],
          },
        ],
        hints: ["変数は子に受け継がれます。区画のルールに --accent を書きます", ".warm { --accent: #b9791b; }"],
        solution: THEMES_CSS("/* 暖かい色の区画 */\n.warm {\n  --accent: #b9791b;\n}\n"),
      },
    },
    {
      id: "custom-prop-calc",
      title: "余白の基準を 1 か所で変える: calc(var(--space) * 2)",
      explanation:
        "<p>余白を <code>--space</code> のような基準の値から <code>calc(var(--space) * 2)</code> のように計算しておくと、<b>基準を 1 か所変えるだけ</b>で、外側の余白・内側の余白・すき間がそろって変わります。</p><p><code>var()</code> は使われる要素で値に置き換わるので、<code>.compact { --space: 4px; }</code> と区画で基準を上書きすると、その区画の中の余白だけが詰まります（パネルの外側の余白は 8px、中の箱は 4px、すき間は 4px）。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/calc",
      viz: { concept: "none" },
      challenge: {
        starterHTML: SPACING_HTML,
        starterCSS: SPACING_CSS(""),
        task: "下のパネル（.compact）だけ、余白の基準 --space を 4px にして、外側の余白・箱の中の余白・箱のすき間をまとめて詰めよう（上のパネルはそのまま）。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "offset", a: "compact", b: "c1", edgeA: "top", edgeB: "top", min: 7.5, max: 8.5 },
                  { kind: "offset", a: "c1", b: "c2", edgeA: "bottom", edgeB: "top", min: 3.5, max: 4.5 },
                ],
                message: "下のパネルの余白とすき間が詰まっていません（.compact に --space: 4px を置くと、calc(var(--space) * 2) の 8px も、gap の 4px も変わります）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "offset", a: "normal", b: "n1", edgeA: "top", edgeB: "top", min: 15.5, max: 16.5 },
                  { kind: "offset", a: "n1", b: "n2", edgeA: "bottom", edgeB: "top", min: 7.5, max: 8.5 },
                ],
                message: "上のパネルの余白まで変わっています（.compact の中だけを詰めます）",
              },
              {
                kind: "declarationMatches",
                selector: ".compact",
                prop: "--space",
                pattern: "^4px$",
                message: "padding や gap を 1 つずつ書き直すのではなく、.compact で --space を 4px に上書きしましょう",
              },
            ],
          },
        ],
        hints: ["余白はすべて --space から計算しています。区画で基準だけを上書きします", ".compact { --space: 4px; }"],
        solution: SPACING_CSS("/* 詰めた表示の区画 */\n.compact {\n  --space: 4px;\n}\n"),
      },
    },
  ],
};
