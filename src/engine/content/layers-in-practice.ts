import type { ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Cascade layers are judged by who wins: the computed colour, padding or
// display of each element, including the ones the fix must leave alone. The
// same results can be reached by stepping around the layers (moving a rule out
// of its layer, or reaching for !important), so each lesson also reads the
// source for the layer structure it teaches, with a reason when it is missing.

const WHITE = "rgb(255, 255, 255)";
const SLATE = "rgb(92, 102, 128)";

const noImportant = (message: string): ValidatorSpec => ({
  kind: "sourceMatches",
  pattern: "^(?![\\s\\S]*!\\s*important)",
  message,
});

const LINKS_HTML =
  '<p class="cta"><a data-id="btn" class="btn" href="#">申し込む</a> <a data-id="link" href="#">くわしく見る</a></p>';

const LINKS_CSS = (legacy: string): string =>
  `@layer base, components;\n@layer components {\n  .btn {\n    display: inline-block;\n    padding: 8px 16px;\n    border-radius: 999px;\n    background: #2f5fd0;\n    color: #fff;\n    text-decoration: none;\n  }\n}\n/* 古いページから持ってきた CSS */\n${legacy}`;

const LEGACY = "a {\n  color: #5c6680;\n}\n";

const NOTE_HTML = '<p data-id="note" class="note">今週は、土曜日も営業します。</p>';

const NOTE_CSS = (top: string): string =>
  `${top}/* components.css */\n@layer components {\n  .note {\n    padding: 8px 12px;\n    border-left: 4px solid #2f5fd0;\n    background: #eef1f8;\n  }\n}\n/* reset.css */\n@layer reset {\n  * {\n    margin: 0;\n    padding: 0;\n    border: 0;\n    background: none;\n  }\n}\n`;

const TOAST_HTML =
  '<div data-id="saved" class="toast" hidden>保存しました</div><div data-id="error" class="toast">通信できませんでした</div>';

const TOAST_CSS = (hidden: string): string =>
  `@layer reset, components;\n@layer reset {\n  /* hidden 属性の付いた要素は表示しない */\n  [hidden] {\n    display: none${hidden};\n  }\n}\n@layer components {\n  .toast {\n    display: flex;\n    gap: 8px;\n    margin-bottom: 8px;\n    padding: 8px 12px;\n    border-radius: 8px;\n    background: #18203a;\n    color: #fff;\n  }\n}\n`;

export const layersInPracticeTrack: Track = {
  id: "layers-in-practice",
  title: "レイヤーの応用（レイヤーの外・順番の宣言・!important）",
  summary: "レイヤーの外のスタイルがどのレイヤーにも勝つことを知って古い CSS をレイヤーに入れ、レイヤーの順番を先頭で宣言し、!important でレイヤーの順番が逆になることを使って hidden を必ず効かせる。",
  emoji: "🧅",
  lessons: [
    {
      id: "unlayered-wins",
      title: "レイヤーの外がいちばん強い: 古い CSS をレイヤーに入れる",
      explanation:
        "<p>どのレイヤーにも入っていないスタイルは、詳細度に関係なく、<b>すべてのレイヤーのスタイルに勝ちます</b>。古いページから持ってきた <code>a { color: … }</code> のような弱いセレクタでも、レイヤーの外にあれば、components レイヤーの <code>.btn</code> の白い文字を上書きしてしまいます。</p><p>レイヤーを使い始めたら、古い CSS も <code>@layer base { … }</code> のようにいちばん弱いレイヤーに入れます。そうすれば、宣言した順番（base → components）どおりに、ボタンの白い文字が勝ちます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/At-rules/@layer",
      viz: { concept: "none" },
      challenge: {
        starterHTML: LINKS_HTML,
        starterCSS: LINKS_CSS(LEGACY),
        task: "「申し込む」ボタンの文字が、レイヤーの外の古い CSS（a の色）で灰色になっています。古い CSS を base レイヤーに入れて、ボタンの白い文字を出そう（ふつうのリンクは灰色のまま）。",
        snapshot: { props: ["color"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "computedEquals",
                id: "btn",
                prop: "color",
                value: WHITE,
                message: "ボタンの文字が白くなっていません（レイヤーの外の a の色が、どのレイヤーのスタイルにも勝っています）",
              },
              {
                kind: "computedEquals",
                id: "link",
                prop: "color",
                value: SLATE,
                message: "ふつうのリンクの色が変わっています（古い CSS は消さずに、レイヤーに入れます）",
              },
              noImportant("!important ではなく、古い CSS をレイヤーに入れて解決しましょう"),
              {
                kind: "allOf",
                of: [
                  { kind: "sourceMatches", pattern: "@layer\\s+[\\w-]+\\s*\\{\\s*(?:/\\*[^*]*\\*/\\s*)?a\\s*\\{" },
                  { kind: "sourceMatches", pattern: "@layer\\s+components\\s*\\{\\s*\\.btn\\s*\\{" },
                ],
                message: "古い CSS（a の色）を @layer base { … } の中に入れましょう（.btn は components レイヤーのまま）",
              },
            ],
          },
        ],
        hints: ["レイヤーの外のスタイルは、どのレイヤーより強くなります", "@layer base { a { color: #5c6680; } }"],
        solution: LINKS_CSS("@layer base {\n  a {\n    color: #5c6680;\n  }\n}\n"),
      },
    },
    {
      id: "layer-order-statement",
      title: "レイヤーの順番は最初に書いた順: 先頭で宣言する",
      explanation:
        "<p>レイヤーの強さは、<b>そのレイヤーが最初に出てきた順番</b>で決まり、後のレイヤーほど強くなります。ファイルをつなげた結果、components が reset より先に出てくると、reset のほうが強くなり、お知らせの余白や枠線が消されてしまいます。</p><p>CSS の先頭に <code>@layer reset, components;</code> と<b>順番だけを宣言</b>しておけば、そのあとレイヤーがどの順に出てきても、宣言した順（reset → components）で強さが決まります。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/At-rules/@layer",
      viz: { concept: "none" },
      challenge: {
        starterHTML: NOTE_HTML,
        starterCSS: NOTE_CSS(""),
        task: "あとから読み込んだ reset レイヤーが、お知らせの余白・左の線・背景を消しています。ファイルの並びは変えずに、CSS の先頭でレイヤーの順番（reset → components）を宣言しよう。",
        snapshot: { props: ["padding-left", "border-left-width", "background-color"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "computedEquals", id: "note", prop: "padding-left", value: "12px" },
                  { kind: "computedEquals", id: "note", prop: "border-left-width", value: "4px" },
                  { kind: "computedEquals", id: "note", prop: "background-color", value: "rgb(238, 241, 248)" },
                ],
                message: "お知らせの余白・左の線・背景が、reset レイヤーに消されています（後に出てきたレイヤーほど強くなります）",
              },
              {
                kind: "sourceMatches",
                pattern: "^\\s*@layer\\s+reset\\s*,\\s*components\\s*;",
                message: "CSS の先頭に @layer reset, components; と順番を宣言しましょう（ファイルの並びに左右されなくなります）",
              },
            ],
          },
        ],
        hints: ["レイヤーの名前を、弱い順にカンマで並べて宣言できます", "@layer reset, components;（CSS のいちばん上に）"],
        solution: NOTE_CSS("@layer reset, components;\n\n"),
      },
    },
    {
      id: "important-reverses",
      title: "!important はレイヤーの順番が逆になる: hidden を必ず効かせる",
      explanation:
        "<p><code>!important</code> を付けた宣言どうしでは、レイヤーの強さが<b>逆になります</b>。いちばん弱い（最初に宣言した）reset レイヤーの <code>!important</code> が、後のレイヤーのふつうの宣言にも、<code>!important</code> にも勝ちます。</p><p>そのため、「hidden 属性の付いた要素は、どんなスタイルでも表示しない」のように<b>必ず効かせたい決まり</b>は、reset レイヤーに <code>!important</code> で書いておきます。上書きを防ぐための使い方で、詳細度で勝つための <code>!important</code> とは違います。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/At-rules/@layer",
      viz: { concept: "none" },
      challenge: {
        starterHTML: TOAST_HTML,
        starterCSS: TOAST_CSS(""),
        task: "hidden 属性の付いた「保存しました」の通知まで、components レイヤーの display: flex で表示されています。reset レイヤーの [hidden] を、どのレイヤーにも負けないようにしよう。",
        snapshot: { props: ["display"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "computedEquals",
                id: "saved",
                prop: "display",
                value: "none",
                message: "hidden 属性の付いた通知が表示されています（後の components レイヤーの display: flex が、reset の display: none に勝っています）",
              },
              {
                kind: "computedEquals",
                id: "error",
                prop: "display",
                value: "flex",
                message: "hidden のない通知まで消えています（hidden 属性の付いた要素だけを隠します）",
              },
              {
                kind: "sourceMatches",
                pattern: "@layer\\s+reset\\s*\\{[^}]*display\\s*:\\s*none\\s*!\\s*important",
                message: "reset レイヤーの [hidden] の display: none に !important を付けましょう（!important どうしでは、先に宣言したレイヤーが勝ちます）",
              },
            ],
          },
        ],
        hints: ["!important を付けた宣言では、先に宣言した（弱い）レイヤーのほうが勝ちます", "[hidden] { display: none !important; }（reset レイヤーの中で）"],
        solution: TOAST_CSS(" !important"),
      },
    },
  ],
};
