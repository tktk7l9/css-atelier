import type { Track } from "./types.js";

// A list marker is not an element, so its box cannot be measured. These
// lessons read the computed list-style values on the items (list-style is
// inherited, so a value set on the list shows up on each item), plus the
// geometry the browser's own list styles create: by default a list has
// margins above and below and a padding on the left for the markers, so a
// menu whose items line up with the inside of its box has dropped both.

const MENU_HTML =
  '<nav data-id="nav" class="nav" aria-label="メインメニュー"><ul data-id="menu" class="menu">' +
  '<li data-id="i1"><a href="#">ホーム</a></li><li data-id="i2"><a href="#">料金</a></li><li data-id="i3"><a href="#">お問い合わせ</a></li>' +
  "</ul></nav>";

const MENU_CSS = (extra: string): string =>
  `.nav {\n  width: 240px;\n  padding: 8px 12px;\n  border-radius: 8px;\n  background: #eef1f8;\n}\n${extra}.menu a {\n  display: block;\n  padding: 4px 0;\n  color: #18203a;\n  text-decoration: none;\n}\n`;

const FEATURES_HTML =
  '<ul data-id="features" class="features"><li data-id="f1">送料は全国一律で無料</li><li data-id="f2">30 日以内なら返品できる</li><li data-id="f3">日本語でサポート</li></ul>';

const FEATURES_CSS = (extra: string): string => `.features {\n  margin: 0;\n  padding-left: 1.5em;\n  line-height: 1.8;\n${extra}}\n`;

const AWARDS_HTML =
  '<section data-id="card" class="card"><h3>受賞歴</h3><ul data-id="awards" class="awards">' +
  '<li data-id="a1">グッドデザイン賞</li><li data-id="a2">キッズデザイン賞</li>' +
  "</ul></section>";

const AWARDS_CSS = (extra: string): string =>
  `.card {\n  width: 280px;\n  padding: 16px;\n  border-radius: 12px;\n  background: #eef1f8;\n  text-align: center;\n}\n.card h3 {\n  margin: 0 0 8px;\n  font-size: 16px;\n}\n.awards {\n  margin: 0;\n  padding: 0;\n${extra}}\n`;

