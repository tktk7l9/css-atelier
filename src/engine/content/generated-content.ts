import type { ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Pseudo-elements have no data-id, so they are judged by the text they push
// aside: each item's text sits in a span, and a generated box before it moves
// the span right (a 10px dot with an 8px margin moves it 18px), while one after
// it widens the link around the span. Chapter numbers in upper-roman widen
// with the count (I, II, III), so numbers that do not count up (every chapter
// "I." or "0.", the classic missing counter-increment) or that are not roman
// leave the chapter titles lined up instead of stepping right.

const STATUSES = [
  ["s1", "live", "公開中"],
  ["s2", "draft", "下書き"],
  ["s3", "stopped", "停止中"],
] as const;

const STATUS_HTML =
  '<ul class="statuses">' +
  STATUSES.map(([id, cls, text]) => `<li data-id="${id}" class="status ${cls}"><span data-id="${id}-text">${text}</span></li>`).join("") +
  "</ul>";

const STATUS_CSS = (extra: string): string =>
  `.statuses {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.status {\n  margin-bottom: 8px;\n  font-size: 14px;\n}\n.live {\n  color: #2f9d5b;\n}\n.draft {\n  color: #b9791b;\n}\n.stopped {\n  color: #d93636;\n}\n.status::before {\n${extra}  width: 10px;\n  height: 10px;\n  margin-right: 8px;\n  border-radius: 50%;\n  background: currentColor;\n}\n`;

const LINKS = [
  ["in1", "/guide/", "使い方ガイド"],
  ["ext1", "https://developer.mozilla.org/ja/", "MDN Web Docs"],
  ["in2", "#faq", "よくある質問"],
  ["ext2", "https://github.com/tktk7l9/css-atelier", "GitHub のリポジトリ"],
] as const;

const LINKS_HTML =
  '<ul class="links">' +
  LINKS.map(([id, href, text]) => `<li><a data-id="${id}" href="${href}"><span data-id="${id}-text">${text}</span></a></li>`).join("") +
  "</ul>";

const LINKS_CSS = (extra: string): string =>
  `.links {\n  margin: 0;\n  padding-left: 20px;\n  font-size: 14px;\n  line-height: 1.8;\n}\n.links a {\n  color: #2f5fd0;\n}\n${extra}`;

const CHAPTERS = [
  ["c1", "はじめに"],
  ["c2", "使い方"],
  ["c3", "よくある質問"],
] as const;

const TOC_HTML =
  '<div data-id="toc" class="toc">' +
  CHAPTERS.map(([id, text]) => `<h3 data-id="${id}" class="chapter"><span data-id="${id}-text">${text}</span></h3>`).join("") +
  "</div>";

const TOC_CSS = (toc: string, chapter: string, before: string): string =>
  `${toc}.chapter {\n  margin: 0 0 8px;\n  font-size: 16px;\n${chapter}}\n.chapter::before {\n${before}  margin-right: 8px;\n  color: #2f5fd0;\n}\n`;

/** The text of item `id` starts within [min, max] px of the item's own left edge. */
const textStart = (id: string, min: number, max?: number): ValidatorSpec => ({
  kind: "offset",
  a: id,
  b: `${id}-text`,
  edgeA: "left",
  edgeB: "left",
  min,
  ...(max === undefined ? {} : { max }),
});

/** Link `id` ends at least `min` / at most `max` px after its text. */
const tail = (id: string, bounds: { readonly min?: number; readonly max?: number }): ValidatorSpec => ({
  kind: "offset",
  a: `${id}-text`,
  b: id,
  edgeA: "right",
  edgeB: "right",
  ...bounds,
});

/** Chapter `b`'s title starts at least 3px right of chapter `a`'s: its number is wider. */
const steppedRight = (a: string, b: string): ValidatorSpec => ({
  kind: "offset",
  a: `${a}-text`,
  b: `${b}-text`,
  edgeA: "left",
  edgeB: "left",
  min: 3,
});

export const generatedContentTrack: Track = {
  id: "generated-content",
  title: "生成コンテンツ（::before・::after）",
  summary: "::before と ::after で HTML にない飾りや印を足し、属性セレクタで付ける相手を選び、CSS カウンターで番号を振る。",
  emoji: "🔖",
  lessons: [
    {
      id: "before-content",
      title: "飾りを足す: ::before と content",
      explanation:
        "<p><code>::before</code> は、要素の中身の<b>先頭に、HTML にない箱</b>を足す擬似要素です（<code>::after</code> は末尾）。アイコンや記号、引用符など、意味を持たない装飾を CSS だけで付けられます。</p><p>ただし、<b><code>content</code> を指定しないと擬似要素は作られません</b>。文字のない飾りでも <code>content: \"\"</code>（空の文字列）が必要です。また、擬似要素は既定で<b>インライン</b>なので、<code>width</code> や <code>height</code> が効きません。大きさのある丸にするには <code>display: inline-block</code> にします。<code>&lt;img&gt;</code> のような置換要素には付けられません。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/::before",
      viz: { concept: "none" },
      challenge: {
        starterHTML: STATUS_HTML,
        starterCSS: STATUS_CSS(""),
        task: "ステータス（公開中・下書き・停止中）の前に、文字と同じ色の丸を付けたいのに、::before のルールを書いても何も表示されません。直径 10px の丸が、文字の 8px 手前に並ぶようにしよう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                // Generated at all: the text moved right (inline) or down (block).
                kind: "anyOf",
                of: [
                  textStart("s1", 4),
                  { kind: "offset", a: "s1", b: "s1-text", edgeA: "top", edgeB: "top", min: 8 },
                ],
                message: "丸が表示されていません（::before は content がないと作られません。文字のない飾りなら content: \"\" を足します）",
              },
              {
                kind: "offset",
                a: "s1",
                b: "s1-text",
                edgeA: "top",
                edgeB: "top",
                max: 6,
                message: "丸と文字が別の行に分かれています（display: block ではなく inline-block にして、文字と同じ行に並べましょう）",
              },
              {
                kind: "allOf",
                of: [textStart("s1", 16, 20), textStart("s2", 16, 20), textStart("s3", 16, 20)],
                message: "丸の大きさが反映されていません（擬似要素は既定でインラインなので width と height が効きません。display: inline-block を足しましょう）",
              },
            ],
          },
        ],
        hints: ["擬似要素は content がないと作られません。文字のない飾りなら content: \"\" です", ".status::before { content: \"\"; display: inline-block; … }"],
        solution: STATUS_CSS('  content: "";\n  display: inline-block;\n'),
      },
    },
    {
      id: "after-attribute",
      title: "外部リンクに印を付ける: [href^=…]::after",
      explanation:
        "<p><b>属性セレクタ</b>は、要素の属性の値で選びます。<code>a[href^=\"https://\"]</code> は「href が https:// で<b>始まる</b>リンク」、<code>[href$=\".pdf\"]</code> は「.pdf で終わる」、<code>[href*=\"example\"]</code> は「example を含む」です。クラスを付け足さなくても、外部サイトへのリンクだけを選べます。</p><p><code>::after</code> は要素の中身の<b>末尾</b>に飾りを足します。<code>content: \" ↗\"</code> のように文字も入れられます。擬似要素の文字は、読み上げソフトで確実に読まれるとは限りません。<code>content: \" ↗\" / \"（外部サイト）\"</code> のように <code>/</code> の後ろに代わりのテキストを書けます（Baseline 2024: Chrome 77・Firefox 128・Safari 17.4 から。未対応のブラウザでは宣言ごと無視されるので、その前に <code>content: \" ↗\";</code> も書いておくと安心です）。</p><p>属性セレクタと <code>::after</code> は、主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/Attribute_selectors",
      viz: { concept: "none" },
      challenge: {
        starterHTML: LINKS_HTML,
        starterCSS: LINKS_CSS(""),
        task: "リンクの一覧のうち、外部サイト（https:// で始まるリンク）にだけ、後ろに「↗」を付けよう。サイト内のページへのリンクには付けません。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [tail("ext1", { min: 6 }), tail("ext2", { min: 6 })],
                message: "外部サイトへのリンク（https:// で始まるもの）の後ろに、印が付いていません",
              },
              {
                kind: "allOf",
                of: [tail("in1", { max: 1 }), tail("in2", { max: 1 })],
                message: "サイト内のリンクにまで印が付いています（属性セレクタ [href^=\"https://\"] で、https:// で始まるものだけを選びましょう）",
              },
            ],
          },
        ],
        hints: ["href が https:// で始まるリンクは a[href^=\"https://\"] で選べます", ".links a[href^=\"https://\"]::after { content: \" ↗\"; }"],
        solution: LINKS_CSS('.links a[href^="https://"]::after {\n  content: " ↗";\n  content: " ↗" / "（外部サイト）";\n}\n'),
      },
    },
    {
      id: "counter-chapters",
      title: "番号を自動で振る: counter-reset と counter()",
      explanation:
        "<p><b>CSS カウンター</b>は、CSS の中で数を数える変数です。親で <code>counter-reset: chapter</code> と書いて 0 から始まるカウンターを用意し、数えたい要素で <code>counter-increment: chapter</code> と 1 ずつ増やします。いまの値は <code>content: counter(chapter)</code> で <code>::before</code> などに表示できます。HTML の順番から番号が決まるので、章を入れ替えても番号を書き直す必要がありません。</p><p><code>counter(chapter, upper-roman)</code> のように 2 つ目に <code>list-style-type</code> の値を書くと、I・II・III のようなローマ数字や、<code>lower-alpha</code>（a・b・c）などの書き方で表示できます。<code>content: counter(chapter, upper-roman) \".\"</code> のように、文字とつなげることもできます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Guides/Counter_styles/Using_counters",
      viz: { concept: "none" },
      challenge: {
        starterHTML: TOC_HTML,
        starterCSS: TOC_CSS("", "", ""),
        task: "目次の章の前に、I.・II.・III. と番号を自動で振ろう。目次（.toc）でカウンター chapter を用意し、章（.chapter）ごとに 1 ずつ増やして、::before にローマ数字で表示します。",
        snapshot: { props: ["counter-reset"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                ...textStart("c1", 10),
                message: "章の前に番号が表示されていません（::before の content に counter(chapter, upper-roman) を書きます）",
              },
              {
                kind: "allOf",
                of: [steppedRight("c1", "c2"), steppedRight("c2", "c3")],
                message: "番号が I・II・III と 1 つずつ増えるローマ数字になっていません（どの章も同じ番号なら、.chapter に counter-increment: chapter を書きます）",
              },
              {
                kind: "computedMatches",
                id: "toc",
                prop: "counter-reset",
                pattern: "\\bchapter\\b",
                message: "番号は振れていますが、目次（.toc）に counter-reset: chapter を書いて、カウンターを用意しましょう（別の目次や入れ子の中でも、1 から数え直せます）",
              },
            ],
          },
        ],
        hints: [".toc { counter-reset: chapter; } と .chapter { counter-increment: chapter; } で数えます", ".chapter::before { content: counter(chapter, upper-roman) \".\"; }"],
        solution: TOC_CSS(
          ".toc {\n  counter-reset: chapter;\n}\n",
          "  counter-increment: chapter;\n",
          '  content: counter(chapter, upper-roman) ".";\n',
        ),
      },
    },
  ],
};
