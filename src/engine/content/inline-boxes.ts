import type { ValidatorSpec } from "../validate/primitives.js";
import { svgUri } from "./svg-uri.js";
import type { Track } from "./types.js";

// Inline layout is judged by sizes that follow from it: an inline-block tag is
// exactly as wide as its width while still sitting in the line; an image no
// longer on the text baseline leaves its frame no taller than itself (on the
// baseline it leaves a strip for the descenders, about 5px with the preview's
// font, so any gap fails); and a unitless line-height gives the 28px heading
// 42px lines (84px for its two lines) where an inherited 24px squeezes them.

const TAGS = ["CSS", "HTML", "デザイン"];

const TAGS_HTML =
  '<p data-id="tags" class="tags">タグ: ' +
  TAGS.map((t, i) => `<a data-id="t${i + 1}" class="tag" href="#tag-${i + 1}">${t}</a>`).join("") +
  "</p>";

const TAGS_CSS = (extra: string): string =>
  `.tags {\n  margin: 0;\n  font-size: 14px;\n  line-height: 2;\n}\n.tag {\n  width: 72px;\n  margin: 4px;\n  padding: 2px 0;\n  border-radius: 999px;\n  background: #dbe4fb;\n  color: #18203a;\n  text-align: center;\n  text-decoration: none;\n${extra}}\n`;

const PHOTO = svgUri(
  240,
  120,
  "<rect width='240' height='120' fill='#9fd3f5'/><circle cx='190' cy='34' r='16' fill='#fff3c4'/><path d='M0 120L70 60l50 40 40-30 80 50z' fill='#2f9d5b'/>",
);

const FRAME_HTML = `<figure data-id="frame" class="frame"><img data-id="photo" class="photo" src="${PHOTO}" alt="山と空の写真"></figure>`;

const FRAME_CSS = (extra: string): string =>
  `.frame {\n  width: fit-content;\n  margin: 0;\n  padding: 0;\n  background: #f5c400;\n}\n${extra}`;

const POST_HTML =
  '<article data-id="post" class="post"><h2 data-id="title">秋の<br>写真教室</h2>' +
  '<p data-id="body">紅葉の撮り方を<br>やさしく学びます。</p></article>';

const POST_CSS = (lineHeight: string): string =>
  `.post {\n  font-size: 16px;\n  line-height: ${lineHeight};\n}\n.post h2 {\n  margin: 0;\n  font-size: 28px;\n}\n.post p {\n  margin: 8px 0 0;\n}\n`;

const width72 = (id: string): ValidatorSpec => ({ kind: "sizeApprox", id, w: 72, tol: 1 });

