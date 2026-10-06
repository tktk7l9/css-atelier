import type { Track } from "./types.js";

// writing-mode moves whole boxes, so the first lesson is judged by geometry:
// in vertical-rl the first paragraph sits to the right of the second (in
// vertical-lr it is the other way round). text-orientation and
// text-combine-upright only change how glyphs are drawn inside a line, and the
// size they take depends on the font, so those lessons read the computed
// values. Both properties are inherited: each lesson also checks that the
// surrounding paragraph keeps its initial value, so setting it on the whole
// paragraph does not pass.

const PAGE_HTML =
  '<div data-id="page" class="page"><p data-id="p1">一つ目の段落です。縦書きでは、文字が上から下へ進みます。</p><p data-id="p2">二つ目の段落は、一つ目の左に並びます。</p></div>';

const PAGE_CSS = (extra: string): string =>
  `.page {\n  height: 200px;\n  padding: 12px 16px;\n  line-height: 1.8;\n  background: #fbf8f1;\n${extra}}\n.page p {\n  margin-block: 0 1em;\n}\n`;

const VERTICAL_TEXT_CSS = (cls: string, extra: string): string =>
  `.text {\n  writing-mode: vertical-rl;\n  height: 240px;\n  margin: 0;\n  font-size: 20px;\n  line-height: 1.6;\n}\n.${cls} {\n${extra}}\n`;

const ABBR_HTML =
  '<p data-id="text" class="text"><span data-id="abbr" class="abbr">CSS</span> の <span data-id="word" class="word">writing-mode</span> で縦書きにする</p>';

const DATE_HTML =
  '<p data-id="text" class="text">開催は<span data-id="month" class="tcy">10</span>月<span data-id="day" class="tcy">25</span>日、受付は<span data-id="hour" class="tcy">13</span>時からです。</p>';

