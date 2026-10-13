import type { ValidatorSpec } from "../validate/primitives.js";
import { svgUri } from "./svg-uri.js";
import type { Track } from "./types.js";

// Attribute selectors are judged by computed values on every candidate, the
// ones that must match and the ones that must not: the PDF links in any letter
// case get the icon's padding while a PNG and an HTML page about PDFs do not;
// only items whose tags include the word "sale" are highlighted ("wholesale"
// is not); and every English paragraph turns italic, including en-US and the
// ones that inherit English from their quote, while the Japanese one does not.

const all = (ids: readonly string[], prop: string, value: string): ValidatorSpec[] =>
  ids.map((id) => ({ kind: "computedEquals", id, prop, value }) as const);

const PDF_ICON = svgUri(
  20,
  20,
  "<rect x='3' y='1' width='14' height='18' rx='2' fill='#c62828'/><path d='M7 7h6M7 11h6M7 15h4' stroke='#fff' stroke-width='1.6'/>",
);

const FILES_HTML =
  '<ul class="files">' +
  '<li><a data-id="f1" href="guide.pdf">利用の手引き</a></li>' +
  '<li><a data-id="f2" href="price.PDF">料金表</a></li>' +
  '<li><a data-id="f3" href="notice.Pdf">休館のお知らせ</a></li>' +
  '<li><a data-id="f4" href="map.png">会場の地図</a></li>' +
  '<li><a data-id="f5" href="pdf-help.html">PDF の開き方</a></li>' +
  "</ul>";

const FILES_CSS = (selector: string): string =>
  `.files {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.files li {\n  margin-bottom: 8px;\n}\n/* PDF へのリンクには、赤い書類の印を付ける */\n${selector} {\n  padding-left: 24px;\n  background: var(--pdf) no-repeat left center / 20px 20px;\n}\n/* 画像のデータ（SVG）。ここは変えなくて大丈夫です */\n.files {\n  --pdf: url("${PDF_ICON}");\n}\n`;

const ITEMS_HTML =
  '<ul class="items">' +
  '<li data-id="p1" data-tags="new sale">春のコート</li>' +
  '<li data-id="p2" data-tags="wholesale">業務用のセット</li>' +
  '<li data-id="p3" data-tags="sale">夏のシャツ</li>' +
  '<li data-id="p4" data-tags="new">秋のニット</li>' +
  "</ul>";

const ITEMS_CSS = (selector: string): string =>
  `.items {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.items li {\n  margin-bottom: 6px;\n  padding: 6px 10px;\n  border-radius: 6px;\n  background: #eef1f8;\n}\n/* タグに sale がある商品（セール中）を目立たせる */\n${selector} {\n  background: #fdeaed;\n  color: #a92e45;\n}\n`;

const POST_HTML =
  '<article class="post">' +
  '<p data-id="ja">春の講座の案内です。英語のクラスもあります。</p>' +
  '<p data-id="en1" lang="en">Spring classes start in April.</p>' +
  '<p data-id="en2" lang="en-US">Seats are limited.</p>' +
  '<blockquote lang="en"><p data-id="en3">Join us and learn together!</p></blockquote>' +
  "</article>";

const POST_CSS = (selector: string): string =>
  `.post p {\n  margin: 0 0 8px;\n}\n.post blockquote {\n  margin: 0;\n  padding-left: 12px;\n  border-left: 3px solid #d6dded;\n}\n/* 英語の段落だけを斜体にする */\n${selector} {\n  font-style: italic;\n}\n`;

