import type { Track } from "./types.js";

// ::first-letter and ::first-line are not elements, so the sandbox cannot read
// them directly, and their effect on the text depends on the font: these lessons
// read the declarations the learner wrote.

const STORY =
  "吾輩は猫である。名前はまだ無い。どこで生れたかとんと見当がつかぬ。何でも薄暗いじめじめした所でニャーニャー泣いていた事だけは記憶している。";

const PARA_HTML = `<p data-id="para" class="para">${STORY}</p>`;

const PARA_CSS =
  ".para {\n  margin: 0;\n  width: 320px;\n  font-size: 16px;\n  line-height: 1.6;\n}\n";

export const firstLetterTrack: Track = {
  id: "first-letter",
  title: "段落の始まりを飾る（::first-letter・::first-line・::selection）",
  summary: "::first-letter で 1 文字目を大きく落とし、::first-line で 1 行目だけを変え、::selection で選択した文字の色を変える。どれも書ける値が限られる擬似要素を使い分ける。",
  emoji: "🅰️",
  lessons: [
    {
      id: "first-letter-drop-cap",
      title: "1 文字目を大きく: ::first-letter",
      explanation:
        "<p><code>::first-letter</code> は、ブロックの<b>1 行目の最初の文字</b>を選ぶ擬似要素です。雑誌の冒頭のような、大きな 1 文字（ドロップキャップ）を作れます。<code>float: left</code> で文字を左へ寄せると、続きの文が横に回り込みます。</p><p>書けるのは一部のプロパティだけです。フォント・背景・margin・padding・border・<code>color</code>・<code>float</code> などが使えます。1 文字目の前に画像などがあると当てはまりません。句読点は 1 文字目と一緒に選ばれます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/::first-letter",
      viz: { concept: "none" },
      challenge: {
        starterHTML: PARA_HTML,
        starterCSS: PARA_CSS,
        task: ".para::first-letter に float: left と font-size: 3em を指定して、1 文字目を 3 倍の大きさで左に落とそう。margin-right: 4px も足して、続きの文と離そう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "sourceMatches", pattern: "::?first-letter\\s*\\{[^}]*float\\s*:\\s*(left|inline-start)", message: "" },
              { kind: "sourceMatches", pattern: "::?first-letter\\s*\\{[^}]*font-size\\s*:\\s*3em", message: "" },
              { kind: "sourceMatches", pattern: "::?first-letter\\s*\\{[^}]*margin-right\\s*:\\s*4px", message: "" },
            ],
            message: ".para::first-letter に float: left・font-size: 3em・margin-right: 4px を書きましょう",
          },
        ],
        hints: ["セレクタは .para::first-letter です", ".para::first-letter {\n  float: left;\n  margin-right: 4px;\n  font-size: 3em;\n}"],
        solution: PARA_CSS + ".para::first-letter {\n  float: left;\n  margin-right: 4px;\n  font-size: 3em;\n}\n",
      },
    },
    {
      id: "first-line",
      title: "1 行目だけ変える: ::first-line",
      explanation:
        "<p><code>::first-line</code> は、ブロックの<b>1 行目</b>を選ぶ擬似要素です。どこまでが 1 行目かは幅で変わるので、HTML に span を入れて指定するのと違い、画面の幅が変わっても 1 行目にだけ効き続けます。</p><p>こちらも書けるプロパティは限られ、フォント・背景・<code>color</code>・<code>word-spacing</code>・<code>letter-spacing</code>・<code>text-decoration</code>・<code>text-transform</code>・<code>line-height</code> などです。margin や padding は書けません。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/::first-line",
      viz: { concept: "none" },
      challenge: {
        starterHTML: PARA_HTML,
        starterCSS: PARA_CSS,
        task: ".para::first-line に font-size: 20px を指定して、1 行目だけ文字を大きくしよう。段落全体の文字を変えてはいけません。",
        snapshot: { props: ["font-size"] },
        validators: [
          { kind: "computedEquals", id: "para", prop: "font-size", value: "16px", message: "段落全体の文字が変わっています（.para ではなく .para::first-line に書きます）" },
          { kind: "sourceMatches", pattern: "::?first-line\\s*\\{[^}]*font-size\\s*:\\s*20px", message: ".para::first-line に font-size: 20px を書きましょう" },
        ],
        hints: ["セレクタは .para::first-line です", ".para::first-line { font-size: 20px; }"],
        solution: PARA_CSS + ".para::first-line {\n  font-size: 20px;\n}\n",
      },
    },
    {
      id: "selection",
      title: "選択した文字の色: ::selection",
      explanation:
        "<p><code>::selection</code> は、利用者がドラッグなどで<b>選択した部分</b>を選ぶ擬似要素です。書けるのは <code>color</code>・<code>background-color</code>・<code>text-decoration</code>・<code>text-shadow</code> などで、<code>background-image</code> は無視されます。</p><p>選択の色は利用者が設定している場合もあるので、見た目のためだけに変えるのは控えめにします（MDN もそう注意しています）。変えるなら、文字と背景のコントラストを 4.5:1 以上に保ちます。背景だけ変えると文字色との組み合わせで読めなくなることがあるので、2 つ一緒に指定します。</p><p>Chrome 1・Firefox 62・Safari 1.1 から使えます（接頭辞なし）が、MDN の Baseline には入っていません。プレビューの文を選択すると確かめられます。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/::selection",
      viz: { concept: "none" },
      challenge: {
        starterHTML: PARA_HTML,
        starterCSS: PARA_CSS,
        task: ".para::selection に background-color: #18203a と color: #fff を指定して、選択した文字を濃い紺の地に白い文字にしよう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "declarationMatches", selector: ".para::selection", prop: "background-color", pattern: "^#18203a$", message: "" },
              { kind: "declarationMatches", selector: ".para::selection", prop: "color", pattern: "^(#fff|#ffffff|white)$", message: "" },
            ],
            message: ".para::selection に background-color: #18203a と color: #fff を、2 つとも書きましょう",
          },
        ],
        hints: ["背景と文字色を一緒に指定します", ".para::selection {\n  background-color: #18203a;\n  color: #fff;\n}"],
        solution: PARA_CSS + ".para::selection {\n  background-color: #18203a;\n  color: #fff;\n}\n",
      },
    },
  ],
};
