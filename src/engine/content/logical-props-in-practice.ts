import type { Edge, ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Logical properties are judged on a horizontal and a vertical (or a
// left-to-right and a right-to-left) twin that share one rule: the note's line
// is on the left in horizontal text and on the top in vertical text, with no
// line on the other sides; each greeting starts at its own line start (12px
// inside the left or the right edge); and both paragraphs' lines are 160px
// long, as the width of one and the height of the other. The source must use
// the logical property, since a separate physical rule per element would also
// produce these boxes.

const between = (a: string, b: string, edgeA: Edge, edgeB: Edge, px: number): ValidatorSpec => ({
  kind: "offset",
  a,
  b,
  edgeA,
  edgeB,
  min: px - 0.5,
  max: px + 0.5,
});

const borders = (id: string, widths: Record<"top" | "right" | "bottom" | "left", string>): ValidatorSpec[] =>
  (Object.entries(widths) as [string, string][]).map(([side, value]) => ({
    kind: "computedEquals",
    id,
    prop: `border-${side}-width`,
    value,
  }));

const NOTES_HTML =
  '<div class="notes"><p data-id="h" class="note">横書きの注意書きです。</p>' +
  '<p data-id="v" class="note vertical">縦書きの注意書きです。</p></div>';

const NOTES_CSS = (line: string): string =>
  `.notes {\n  display: flex;\n  gap: 16px;\n  align-items: flex-start;\n}\n.note {\n  margin: 0;\n  padding: 8px 12px;\n  background: #fff3c4;\n  ${line}\n}\n.vertical {\n  writing-mode: vertical-rl;\n  height: 168px;\n}\n`;

const GREETINGS_HTML =
  '<p data-id="ja" class="greeting"><span data-id="ja-text">ようこそ</span></p>' +
  '<p data-id="ar" class="greeting" dir="rtl" lang="ar"><span data-id="ar-text">أهلا وسهلا</span></p>';

const GREETINGS_CSS = (align: string): string =>
  `.greeting {\n  margin: 0 0 8px;\n  padding: 8px 12px;\n  border-radius: 8px;\n  background: #eef1f8;\n  /* 以前のリセットで付けた左寄せ */\n  text-align: ${align};\n}\n`;

const COLUMNS_HTML =
  '<div class="pair"><p data-id="h" class="column">横書きの段落です。一行の長さを決めています。</p>' +
  '<p data-id="v" class="column vertical">縦書きの段落です。一行の長さを決めています。</p></div>';

const COLUMNS_CSS = (size: string): string =>
  `.pair {\n  display: flex;\n  gap: 16px;\n  align-items: flex-start;\n}\n.column {\n  /* 1 行の長さ */\n  ${size}\n  margin: 0;\n  padding: 8px;\n  background: #eef1f8;\n}\n.vertical {\n  writing-mode: vertical-rl;\n}\n`;

export const logicalPropsInPracticeTrack: Track = {
  id: "logical-props-in-practice",
  title: "論理プロパティの応用（縦書き・右から左）",
  summary: "border-inline-start で縦書きでも行の始まりに線を引き、text-align: start で右から左の言語を行の始まりにそろえ、inline-size で横書きと縦書きの行の長さを 1 つの指定で決める。",
  emoji: "🌐",
  lessons: [
    {
      id: "border-inline-start",
      title: "縦書きでも行の始まりに線を: border-inline-start",
      explanation:
        "<p><code>border-left</code> は、書く向きに関係なく<b>いつも左</b>に線を引きます。縦書き（<code>writing-mode: vertical-rl</code>）では行が上から始まるので、行の始まりを示す線は上にあるべきですが、左に残ってしまいます。</p><p><code>border-inline-start</code> は「<b>行の始まりの側</b>」の線です。横書きなら左、縦書きなら上、右から左に書く言語なら右に引かれるので、1 つの指定でどの向きにも合います。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/border-inline-start",
      viz: { concept: "none" },
      challenge: {
        starterHTML: NOTES_HTML,
        starterCSS: NOTES_CSS("border-left: 4px solid #b9791b;"),
        task: "縦書きの注意書きでも、線が左に引かれています。.note の 1 つの指定で、線を行の始まりの側（横書きは左、縦書きは上）に引こう。",
        snapshot: { props: ["border-top-width", "border-right-width", "border-bottom-width", "border-left-width"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: borders("h", { top: "0px", right: "0px", bottom: "0px", left: "4px" }),
                message: "横書きの注意書きの線が、左の 1 本だけになっていません",
              },
              {
                kind: "allOf",
                of: borders("v", { top: "4px", right: "0px", bottom: "0px", left: "0px" }),
                message: "縦書きの注意書きの線が、行の始まり（上）の 1 本になっていません（border-left は向きに関係なく左に引きます。border-inline-start なら、横書きでは左、縦書きでは上です）",
              },
              {
                kind: "sourceMatches",
                pattern: "border-inline-start(?:-width|-style|-color)?\\s*:",
                message: "縦書きの要素にだけ border-top を書くのではなく、.note の border-inline-start 1 つで両方に効かせましょう",
              },
            ],
          },
        ],
        hints: ["上下左右ではなく、行の始まりの側を指す border のプロパティがあります", ".note { border-inline-start: 4px solid #b9791b; }（border-left は消します）"],
        solution: NOTES_CSS("border-inline-start: 4px solid #b9791b;"),
      },
    },
    {
      id: "text-align-start",
      title: "右から左の言語も行の始まりに: text-align: start",
      explanation:
        "<p>アラビア語やヘブライ語は右から左に書くので、HTML では <code>dir=\"rtl\"</code> を付けます。<code>text-align: left</code> は、書く向きに関係なく<b>いつも左</b>にそろえるので、右から左の文まで左に寄ってしまいます。</p><p><code>text-align: start</code> は「<b>行の始まり</b>」にそろえます。左から右の文では左、右から左の文では右です（text-align の初期値も start です）。リセットなどで left を指定しているときは、start に替えます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/text-align",
      viz: { concept: "none" },
      challenge: {
        starterHTML: GREETINGS_HTML,
        starterCSS: GREETINGS_CSS("left"),
        task: "右から左に書くアラビア語のあいさつ（dir=\"rtl\"）まで、左に寄っています。どちらのあいさつも、行の始まり（日本語は左、アラビア語は右）にそろえよう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                ...between("ja", "ja-text", "left", "left", 12),
                message: "日本語のあいさつが、左（行の始まり）にそろっていません",
              },
              {
                ...between("ar-text", "ar", "right", "right", 12),
                message: "アラビア語のあいさつが、右（右から左に書く文の行の始まり）にそろっていません（text-align: left はいつも左です。start なら、書く向きに合わせて行の始まりにそろいます）",
              },
            ],
          },
        ],
        hints: ["左右ではなく、行の始まりを指す text-align の値があります", ".greeting { text-align: start; }"],
        solution: GREETINGS_CSS("start"),
      },
    },
    {
      id: "inline-size",
      title: "横書きと縦書きで行の長さをそろえる: inline-size",
      explanation:
        "<p><code>width</code> は、書く向きに関係なく<b>横幅</b>です。縦書きでは 1 行が縦に伸びるので、<code>width: 160px</code> は行の長さではなく、行を並べていく方向（段落の厚み）の大きさになり、1 行は縦に長く伸びたままです。</p><p><code>inline-size</code> は「<b>行の方向の大きさ</b>」で、横書きなら幅、縦書きなら高さになります。1 行の長さを inline-size で決めておけば、横書きと縦書きで同じ指定が使えます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/inline-size",
      viz: { concept: "none" },
      challenge: {
        starterHTML: COLUMNS_HTML,
        starterCSS: COLUMNS_CSS("width: 160px;"),
        task: "横書きの段落は 1 行 160px なのに、縦書きの段落は 1 行が縦に長く伸びています。.column の 1 つの指定で、どちらも 1 行の長さを 160px にしよう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "sizeApprox",
                id: "h",
                w: 160,
                tol: 1,
                message: "横書きの段落の幅（1 行の長さ）が 160px になっていません",
              },
              {
                kind: "sizeApprox",
                id: "v",
                h: 160,
                tol: 1,
                message: "縦書きの段落の高さ（1 行の長さ）が 160px になっていません（width はいつも横幅です。縦書きの 1 行は縦に伸びるので、行の長さは inline-size で決めます）",
              },
              {
                kind: "sourceMatches",
                pattern: "inline-size\\s*:",
                message: "縦書きの要素にだけ height を書くのではなく、.column の inline-size 1 つで両方の行の長さを決めましょう",
              },
            ],
          },
        ],
        hints: ["横幅ではなく、行の方向の大きさを指すプロパティがあります", ".column { inline-size: 160px; }（width は消します）"],
        solution: COLUMNS_CSS("inline-size: 160px;"),
      },
    },
  ],
};