export const attributeSelectorsTrack: Track = {
  id: "attribute-selectors",
  title: "属性セレクタの応用（$= と i・~=・:lang()）",
  summary: "[href$=\".pdf\" i] で大文字の拡張子もまとめて選び、~= で空白で区切った語を 1 つずつ調べ、:lang(en) で親から受け継いだ言語も選ぶ。",
  emoji: "🔍",
  lessons: [
    {
      id: "attr-ends-with-i",
      title: "拡張子で印を付ける: [href$=\".pdf\" i]",
      explanation:
        "<p><code>[href$=\".pdf\"]</code> は、href の値が <code>.pdf</code> で<b>終わる</b>要素を選びます。値は大文字と小文字を区別して比べられるので、<code>price.PDF</code> や <code>notice.Pdf</code> には合いません。</p><p><code>]</code> の前に <code>i</code> を書いた <code>[href$=\".pdf\" i]</code> は、大文字と小文字を区別せずに比べます（英字の範囲）。途中に含むだけで合う <code>*=</code> にすると、<code>pdf-help.html</code> のような別のページまで選んでしまうので、拡張子は <code>$=</code> で末尾を調べます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/Attribute_selectors",
      viz: { concept: "none" },
      challenge: {
        starterHTML: FILES_HTML,
        starterCSS: FILES_CSS('.files a[href$=".pdf"]'),
        task: "PDF の印が、拡張子が小文字のリンクにしか付いていません。price.PDF や notice.Pdf にも付けよう（PDF ではない地図と「PDF の開き方」のページには付けません）。",
        snapshot: { props: ["padding-left"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: all(["f1", "f2", "f3"], "padding-left", "24px"),
                message: "拡張子が大文字の PDF（price.PDF・notice.Pdf）に、印が付いていません（属性の値は大文字と小文字を区別して比べられます。] の前に i を書くと区別しなくなります）",
              },
              {
                kind: "allOf",
                of: all(["f4", "f5"], "padding-left", "0px"),
                message: "PDF ではないリンク（地図・PDF の開き方）にも印が付いています（*= は途中に含むだけで合うので、拡張子は $= で末尾を調べます）",
              },
            ],
          },
        ],
        hints: ["大文字と小文字を区別しないで比べる書き方があります", '.files a[href$=".pdf" i] { … }'],
        solution: FILES_CSS('.files a[href$=".pdf" i]'),
      },
    },
    {
      id: "attr-word",
      title: "空白で区切った語で選ぶ: [data-tags~=\"sale\"]",
      explanation:
        "<p><code>[data-tags*=\"sale\"]</code> は、値の<b>どこかに</b> sale が含まれていれば合うので、<code>wholesale</code>（業務用）まで選んでしまいます。<code>[data-tags=\"sale\"]</code> は値<b>全体</b>との一致なので、<code>new sale</code> には合いません。</p><p><code>[data-tags~=\"sale\"]</code> は、値を<b>空白で区切った語のどれか</b>が sale とぴったり同じときに合います。class 属性のように、1 つの属性に語をいくつか並べるときに使います。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/Attribute_selectors",
      viz: { concept: "none" },
      challenge: {
        starterHTML: ITEMS_HTML,
        starterCSS: ITEMS_CSS('.items [data-tags*="sale"]'),
        task: "タグ（data-tags）に sale がある商品だけを赤くしたいのに、wholesale（業務用）の商品まで赤くなっています。sale という語があるもの（new sale と sale）だけを赤くしよう。",
        snapshot: { props: ["background-color"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: all(["p1", "p3"], "background-color", "rgb(253, 234, 237)"),
                message: "「new sale」のように、ほかのタグと並んだ sale の商品が赤くなっていません（= は値全体との一致です。空白で区切った語のどれかと比べるのは ~= です）",
              },
              {
                kind: "allOf",
                of: all(["p2", "p4"], "background-color", "rgb(238, 241, 248)"),
                message: "業務用のセット（wholesale）や秋のニットまで赤くなっています（*= は値の途中に含むだけで合います。sale という語そのものを調べるのは ~= です）",
              },
            ],
          },
        ],
        hints: ["空白で区切った語のどれかとぴったり同じかを調べる記号があります", '.items [data-tags~="sale"] { … }'],
        solution: ITEMS_CSS('.items [data-tags~="sale"]'),
      },
    },
    {
      id: "lang-pseudo",
      title: "言語で選ぶ: :lang(en)",
      explanation:
        "<p><code>[lang=\"en\"]</code> は、lang 属性を<b>自分で持ち</b>、値がぴったり <code>en</code> の要素だけを選びます。lang 属性のない要素は親から言語を受け継ぎますが、属性セレクタはそれを見ません。<code>lang=\"en-US\"</code> のような地域つきの値にも合いません。</p><p><code>:lang(en)</code> は、要素が<b>どの言語として扱われているか</b>で選ぶので、<code>en-US</code> も、<code>lang=\"en\"</code> の引用の中の段落も選べます。斜体の字形がないフォントでは、ブラウザが文字を傾けて斜体を作るので、日本語の文には付けず、英語の部分だけに付けます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/:lang",
      viz: { concept: "none" },
      challenge: {
        starterHTML: POST_HTML,
        starterCSS: POST_CSS('.post p[lang="en"]'),
        task: "英語の段落を斜体にしたいのに、lang=\"en-US\" の段落と、英語の引用（blockquote lang=\"en\"）の中の段落が斜体になっていません。英語の段落をすべて斜体にしよう（日本語の段落はそのまま）。",
        snapshot: { props: ["font-style"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: all(["en1", "en2", "en3"], "font-style", "italic"),
                message: "lang=\"en-US\" の段落や、英語の引用の中の段落が斜体になっていません（[lang=\"en\"] は、その属性を自分で持ち、値がぴったり en の要素だけに合います。:lang(en) なら、en-US も、親から受け継いだ言語も合います）",
              },
              {
                kind: "computedEquals",
                id: "ja",
                prop: "font-style",
                value: "normal",
                message: "日本語の段落まで斜体になっています（英語の段落だけを選びます）",
              },
            ],
          },
        ],
        hints: ["要素がどの言語として扱われているかで選ぶ擬似クラスがあります", ".post p:lang(en) { … }"],
        solution: POST_CSS(".post p:lang(en)"),
      },
    },
  ],
};