export const listMarkersTrack: Track = {
  id: "list-markers",
  title: "リストの印（消す・変える・中に入れる）",
  summary: "list-style: none と余白のリセットでメニューの点を消し、list-style-type に文字列を指定して印を変え、list-style-position: inside で印を文字といっしょに並べる。",
  emoji: "📋",
  lessons: [
    {
      id: "list-style-none",
      title: "メニューの点と字下げを消す: list-style: none",
      explanation:
        "<p><code>ul</code> や <code>ol</code> の項目（<code>li</code>）は <code>display: list-item</code> で、先頭に<b>印（マーカー）</b>が付きます。さらにブラウザは最初から、<code>ul</code> に上下の <code>margin</code> と、印を置くための左の <code>padding</code> を付けています（このプレビューでは左に 40px）。</p><p>メニューのように印がいらないリストは、<code>list-style: none</code> で印を消し、<code>margin: 0</code> と <code>padding: 0</code> で余白も消します。<code>list-style</code> は受け継がれるので、<code>ul</code> に書けば中の <code>li</code> すべてに効きます。</p><p>なお Safari は、<code>list-style: none</code> にしたリストを、<code>nav</code> の中にあるとき以外は読み上げでリストとして扱いません。<code>nav</code> の外のリストには <code>role=\"list\"</code> を付けておきます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/list-style",
      viz: { concept: "none" },
      challenge: {
        starterHTML: MENU_HTML,
        starterCSS: MENU_CSS(""),
        task: "メニューの項目に点（•）が付き、左に大きな字下げと、上下にすき間があります。点を消し、項目をメニューの枠の左上（内側の余白のすぐ内側）にそろえよう。",
        snapshot: { props: ["list-style-type", "display"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "anyOf",
                of: [
                  { kind: "computedEquals", id: "i1", prop: "list-style-type", value: "none" },
                  { kind: "computedMatches", id: "i1", prop: "display", pattern: "^(?!list-item$)" },
                ],
                message: "項目の点（•）が消えていません（list-style: none）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "offset", a: "nav", b: "i1", edgeA: "left", edgeB: "left", min: 11.5, max: 12.5 },
                  { kind: "offset", a: "nav", b: "i1", edgeA: "top", edgeB: "top", min: 7.5, max: 8.5 },
                ],
                message: "項目がメニューの枠の左上にそろっていません（ul には、ブラウザが最初から上下の margin と左の padding を付けています。margin: 0 と padding: 0 で消します）",
              },
            ],
          },
        ],
        hints: ["点は list-style、左の字下げは ul の padding、上下のすき間は ul の margin です", ".menu { margin: 0; padding: 0; list-style: none; }"],
        solution: MENU_CSS(".menu {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n"),
      },
    },
    {
      id: "list-style-string",
      title: "印を文字に変える: list-style-type: \"✓ \"",
      explanation:
        "<p><code>list-style-type</code> は印の種類を決めます。<code>disc</code>（塗りつぶした円）、<code>circle</code>（白抜きの円）、<code>square</code>（四角）、番号の <code>decimal</code> などの名前のほかに、<b>文字列</b>も指定できます。<code>list-style-type: \"✓ \"</code> と書くと、その文字列がそのまま印になります。印と文字の間をあけたいときは、文字列の中にスペースを入れます。</p><p>印の色は、項目の文字の色（<code>currentColor</code>）と同じです。印だけを選ぶ <code>::marker</code> もありますが、Safari では <code>color</code> と <code>font-size</code> しか効かず、<code>content</code> で印を変えることはできません。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/list-style-type",
      viz: { concept: "none" },
      challenge: {
        starterHTML: FEATURES_HTML,
        starterCSS: FEATURES_CSS(""),
        task: "特長のリストの印を、点（•）からチェックマーク「✓」に変えよう（印と文字の間には半角スペースを 1 つ）。",
        snapshot: { props: ["list-style-type"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "computedMatches",
                id: "f1",
                prop: "list-style-type",
                pattern: '^"[✓✔]',
                message: "印がチェックマークになっていません（list-style-type に \"✓ \" のような文字列を指定します。::marker の content は Safari では効きません）",
              },
              {
                kind: "computedMatches",
                id: "f1",
                prop: "list-style-type",
                pattern: '^"[✓✔]\\s+"$',
                message: "印と文字がくっついています（\"✓ \" のように、文字列の中で印のあとにスペースを入れます）",
              },
            ],
          },
        ],
        hints: ["list-style-type には、disc などの名前のほかに文字列も指定できます", '.features { list-style-type: "✓ "; }'],
        solution: FEATURES_CSS('  list-style-type: "✓ ";\n'),
      },
    },
    {
      id: "list-style-inside",
      title: "印を文字といっしょに並べる: list-style-position: inside",
      explanation:
        "<p><code>list-style-position</code> は印の位置を決めます。初期値の <code>outside</code> では、印は項目の<b>箱の外</b>に置かれます。そのため <code>text-align: center</code> で文字を中央にそろえても、印だけが左に取り残されます（ここでは <code>padding: 0</code> なので、印はカードの余白にはみ出しています）。</p><p><code>inside</code> にすると、印は項目の<b>中身の先頭</b>に入り、文字といっしょに並びます。中央ぞろえのリストや、枠の中に印を収めたいときに使います。ただし文が折り返すと、2 行目は印の下から始まるので、長い文の箇条書きには <code>outside</code> と左の <code>padding</code> が向いています。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/list-style-position",
      viz: { concept: "none" },
      challenge: {
        starterHTML: AWARDS_HTML,
        starterCSS: AWARDS_CSS(""),
        task: "中央ぞろえのリストで、印（•）だけが左端に離れています。印を項目の中に入れて、文字といっしょに中央に並べよう（印は消さない）。",
        snapshot: { props: ["list-style-position", "list-style-type"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "computedEquals",
                id: "a1",
                prop: "list-style-position",
                value: "inside",
                message: "印が項目の外（左端）に出ています（list-style-position: inside で、印を項目の中に入れます）",
              },
              {
                kind: "computedMatches",
                id: "a1",
                prop: "list-style-type",
                pattern: "^(?!none$)",
                message: "印が消えています（印は残したまま、項目の中に入れましょう）",
              },
            ],
          },
        ],
        hints: ["印の位置は list-style-position。初期値の outside は、項目の箱の外に印を置きます", ".awards { list-style-position: inside; }"],
        solution: AWARDS_CSS("  list-style-position: inside;\n"),
      },
    },
  ],
};
