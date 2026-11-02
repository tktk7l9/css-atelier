import type { Track } from "./types.js";

// field-sizing is judged by the box the textarea ends up with. ::placeholder and
// ::file-selector-button style parts the sandbox cannot read directly, so the
// lessons read the declarations the learner wrote, next to what can be measured
// such as the computed border of :placeholder-shown.

const MEMO = "配送の時間帯は午前中を希望します。\n不在のときは宅配ボックスへお願いします。\nインターホンは鳴らさないでください。\n駐車場は建物の裏にあります。\n連絡は電話でお願いします。";

const AREA_HTML = `<label class="label">備考<textarea data-id="memo" class="memo">${MEMO}</textarea></label>`;

const AREA_CSS = (extra: string): string =>
  `.label {\n  display: block;\n}\n.memo {\n  display: block;\n  width: 100%;\n  margin-top: 4px;\n  padding: 8px;\n  border: 1px solid #c5cde0;\n  border-radius: 8px;\n  font: inherit;\n${extra}}\n`;

const PLACEHOLDER_HTML =
  '<label class="label">お名前<input data-id="empty" class="field" placeholder="例: 山田 花子"></label>' +
  '<label class="label">メール<input data-id="filled" class="field" placeholder="例: hanako@example.com" value="taro@example.com"></label>';

const PLACEHOLDER_CSS =
  ".label {\n  display: block;\n  margin-bottom: 8px;\n}\n.field {\n  display: block;\n  width: 100%;\n  margin-top: 4px;\n  padding: 8px;\n  border: 1px solid #c5cde0;\n  border-radius: 8px;\n  font: inherit;\n}\n";

const FILE_HTML = '<label class="label">添付ファイル<input data-id="file" class="file" type="file"></label>';

const FILE_CSS =
  ".label {\n  display: block;\n}\n.file {\n  display: block;\n  margin-top: 4px;\n  font: inherit;\n}\n";

