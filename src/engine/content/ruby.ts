import type { Track } from "./types.js";

// Ruby is judged by where the annotation lands (the <rt> box above or below the
// base word), by the computed ruby-align, and by the tops of the lines of a
// paragraph staying evenly spaced.

const WORD_HTML = '<p class="text"><ruby data-id="base">漢字<rt data-id="rt">かんじ</rt></ruby>を読む</p>';

const WORD_CSS = (extra: string): string =>
  `.text {\n  margin: 16px 0;\n  font-size: 24px;\n  line-height: 2.4;\n}\n${extra}`;

const ALIGN_HTML = '<p class="text"><ruby data-id="base">雷<rt data-id="rt">かみなり</rt></ruby>が鳴る</p>';

const LINES_HTML =
  '<p data-id="para" class="para">' +
  '<span data-id="l1">むかしむかし、ある山の</span><br>' +
  '<span data-id="l2"><ruby>麓<rt>ふもと</rt></ruby>に、おじいさんが</span><br>' +
  '<span data-id="l3">住んでいました。</span></p>';

const LINES_CSS = (line: string): string =>
  `.para {\n  margin: 0;\n  font-size: 16px;\n  line-height: ${line};\n}\n`;

const RUBY_SUPPORT =
  "Baseline 2024（2024 年 12 月から主要ブラウザの最新版で利用可: ";

export const rubyTrack: Track = {
  id: "ruby",
  title: "ふりがな（ruby-position・ruby-align・行の間隔）",
  summary: "ruby-position でふりがなを下に置き、ruby-align で親文字より長いふりがなの寄せ方を決め、line-height でふりがなのある行だけ間隔が広がるのを防ぐ。",
  emoji: "🏯",
  lessons: [
    {
      id: "ruby-position",
      title: "ふりがなを下に: ruby-position",
      explanation:
        "<p>ふりがなは <code>&lt;ruby&gt;</code> の中に親文字を書き、続けて <code>&lt;rt&gt;</code> に読みを書きます。横書きでは既定で親文字の<b>上</b>に付きます。</p><p><code>ruby-position: under</code> にすると下に付きます（縦書きでは左です）。既定は <code>over</code> です。語学の教材で、読みと意味のように上下を使い分けるときなどに使います。</p><p>" +
        RUBY_SUPPORT +
        "Chrome 84 / Firefox 38 / Safari 18.2 以降）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/ruby-position",
      viz: { concept: "none" },
      challenge: {
        starterHTML: WORD_HTML,
        starterCSS: WORD_CSS(""),
        task: "「かんじ」のふりがなを、親文字の下に移そう。",
        snapshot: { props: [] },
        validators: [
          { kind: "offset", a: "base", b: "rt", edgeA: "bottom", edgeB: "top", min: -8, max: 12, message: "ふりがなが親文字の下にありません（ruby に ruby-position: under を指定します）" },
        ],
        hints: ["ruby-position の既定は over です", "ruby { ruby-position: under; }"],
        solution: WORD_CSS("ruby {\n  ruby-position: under;\n}\n"),
      },
    },
    {
      id: "ruby-align",
      title: "長いふりがなの寄せ方: ruby-align",
      explanation:
        "<p>親文字より読みのほうが長いと、親文字の 1 文字に長い読みが付きます。<code>ruby-align</code> は、そのときの余りの配り方を決めます。<code>start</code> は始まりにそろえ、<code>center</code> は中央、<code>space-between</code> は文字の間に配り、<code>space-around</code> は文字の間と両端に配ります。</p><p>既定は <code>space-around</code> で、短いほうの文字の間が空きます。親文字をばらけさせたくないときは <code>center</code> にします。</p><p>" +
        RUBY_SUPPORT +
        "Chrome 128 / Firefox 38 / Safari 18.2 以降）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/ruby-align",
      viz: { concept: "none" },
      challenge: {
        starterHTML: ALIGN_HTML,
        starterCSS: WORD_CSS("rt {\n  font-size: 16px;\n}\n"),
        task: "ruby に ruby-align: center を指定して、ふりがなの余りを中央に寄せよう。",
        snapshot: { props: ["ruby-align"] },
        validators: [
          { kind: "computedEquals", id: "base", prop: "ruby-align", value: "center", message: "ruby に ruby-align: center を指定しましょう（既定は space-around です）" },
        ],
        hints: ["ruby-align は ruby に書くと rt にも受け継がれます", "ruby { ruby-align: center; }"],
        solution: WORD_CSS("rt {\n  font-size: 16px;\n}\nruby {\n  ruby-align: center;\n}\n"),
      },
    },
    {
      id: "ruby-line-height",
      title: "ふりがなの行だけ広がらないように: line-height",
      explanation:
        "<p>ふりがなの付いた行は、ふりがなの分だけ高くなることがあります。すると、ふりがなのある行の前後だけ<b>行の間隔が広がり</b>、文章の並びがそろいません。</p><p>段落の <code>line-height</code> を、ふりがなも収まるだけ大きくしておけば、どの行も同じ間隔になります。文字の大きさに合わせて伸びるよう、単位なしの値で書きます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/line-height",
      viz: { concept: "none" },
      challenge: {
        starterHTML: LINES_HTML,
        starterCSS: LINES_CSS("1.2"),
        task: "ふりがなのある 2 行目だけ、上の行との間隔が広がっています。.para の line-height を 2 にして、3 行の間隔をそろえよう。",
        snapshot: { props: ["line-height"] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "offset", a: "l1", b: "l2", edgeA: "top", edgeB: "top", min: 31, max: 33, message: "" },
              { kind: "offset", a: "l2", b: "l3", edgeA: "top", edgeB: "top", min: 31, max: 33, message: "" },
            ],
            message: "行の間隔がそろっていません（.para の line-height を 2 にすると、どの行も 32px 間隔になります）",
          },
        ],
        hints: ["16px × 2 = 32px の間隔です", ".para { line-height: 2; }"],
        solution: LINES_CSS("2"),
      },
    },
  ],
};
