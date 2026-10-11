import type { ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Inheritance is judged by computed values: the form controls' font-size and
// font-family must equal the card's (the card sets its own font, so the
// expected family is defined right here), each button's border and icon read
// the button's own color, and the article list gets the browser's marker and
// 40px indent back while the navigation keeps the reset. The last step looks
// for the keyword the lesson teaches, so copying the values by hand fails with
// a message that says why the keyword is better.

const CARD_FONT = '"Hiragino Sans", "Noto Sans JP", sans-serif';

const FORM_HTML =
  '<div data-id="card" class="card"><p data-id="text">ニュースレターに登録する</p>' +
  '<input data-id="field" type="email" placeholder="メールアドレス"><button data-id="btn" type="button">登録する</button></div>';

const FORM_CSS = (extra: string): string =>
  `.card {\n  padding: 12px;\n  border-radius: 8px;\n  background: #eef1f8;\n  font: 18px/1.6 ${CARD_FONT};\n}\n.card p {\n  margin: 0 0 8px;\n}\n.card input {\n  padding: 4px 8px;\n}\n.card button {\n  padding: 4px 12px;\n}\n${extra}`;

const PLUS = '<path d="M7 2h2v5h5v2H9v5H7V9H2V7h5z"/>';
const TRASH = '<path d="M3 3h10v2H3zM6 1h4v2H6zM4 6h8l-1 9H5z"/>';
const icon = (id: string, path: string): string =>
  `<svg data-id="${id}" class="icon" viewBox="0 0 16 16" aria-hidden="true">${path}</svg>`;

const BUTTONS_HTML =
  `<button data-id="save" class="btn" type="button">${icon("save-icon", PLUS)}追加</button> ` +
  `<button data-id="del" class="btn danger" type="button">${icon("del-icon", TRASH)}削除</button>`;

const BUTTONS_CSS = (border: string, fill: string): string =>
  `.btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 6px 12px;\n  border: ${border};\n  border-radius: 8px;\n  background: #fff;\n  color: #2f5fd0;\n  font: inherit;\n}\n.icon {\n  width: 16px;\n  height: 16px;\n  fill: ${fill};\n}\n.danger {\n  color: #d93636;\n}\n`;

const BLUE = "rgb(47, 95, 208)";
const RED = "rgb(217, 54, 54)";

const LIST_HTML =
  '<nav><ul data-id="nav" class="nav"><li data-id="n1">ホーム</li><li data-id="n2">ブログ</li></ul></nav>' +
  '<article data-id="prose" class="prose"><p>持ち物</p><ul data-id="list">' +
  '<li data-id="i1"><span data-id="i1-text">水筒</span></li><li data-id="i2"><span data-id="i2-text">雨具</span></li></ul></article>';

const LIST_CSS = (extra: string): string =>
  `/* サイト全体のリセット */\nul {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.nav {\n  display: flex;\n  gap: 16px;\n}\n.prose p {\n  margin: 8px 0 0;\n}\n${extra}`;

const computed = (id: string, prop: string, value: string): ValidatorSpec => ({ kind: "computedEquals", id, prop, value });

export const inheritanceTrack: Track = {
  id: "inheritance",
  title: "継承とキーワード（inherit・currentColor・revert）",
  summary: "inherit で親の値を受け継ぎ、currentColor で文字の色を使い回し、revert でリセット前のブラウザの見た目に戻す。",
  emoji: "👪",
  lessons: [
    {
      id: "inherit-font",
      title: "フォームの文字をそろえる: font: inherit",
      explanation:
        "<p><code>color</code> や <code>font-size</code> のような文字のプロパティは、ふつう<b>親から子へ受け継がれます（継承）</b>。ところが、<code>&lt;input&gt;</code> や <code>&lt;button&gt;</code> などのフォームの部品は、ブラウザの既定のスタイルで独自の書体と大きさ（Chrome では約 13.3px）が指定されているため、親の文字の設定を受け継ぎません。</p><p>キーワード <code>inherit</code> は「<b>親の計算後の値をそのまま使う</b>」という指定で、どのプロパティにも書けます。<code>font: inherit</code> と一括指定に書けば、書体・大きさ・太さ・行の高さをまとめて親にそろえられます。リセット用の CSS で <code>button, input { font: inherit; }</code> と書いておくのは定番です。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/inherit",
      viz: { concept: "none" },
      challenge: {
        starterHTML: FORM_HTML,
        starterCSS: FORM_CSS(""),
        task: "カードの文字は 18px なのに、入力欄とボタンだけ小さな別の書体で表示されています。入力欄とボタンにも、カードの文字の大きさと書体を受け継がせよう。",
        snapshot: { props: ["font-size", "font-family"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [computed("field", "font-size", "18px"), computed("btn", "font-size", "18px")],
                message: "入力欄とボタンの文字が 18px になっていません（フォームの部品は、親の文字の設定を受け継ぎません）",
              },
              {
                kind: "allOf",
                of: [computed("field", "font-family", CARD_FONT), computed("btn", "font-family", CARD_FONT)],
                message: "大きさだけでなく、書体（font-family）も受け継ぎましょう（font: inherit なら、まとめて親と同じになります）",
              },
              {
                kind: "sourceMatches",
                pattern: "\\binherit\\b",
                message: "値を書き写すのではなく、inherit で親から受け継ぎましょう（カードの文字を変えても、部品がついてきます）",
              },
            ],
          },
        ],
        hints: ["フォームの部品（.card input と .card button）に、親の値を使うキーワードを書きます", ".card input, .card button { font: inherit; }"],
        solution: FORM_CSS(".card input,\n.card button {\n  font: inherit;\n}\n"),
      },
    },
    {
      id: "current-color",
      title: "文字の色を使い回す: currentColor",
      explanation:
        "<p><code>currentColor</code> は、<b>その要素の <code>color</code> の値</b>を表すキーワードです。<code>border</code> や <code>background</code>、SVG の <code>fill</code> のように、ふつうは文字の色を使わないプロパティでも、<code>currentColor</code> と書けば文字と同じ色になります。</p><p>ボタンの枠線とアイコンを <code>currentColor</code> にしておくと、<code>.danger { color: … }</code> のように <b>color を 1 つ変えるだけで</b>、文字・枠線・アイコンの色がそろって変わります。なお、<code>border-color</code> の初期値はもともと <code>currentcolor</code> なので、<code>border: 2px solid;</code> と色を省いても同じ効果です。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/color_value",
      viz: { concept: "none" },
      challenge: {
        starterHTML: BUTTONS_HTML,
        starterCSS: BUTTONS_CSS("2px solid #2f5fd0", "#2f5fd0"),
        task: "削除ボタン（.danger）は文字だけ赤くなり、枠線とアイコンは青のままです。枠線とアイコンの色を currentColor にして、color を変えるだけでボタン全体の色が変わるようにしよう。",
        snapshot: { props: ["border-top-color", "fill"] },
        validators: [
          {
            kind: "allOf",
            of: [
              { ...computed("del", "border-top-color", RED), message: "削除ボタンの枠線が赤くなっていません（.btn の枠線の色を currentColor に）" },
              { ...computed("del-icon", "fill", RED), message: "削除ボタンのアイコンが赤くなっていません（.icon の fill を currentColor に）" },
              {
                kind: "allOf",
                of: [computed("save", "border-top-color", BLUE), computed("save-icon", "fill", BLUE)],
                message: "追加ボタンの枠線とアイコンは、青のままにします",
              },
              {
                kind: "allOf",
                of: [
                  // currentColor in the border, or a border with no colour at all
                  // (border-color starts out as currentcolor).
                  { kind: "sourceMatches", pattern: "border(?:-color)?\\s*:\\s*(?:[^;}]*[Cc]urrent[Cc]olor|\\S+\\s+\\S+\\s*[;}])" },
                  { kind: "sourceMatches", pattern: "fill\\s*:\\s*[Cc]urrent[Cc]olor" },
                ],
                message: "赤を書き足すのではなく、currentColor で文字の色を使いましょう（色の種類が増えても、color を変えるだけで済みます）",
              },
            ],
          },
        ],
        hints: ["枠線の色とアイコンの fill を、文字の色を表すキーワードにします", ".btn { border: 2px solid currentColor; } .icon { fill: currentColor; }"],
        solution: BUTTONS_CSS("2px solid currentColor", "currentColor"),
      },
    },
    {
      id: "revert-reset",
      title: "リセットを元に戻す: revert",
      explanation:
        "<p>サイト全体のリセット用の CSS で <code>ul { list-style: none; padding: 0; }</code> のように書くと、ナビゲーションは作りやすくなりますが、記事の中の箇条書きからも黒丸と字下げが消えてしまいます。</p><p>キーワード <code>revert</code> は、そのプロパティを<b>サイトの CSS が何も指定していなかったときの値</b>、つまり（利用者が独自のスタイルを設定していなければ）<b>ブラウザの既定のスタイル</b>に戻します。<code>.prose ul { list-style: revert; padding: revert; }</code> と書けば、黒丸と 40px の字下げが戻ります。似たキーワードの <code>unset</code> は、継承されるプロパティなら親の値、そうでなければ<b>初期値</b>（padding なら 0）になるので、ブラウザの既定には戻りません。<code>all: revert</code> なら、すべてのプロパティをまとめて戻せます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能。Chrome 84・Firefox 67・Safari 9.1 から）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/revert",
      viz: { concept: "none" },
      challenge: {
        starterHTML: LIST_HTML,
        starterCSS: LIST_CSS(""),
        task: "サイト全体のリセットで、箇条書きの黒丸と字下げが消えています。記事（.prose）の中の箇条書きだけ、ブラウザの既定の見た目に戻そう（ナビゲーションはそのまま）。",
        snapshot: { props: ["list-style-type"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [computed("i1", "list-style-type", "disc"), computed("i2", "list-style-type", "disc")],
                message: "記事の箇条書きに、黒丸が戻っていません",
              },
              {
                kind: "offset",
                a: "prose",
                b: "i1-text",
                edgeA: "left",
                edgeB: "left",
                min: 38,
                max: 42,
                message: "記事の箇条書きの字下げ（40px）が戻っていません（unset は初期値の 0 になります。revert ならブラウザの既定に戻ります）",
              },
              {
                kind: "allOf",
                of: [
                  computed("n1", "list-style-type", "none"),
                  { kind: "offset", a: "nav", b: "n1", edgeA: "left", edgeB: "left", min: -1, max: 1 },
                ],
                message: "ナビゲーションまで元に戻っています（.prose の中の ul だけを選びます）",
              },
              {
                kind: "sourceMatches",
                pattern: "\\brevert\\b",
                message: "40px や disc を書き直しても戻せますが、revert で「ブラウザの既定」に戻しましょう（値を覚えておく必要がありません）",
              },
            ],
          },
        ],
        hints: ["記事の中の ul（.prose ul）で、list-style と padding をブラウザの既定に戻します", ".prose ul { list-style: revert; padding: revert; }"],
        solution: LIST_CSS(".prose ul {\n  margin: revert;\n  padding: revert;\n  list-style: revert;\n}\n"),
      },
    },
  ],
};