export const writingModesTrack: Track = {
  id: "writing-modes",
  title: "縦書き",
  summary: "writing-mode・text-orientation・text-combine-upright で、日本語の縦組みを CSS で。",
  emoji: "📜",
  lessons: [
    {
      id: "writing-vertical",
      title: "縦書きにする: writing-mode: vertical-rl",
      explanation:
        "<p><code>writing-mode</code> は、<b>文字が進む向き</b>と、<b>行や段落が積み重なる向き</b>を決めます。初期値の <code>horizontal-tb</code> は横書きで、文字は左から右へ、行と段落は上から下へ並びます。</p><p><code>vertical-rl</code> にすると縦書きになり、文字は<b>上から下へ</b>進み、行と段落は<b>右から左へ</b>並びます。日本語の縦組みはこれです。縦書きでは上下が行の向き（inline）、左右が段落の積み重なる向き（block）に入れ替わるので、ここでは <code>height</code> が 1 行の長さを決め、幅は段落の量に合わせて決まります。段落の間隔を <code>margin-block</code> のような論理プロパティで書いておけば、縦書きでも段落の間（左右）に余白が入ります。</p><p><code>vertical-lr</code> は行が左から右へ並ぶ縦書きで、モンゴル文字などで使います。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/writing-mode",
      viz: { concept: "none" },
      challenge: {
        starterHTML: PAGE_HTML,
        starterCSS: PAGE_CSS(""),
        task: "本文（.page）を縦書きにしよう。文字は上から下へ進み、一つ目の段落が右端に、二つ目の段落がその左に並びます。",
        snapshot: { props: ["writing-mode"] },
        validators: [
          // allOf reports only the first unmet step, so a fresh starter gets one message.
          {
            kind: "allOf",
            of: [
              { kind: "computedEquals", id: "page", prop: "writing-mode", value: "vertical-rl", message: ".page に writing-mode: vertical-rl を指定しましょう" },
              { kind: "order", ids: ["p2", "p1"], axis: "x", message: "段落が右から左へ並んでいません（一つ目の段落が右端に来ます）" },
            ],
          },
        ],
        hints: ["縦書きで、行と段落を右から左へ並べるのは vertical-rl です", "writing-mode: vertical-rl;"],
        solution: PAGE_CSS("  writing-mode: vertical-rl;\n"),
      },
    },
    {
      id: "writing-orientation",
      title: "略語を立てる: text-orientation",
      explanation:
        "<p>縦書きの中の英字や数字は、初期値の <code>text-orientation: mixed</code> では<b>右に 90° 倒れて</b>（横倒しで）並びます。長い英単語は、このほうが読みやすくなります。</p><p>「CSS」のような 2〜3 文字の略語は、<code>text-orientation: upright</code> で<b>1 文字ずつ立てて</b>並べると縦書きになじみます。このプロパティは継承されるので、段落全体に書くと長い単語まで 1 文字ずつ立ってしまいます。立てたい略語だけを <code>&lt;span&gt;</code> で囲んで指定するのがコツです。逆に <code>sideways</code> は、漢字やかなも含めてすべてを横倒しにします。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能。Safari は 14 から接頭辞なしで利用可）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/text-orientation",
      viz: { concept: "none" },
      challenge: {
        starterHTML: ABBR_HTML,
        starterCSS: VERTICAL_TEXT_CSS("abbr", "  \n"),
        task: "縦書きの段落で、略語の「CSS」（.abbr）だけを 1 文字ずつ立てて並べよう。長い英単語の「writing-mode」（.word）は横倒しのままにします。",
        snapshot: { props: ["text-orientation", "writing-mode"] },
        validators: [
          { kind: "computedEquals", id: "abbr", prop: "text-orientation", value: "upright", message: "略語（.abbr）に text-orientation: upright を指定しましょう" },
          {
            kind: "computedEquals",
            id: "word",
            prop: "text-orientation",
            value: "mixed",
            message: "長い英単語（.word）まで立っています。段落全体ではなく .abbr にだけ指定しましょう",
          },
          { kind: "computedEquals", id: "text", prop: "writing-mode", value: "vertical-rl", message: "段落（.text）の縦書き（writing-mode: vertical-rl）は残しておきましょう" },
        ],
        hints: ["向きを変えたいのは .abbr だけです。段落全体に指定すると、継承で .word まで立ってしまいます", "text-orientation: upright;"],
        solution: VERTICAL_TEXT_CSS("abbr", "  text-orientation: upright;\n"),
      },
    },
    {
      id: "writing-tcy",
      title: "縦中横: text-combine-upright",
      explanation:
        "<p>縦書きの中の「10」「25」のような 2 桁の数字は、横倒しにも 1 文字ずつ立てるのでもなく、<b>横に並べて 1 文字分に収める</b>のが日本語の組版の習わしです。これを<b>縦中横（たてちゅうよこ）</b>と呼びます。</p><p><code>text-combine-upright: all</code> を指定すると、その要素の中の文字をまとめて横に並べ、1 文字分の高さ（1em）に収めます。収めたい数字だけを <code>&lt;span&gt;</code> で囲んで指定します。このプロパティも継承されるので、段落全体に書くと、文章まで 1 文字分ずつに押し込まれてしまいます。</p><p>桁数で自動的に縦中横にする <code>digits 2</code> という値も仕様にはありますが、まだどのブラウザも対応していません。<code>all</code> は主要ブラウザすべてで使えます（Baseline: 広く利用可能。Safari は 15.4 から接頭辞なしで利用可）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/text-combine-upright",
      viz: { concept: "none" },
      challenge: {
        starterHTML: DATE_HTML,
        starterCSS: VERTICAL_TEXT_CSS("tcy", "  \n"),
        task: "日付と時刻の 2 桁の数字（.tcy）を縦中横にして、横並びのまま 1 文字分の高さに収めよう。段落のほかの文字はそのままにします。",
        snapshot: { props: ["text-combine-upright"] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "computedEquals", id: "month", prop: "text-combine-upright", value: "all" },
              { kind: "computedEquals", id: "day", prop: "text-combine-upright", value: "all" },
              { kind: "computedEquals", id: "hour", prop: "text-combine-upright", value: "all" },
            ],
            message: "2 桁の数字（.tcy）に text-combine-upright: all を指定しましょう",
          },
          {
            kind: "computedEquals",
            id: "text",
            prop: "text-combine-upright",
            value: "none",
            message: "段落（.text）全体が縦中横になっています。数字の .tcy にだけ指定しましょう",
          },
        ],
        hints: ["縦中横にしたい数字は、.tcy の span で囲んであります", "text-combine-upright: all;"],
        solution: VERTICAL_TEXT_CSS("tcy", "  text-combine-upright: all;\n"),
      },
    },
  ],
};