export const formPolishTrack: Track = {
  id: "form-polish",
  title: "入力欄の仕上げ（field-sizing・::placeholder・::file-selector-button）",
  summary: "field-sizing: content でテキストエリアを中身に合わせ、::placeholder と :placeholder-shown で入力例の見た目を整え、::file-selector-button でファイル選択のボタンを整える。",
  emoji: "🖊️",
  lessons: [
    {
      id: "field-sizing-content",
      title: "中身に合わせて伸びる欄: field-sizing: content",
      explanation:
        "<p><code>&lt;textarea&gt;</code> の高さは、初期状態では行数（<code>rows</code>）で決まり、長い文章はスクロールしないと読めません。<code>field-sizing: content</code> を指定すると、欄の大きさが<b>中身に合わせて</b>決まり、入力に合わせて伸びます。これまでスクリプトで高さを計算していた処理が、1 行で済みます。</p><p>伸び続けないよう、<code>max-height</code> などで上限を決めます。上限に届くと、そこからはスクロールします。<code>&lt;input&gt;</code> にも効きますが、最小の幅を決めていないと、空の欄はカーソルの幅まで縮みます。初期値は <code>fixed</code> です。</p><p>Baseline 2026（2026 年 6 月から主要ブラウザの最新版で利用可: Chrome 123 / Firefox 152 / Safari 26.2 以降）。古いブラウザでは今までの高さのままなので、安心して足せます。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/field-sizing",
      viz: { concept: "none" },
      challenge: {
        starterHTML: AREA_HTML,
        starterCSS: AREA_CSS(""),
        task: "備考の欄が 2 行ぶんしかなく、5 行の文章がスクロールしないと読めません。.memo を中身に合わせた高さにして、上限は 200px にしよう。",
        snapshot: { props: ["field-sizing", "max-height"] },
        validators: [
          { kind: "computedEquals", id: "memo", prop: "field-sizing", value: "content", message: "欄の高さが中身に合っていません（.memo に field-sizing: content を指定します）" },
          {
            kind: "anyOf",
            of: [
              { kind: "computedEquals", id: "memo", prop: "max-height", value: "200px", message: "" },
              { kind: "computedEquals", id: "memo", prop: "field-sizing", value: "fixed", message: "" },
            ],
            message: "伸び続けないよう、.memo に max-height: 200px を指定しましょう",
          },
        ],
        hints: ["field-sizing の初期値は fixed です", ".memo { field-sizing: content; max-height: 200px; }"],
        solution: AREA_CSS("  field-sizing: content;\n  max-height: 200px;\n"),
      },
    },
    {
      id: "placeholder-shown",
      title: "入力例の色と、空の欄: ::placeholder と :placeholder-shown",
      explanation:
        "<p><code>::placeholder</code> は、入力例の<b>文字そのもの</b>を選ぶ擬似要素です。多くのブラウザの既定は薄い灰色なので、読みにくいときは色を濃くします。ただし濃くしすぎると、入力済みの値と見分けがつきません。背景とのコントラストは 4.5:1 以上が目安です。</p><p><code>:placeholder-shown</code> は、入力例を表示している<b>欄そのもの</b>を選ぶ擬似クラスです。つまり、まだ空の欄です。コロンの数と、選ぶものが違います。入力例はあくまで例なので、ラベルの代わりにはしません。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/::placeholder",
      viz: { concept: "none" },
      challenge: {
        starterHTML: PLACEHOLDER_HTML,
        starterCSS: PLACEHOLDER_CSS,
        task: "入力例の文字色を .field::placeholder で #5a6478 にして、空の欄（.field:placeholder-shown）だけ枠線を破線（border-style: dashed）にしよう。",
        snapshot: { props: ["border-top-style"] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "declarationEquals", selector: ".field::placeholder", prop: "color", value: "#5a6478", message: "" },
              { kind: "computedEquals", id: "empty", prop: "border-top-style", value: "dashed", message: "" },
            ],
            message: "入力例の色か、空の欄の枠線がまだです（.field::placeholder に color: #5a6478、.field:placeholder-shown に border-style: dashed）",
          },
          { kind: "computedEquals", id: "filled", prop: "border-top-style", value: "solid", message: "入力済みの欄まで破線になっています（.field ではなく .field:placeholder-shown に書きます）" },
        ],
        hints: ["文字を選ぶのは ::placeholder（コロン 2 つ）、欄を選ぶのは :placeholder-shown（コロン 1 つ）です", ".field::placeholder { color: #5a6478; }\n.field:placeholder-shown { border-style: dashed; }"],
        solution: PLACEHOLDER_CSS + ".field::placeholder {\n  color: #5a6478;\n}\n.field:placeholder-shown {\n  border-style: dashed;\n}\n",
      },
    },
    {
      id: "file-selector-button",
      title: "ファイル選択のボタン: ::file-selector-button",
      explanation:
        "<p><code>&lt;input type=\"file\"&gt;</code> のボタンは、<code>::file-selector-button</code> で選べます。これは<b>要素全体を表す擬似要素</b>なので、<code>padding</code> や <code>border</code>、<code>background</code> を書けます。</p><p>ブラウザの既定のスタイルが当たっているので、書体や色は <code>input</code> からそのまま受け継がれるとは限りません。ボタンを大きくすると、<code>input</code> の高さもそれに合わせて伸びます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能。Chrome 89・Firefox 82・Safari 14.1 から）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/::file-selector-button",
      viz: { concept: "none" },
      challenge: {
        starterHTML: FILE_HTML,
        starterCSS: FILE_CSS,
        task: "ファイルを選ぶボタンが小さくて押しにくいので、.file::file-selector-button の padding を 12px 16px にして、背景を #dbe4fb、枠線をなし（border: 0）にしよう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "sourceMatches", pattern: "\\.file::file-selector-button\\s*\\{[^}]*padding\\s*:\\s*12px 16px", message: "" },
              { kind: "sourceMatches", pattern: "\\.file::file-selector-button\\s*\\{[^}]*background(-color)?\\s*:\\s*#dbe4fb", message: "" },
              { kind: "sourceMatches", pattern: "\\.file::file-selector-button\\s*\\{[^}]*border\\s*:\\s*(0|none)\\b", message: "" },
            ],
            message: ".file::file-selector-button の中に、padding: 12px 16px・background: #dbe4fb・border: 0 を書きましょう",
          },
        ],
        hints: ["セレクタは .file::file-selector-button です", ".file::file-selector-button {\n  padding: 12px 16px;\n  border: 0;\n  background: #dbe4fb;\n}"],
        solution: FILE_CSS + ".file::file-selector-button {\n  padding: 12px 16px;\n  border: 0;\n  background: #dbe4fb;\n}\n",
      },
    },
  ],
};
