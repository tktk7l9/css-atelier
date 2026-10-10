import type { ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Each line of the text is an inline-block ended by <br>, so its box is the
// line box: where a line starts shows how far the float (or its shape) pushes
// it. Beside a square float every line starts at the same x; beside
// shape-outside: circle() the first and the seventh line start further left
// than the middle one, and shape-margin moves them all further right. The
// line height is fixed, so the lines sit at the same heights on any machine,
// and the lines beside the photo are short (6 characters) so they still fit
// beside the photo in a 300px preview with a scrollbar.
//
// A shape is clipped to the float's margin box, so the shape-margin lesson
// gives the photo a 12px margin and a circle the size of the photo
// (circle(80px)); only then can shape-margin push the text away from it.

const LINES = ["春の新作入荷", "やわらかな色", "軽くて丈夫", "店頭でお試し", "ご予約も受付", "お早めに", "次回も楽しみ", "ここから下は", "写真の下に戻ります"];

const PARA_HTML =
  '<p data-id="para" class="para"><span data-id="photo" class="photo"></span>' +
  LINES.map((text, i) => `<span data-id="l${i + 1}" class="line">${text}</span><br>`).join("") +
  "</p>";

const PARA_CSS = (photo: string): string =>
  `.para {\n  max-width: 320px;\n  margin: 0;\n  font-size: 14px;\n  line-height: 24px;\n}\n.photo {\n  display: block;\n  width: 160px;\n  height: 160px;\n  background: radial-gradient(circle at 40% 35%, #ffd27a, #ff8a65 70%);\n${photo}}\n.line {\n  display: inline-block;\n  padding: 0 4px;\n  background: #eef1f8;\n}\n`;

/** `b` starts at least `min` px to the right of where `a` starts. */
const startsAfter = (a: string, b: string, min: number): ValidatorSpec => ({
  kind: "offset",
  a,
  b,
  edgeA: "left",
  edgeB: "left",
  min,
});

/** The first and the seventh line, near the top and bottom of the circle, start further left than the middle line. */
const followsCircle: ValidatorSpec = {
  kind: "allOf",
  of: [startsAfter("l1", "l4", 10), startsAfter("l7", "l4", 10)],
};

/** How far the middle line starts after the photo's right edge. */
const clearance = (min: number): ValidatorSpec => ({
  kind: "offset",
  a: "photo",
  b: "l4",
  edgeA: "right",
  edgeB: "left",
  min,
});

export const shapesTrack: Track = {
  id: "shapes",
  title: "回り込みと図形（float・shape-outside）",
  summary: "float で文章を写真の横に流し、shape-outside で円に沿わせ、shape-margin で余白を取る。",
  emoji: "🫧",
  lessons: [
    {
      id: "float-left",
      title: "文章を回り込ませる: float",
      explanation:
        "<p><code>float: left</code> を指定した要素は、ふつうの並び（フロー）から外れて<b>左に寄り</b>、後に続く文章の<b>行がその横に回り込みます</b>。行の箱（ラインボックス）が写真のぶんだけ短くなるので、文字は写真の右から始まり、写真より下の行は左端に戻ります。</p><p>写真と文字の間を空けるには、写真に <code>margin-right</code> を付けます。回り込みを止めて次の要素を写真の下から始めたいときは、その要素に <code>clear: left</code>（または <code>both</code>）を指定します。かつてはページ全体のレイアウトに使われましたが、今は flex と grid に任せ、float は<b>文章の回り込み</b>に使うのが定石です。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/float",
      viz: { concept: "none" },
      challenge: {
        starterHTML: PARA_HTML,
        starterCSS: PARA_CSS(""),
        task: "商品の写真（.photo）の下に説明文が続いています。写真を左に寄せて、説明文をその右に回り込ませよう（写真より下の行は、左端に戻ります）。",
        snapshot: { props: ["float"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "alignedEdge", ids: ["photo", "l1"], edge: "top" },
                  { kind: "order", ids: ["photo", "l1"], axis: "x" },
                  { kind: "order", ids: ["photo", "l4"], axis: "x" },
                ],
                message: "説明文が写真の右に回り込んでいません（写真の下から始まっています）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "alignedEdge", ids: ["para", "l8"], edge: "left" },
                  { kind: "alignedEdge", ids: ["para", "l9"], edge: "left" },
                ],
                message: "写真より下の行（8 行目から）が、左端に戻っていません",
              },
              {
                kind: "computedEquals",
                id: "photo",
                prop: "float",
                value: "left",
                message: "写真（.photo）に float: left を指定しましょう",
              },
            ],
          },
        ],
        hints: ["回り込ませたい文章ではなく、寄せたい写真のほうに指定します", ".photo { float: left; }"],
        solution: PARA_CSS("  float: left;\n"),
      },
    },
    {
      id: "shape-circle",
      title: "丸い写真に沿わせる: shape-outside: circle()",
      explanation:
        "<p>float で回り込ませた文章は、写真が <code>border-radius</code> で丸く見えていても、<b>四角いマージンボックス</b>に沿って並びます。<code>shape-outside</code> は、回り込みの形を<b>図形で</b>決めるプロパティです。<code>circle()</code> なら円、<code>ellipse()</code> なら楕円、<code>polygon()</code> なら多角形に沿って、行ごとに始まる位置が変わります。</p><p><code>circle()</code> の半径を省略すると <code>closest-side</code>、つまり基準の箱（既定ではマージンボックス）の<b>短い辺の半分</b>で、中心は箱の中央です。<code>circle(40%)</code> のように小さくすると、文字が写真に重なります。shape-outside は <b>float した要素にだけ</b>効き、<code>clip-path</code> や <code>border-radius</code> は見た目を切り抜くだけで回り込みの形は変えません。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能。Chrome 37・Firefox 62・Safari 10.1 から）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/shape-outside",
      viz: { concept: "none" },
      challenge: {
        starterHTML: PARA_HTML,
        starterCSS: PARA_CSS("  float: left;\n  border-radius: 50%;\n"),
        task: "丸く切り抜いた写真の横で、説明文がどの行も同じ位置から始まり、写真の上下の角に四角いすき間ができています。回り込みの形を円にして、上下の行が円に沿って写真に近づくようにしよう。",
        snapshot: { props: ["shape-outside"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                ...followsCircle,
                message: "説明文が円の形に沿っていません（上の行も真ん中の行も同じ位置から始まり、四角い箱に沿っています）",
              },
              {
                ...clearance(-2),
                message: "真ん中の行の文字が、写真に重なっています（円が写真より小さくなっています。半径を省略した circle() なら、写真の短い辺の半分です）",
              },
              {
                kind: "computedMatches",
                id: "photo",
                prop: "shape-outside",
                pattern: "circle\\(|ellipse\\(|round",
                message: "shape-outside: circle() で、回り込みの形を円にしましょう（border-radius や clip-path は見た目だけで、回り込みの形は変わりません）",
              },
            ],
          },
        ],
        hints: ["回り込みの形は、float した写真のほうに shape-outside で指定します", ".photo { shape-outside: circle(); }"],
        solution: PARA_CSS("  float: left;\n  border-radius: 50%;\n  shape-outside: circle();\n"),
      },
    },
    {
      id: "shape-margin",
      title: "図形の外側に余白を取る: shape-margin",
      explanation:
        "<p><code>shape-outside</code> で円に沿わせると、真ん中の行の文字は<b>円の縁に触れる</b>ところまで寄ります。図形と文字の間に余白を取るのが <code>shape-margin</code> で、図形を指定した値のぶん<b>外側に膨らませた形</b>に沿って文字が並びます。</p><p>ここでは写真に 12px の <code>margin</code> があり、円は <code>circle(80px)</code> で写真と同じ大きさです。この写真の margin を広げても、円は写真の大きさのままなので文字は離れません。一方で、図形は float の<b>マージンボックスの外には出られず</b>、はみ出したぶんは切り取られます。shape-margin で膨らませる余白は、margin の範囲内に収めます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能。Chrome 37・Firefox 62・Safari 10.1 から）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/shape-margin",
      viz: { concept: "none" },
      challenge: {
        starterHTML: PARA_HTML,
        starterCSS: PARA_CSS("  float: left;\n  margin: 12px;\n  border-radius: 50%;\n  shape-outside: circle(80px);\n"),
        task: "円に沿わせた説明文の真ん中の行が、写真の縁に触れています。円の形はそのままに、図形の外側に 12px の余白を取ろう（写真の margin は 12px あります）。",
        snapshot: { props: ["shape-margin"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                ...clearance(10),
                message: "真ん中の行の文字が写真に近すぎます（図形の外側に 12px ほどの余白を足しましょう。写真の margin を広げても、円は写真の大きさのままです）",
              },
              { ...followsCircle, message: "回り込みが円の形でなくなっています" },
              {
                kind: "computedMatches",
                id: "photo",
                prop: "shape-margin",
                pattern: "^(?!0px)",
                message: "shape-margin で、図形の外側に余白を足しましょう（circle() の半径を大きくすると、図形が写真と合わなくなります）",
              },
            ],
          },
        ],
        hints: ["余白は図形に対して付けるので、写真の margin ではなく shape-margin です", ".photo { shape-margin: 12px; }"],
        solution: PARA_CSS("  float: left;\n  margin: 12px;\n  border-radius: 50%;\n  shape-outside: circle(80px);\n  shape-margin: 12px;\n"),
      },
    },
  ],
};