export const inlineBoxesTrack: Track = {
  id: "inline-boxes",
  title: "行の中の箱（inline-block・画像のすき間・line-height）",
  summary: "inline-block で幅の効く部品を行に並べ、画像の下のすき間をなくし、単位なしの line-height で行の高さを文字に合わせる。",
  emoji: "🔤",
  lessons: [
    {
      id: "inline-block",
      title: "行に並べたまま幅を効かせる: inline-block",
      explanation:
        "<p><code>&lt;a&gt;</code> や <code>&lt;span&gt;</code> のような<b>インライン要素</b>は、文章の行の中に並びますが、<code>width</code> と <code>height</code> が効かず、上下の <code>margin</code> も行の高さに影響しません。</p><p><code>display: inline-block</code> にすると、<b>外側はインライン</b>（行の中に並ぶ）、<b>内側はブロック</b>（幅・高さ・上下の余白が効く）の箱になります。<code>display: block</code> では幅は効きますが、1 つずつ改行されてしまいます。タグやバッジ、ボタン風のリンクを文章の中に置くときの定番です。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/display",
      viz: { concept: "none" },
      challenge: {
        starterHTML: TAGS_HTML,
        starterCSS: TAGS_CSS(""),
        task: "タグに width: 72px を指定したのに、文字の幅のままです。タグを行の中に並べたまま、幅（と上下の余白）が効くようにしよう。",
        snapshot: { props: ["display"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [width72("t1"), width72("t2"), width72("t3")],
                message: "タグの幅が 72px になっていません（インライン要素には width が効きません）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "alignedEdge", ids: ["t1", "t2", "t3"], edge: "top" },
                  { kind: "order", ids: ["t1", "t2", "t3"], axis: "x" },
                ],
                message: "タグが 1 つずつ改行されています（display: block ではなく、行の中に並ぶ inline-block にします）",
              },
              {
                kind: "computedMatches",
                id: "t1",
                prop: "display",
                pattern: "^inline-(?:block|flex|grid)$",
                message: "float や flex でも並びますが、文章の行の中に置く部品は display: inline-block にしましょう",
              },
            ],
          },
        ],
        hints: ["外側はインライン、内側はブロックとしてふるまう display の値を使います", ".tag { display: inline-block; }"],
        solution: TAGS_CSS("  display: inline-block;\n"),
      },
    },
    {
      id: "image-gap",
      title: "画像の下のすき間をなくす: display: block",
      explanation:
        "<p><code>&lt;img&gt;</code> は既定で<b>インライン</b>なので、文字と同じ行に置かれ、画像の下端が<b>文字のベースライン</b>にそろいます（<code>vertical-align: baseline</code>）。ベースラインの下には「g」や「y」の下に伸びる部分のための余白があるので、画像だけを入れた枠でも、画像の下に数 px のすき間ができます。</p><p>画像を <code>display: block</code> にすると、行に置かれなくなるので、すき間は消えます。行の中に置いたままなら、<code>vertical-align: middle</code>（または <code>top</code> / <code>bottom</code>）でベースラインからずらしても消せます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/vertical-align",
      viz: { concept: "none" },
      challenge: {
        starterHTML: FRAME_HTML,
        starterCSS: FRAME_CSS(""),
        task: "写真の下に、すき間（黄色い帯）ができています。枠（.frame）が写真をぴったり包むようにしよう。",
        snapshot: { props: ["display", "vertical-align"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "offset",
                a: "photo",
                b: "frame",
                edgeA: "bottom",
                edgeB: "bottom",
                min: -0.5,
                max: 0.5,
                message: "写真の下にすき間が残っています（画像は文字のベースラインに乗るので、下に文字の下がり分の余白ができます）",
              },
              {
                kind: "anyOf",
                of: [
                  { kind: "computedEquals", id: "photo", prop: "display", value: "block" },
                  { kind: "computedMatches", id: "photo", prop: "vertical-align", pattern: "^(?!baseline$)" },
                ],
                message: "行の高さを 0 にするのではなく、画像を display: block（または vertical-align: middle など）にしましょう（文字を足しても崩れません）",
              },
            ],
          },
        ],
        hints: ["画像を行に置かないようにすれば、ベースラインの下の余白はなくなります", ".photo { display: block; }"],
        solution: FRAME_CSS(".photo {\n  display: block;\n}\n"),
      },
    },
    {
      id: "unitless-line-height",
      title: "行の高さを文字に合わせる: 単位なしの line-height",
      explanation:
        "<p><code>line-height</code> は継承されるプロパティです。親に <code>line-height: 24px</code> のように<b>長さ</b>で書くと、子には<b>24px という計算後の値</b>がそのまま受け継がれます。28px の見出しにも 24px の行の高さが使われ、2 行の見出しが重なるほど詰まってしまいます。<code>1.5em</code> や <code>150%</code> も、親のところで px に計算されてから受け継がれるので同じです。</p><p><code>line-height: 1.5</code> のように<b>単位なしの数</b>で書くと、受け継がれるのは「1.5 倍」という数のほうで、<b>それぞれの要素が自分の文字の大きさに掛け算</b>します（16px の本文は 24px、28px の見出しは 42px）。MDN でも、継承による思わぬ結果を避けるため、ほとんどの場合は単位なしの数をすすめています。本文には 1.5 以上が読みやすい目安です。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/line-height",
      viz: { concept: "none" },
      challenge: {
        starterHTML: POST_HTML,
        starterCSS: POST_CSS("24px"),
        task: "親（.post）の line-height: 24px が見出しにも受け継がれ、28px の見出しの 2 行が詰まっています。line-height を、それぞれの文字の大きさの 1.5 倍になるように書き直そう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "sizeApprox",
                id: "title",
                h: 84,
                tol: 1,
                message: "見出しの行が詰まっています（親の 24px がそのまま受け継がれています。28px の 1.5 倍の 42px × 2 行＝ 84px になるはずです）",
              },
              {
                kind: "sizeApprox",
                id: "body",
                h: 48,
                tol: 1,
                message: "本文の行の高さが 24px（16px の 1.5 倍）× 2 行＝ 48px になっていません",
              },
              {
                kind: "sourceMatches",
                pattern: "line-height\\s*:\\s*[\\d.]+\\s*[;}]",
                message: "見出しだけを px で直すのではなく、親の line-height を 1.5 のような単位なしの数にしましょう（子は自分の文字の大きさに掛け算します）",
              },
            ],
          },
        ],
        hints: ["長さ（px・em・%）ではなく、単位を付けない数で書きます", ".post { line-height: 1.5; }"],
        solution: POST_CSS("1.5"),
      },
    },
  ],
};
