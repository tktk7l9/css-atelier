import type { Track } from "./types.js";

// How much these properties change depends on the font and the dictionaries of
// the learner's platform, so the lessons read the computed values.

const PRICE_HTML =
  '<table data-id="table" class="prices"><tr><td data-id="a">1,111</td></tr><tr><td data-id="b">8,888</td></tr><tr><td data-id="c">10,000</td></tr></table>';

const PRICE_CSS = ".prices {\n  font-size: 20px;\n}\n.prices td {\n  text-align: right;\n}\n";

const BREAK_HTML = '<p data-id="para" class="para">ちょっとしたことですが、きゃっきゃと遊ぶ子どもの声が、ゆっくり聞こえてきます。</p>';

const BREAK_CSS = ".para {\n  width: 200px;\n  margin: 0;\n}\n";

const HYPHEN_HTML =
  '<p data-id="para" lang="en" class="para">Internationalization requires considerable understanding of typography.</p>';

const HYPHEN_CSS = ".para {\n  width: 160px;\n  margin: 0;\n}\n";

export const textFineTrack: Track = {
  id: "text-fine",
  title: "文字の細かな調整（tabular-nums・line-break・hyphens）",
  summary: "font-variant-numeric: tabular-nums で数字の幅をそろえ、line-break: strict で小さな「っ」などの行頭を避け、hyphens: auto で英文を区切って折り返す。",
  emoji: "🔬",
  lessons: [
    {
      id: "tabular-nums",
      title: "数字の幅をそろえる: font-variant-numeric",
      explanation:
        "<p>多くのフォントの数字は、文字ごとに幅が違います。表の金額を右にそろえても、「1」と「8」の幅の差で桁の位置がずれることがあります。</p><p><code>font-variant-numeric: tabular-nums</code> は、<b>すべての数字が同じ幅</b>の字形を使います。表や、桁が増減するタイマーに向いています。フォントがこの機能を持っていないと、見た目は変わりません。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/font-variant-numeric",
      viz: { concept: "none" },
      challenge: {
        starterHTML: PRICE_HTML,
        starterCSS: PRICE_CSS,
        task: "金額の表の数字を、すべて同じ幅の字形にしよう（.prices に font-variant-numeric: tabular-nums）。",
        snapshot: { props: ["font-variant-numeric"] },
        validators: [
          { kind: "computedMatches", id: "a", prop: "font-variant-numeric", pattern: "tabular-nums", message: ".prices に font-variant-numeric: tabular-nums を指定しましょう" },
        ],
        hints: ["font-variant-numeric は継承されます", ".prices { font-variant-numeric: tabular-nums; }"],
        solution: PRICE_CSS + ".prices {\n  font-variant-numeric: tabular-nums;\n}\n",
      },
    },
    {
      id: "line-break-strict",
      title: "行頭の小さな文字を避ける: line-break",
      explanation:
        "<p><code>line-break</code> は、日本語・中国語・韓国語の、句読点や記号のまわりの改行の規則を決めます。<code>strict</code> は<b>いちばん厳しい</b>規則、<code>loose</code> はいちばんゆるい規則で、新聞のように短い行に向きます。<code>normal</code> はふつうの規則、初期値の <code>auto</code> はブラウザの既定です。</p><p>小さな「っ」や「ゃ」「々」「。」の前で改行してよいかが、値によって変わります。<code>anywhere</code> は、どこでも改行できる値です。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/line-break",
      viz: { concept: "none" },
      challenge: {
        starterHTML: BREAK_HTML,
        starterCSS: BREAK_CSS,
        task: ".para に line-break: strict を指定して、いちばん厳しい改行の規則にしよう。",
        snapshot: { props: ["line-break"] },
        validators: [
          { kind: "computedEquals", id: "para", prop: "line-break", value: "strict", message: ".para に line-break: strict を指定しましょう" },
        ],
        hints: ["初期値は auto です", ".para { line-break: strict; }"],
        solution: BREAK_CSS + ".para {\n  line-break: strict;\n}\n",
      },
    },
    {
      id: "hyphens-auto",
      title: "英文を区切って折り返す: hyphens",
      explanation:
        "<p>狭い列の英文は、長い単語の前で改行されて、行の右が大きく空きます。<code>hyphens: auto</code> にすると、ブラウザが単語の途中の適切な位置にハイフンを入れて折り返します。</p><p>効くのは、<b><code>lang</code> 属性があり、その言語の辞書がブラウザにあるとき</b>だけです。初期値の <code>manual</code> は、ソフトハイフン（<code>&amp;shy;</code>）を入れた位置でだけ区切ります。<code>none</code> は区切りません。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/hyphens",
      viz: { concept: "none" },
      challenge: {
        starterHTML: HYPHEN_HTML,
        starterCSS: HYPHEN_CSS,
        task: "lang=\"en\" の英文の .para に hyphens: auto を指定して、単語の途中でも区切れるようにしよう。",
        snapshot: { props: ["hyphens"] },
        validators: [
          { kind: "computedEquals", id: "para", prop: "hyphens", value: "auto", message: ".para に hyphens: auto を指定しましょう（初期値は manual です）" },
        ],
        hints: ["lang 属性はもう HTML に付いています", ".para { hyphens: auto; }"],
        solution: HYPHEN_CSS + ".para {\n  hyphens: auto;\n}\n",
      },
    },
  ],
};
