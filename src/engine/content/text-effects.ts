import type { Track } from "./types.js";

// Text effects draw no boxes of their own, so these lessons read computed
// values: the text-shadow list (its colour comes first, then x, y and blur),
// the emphasis-mark style, and the case transform with the letter spacing
// (which computes to px, so 0.08em of 13px reads as 1.04px). Each lesson also
// checks that the text it should not touch keeps its look.

const BANNER_HTML = '<section class="banner"><h2 data-id="title">夏の旅特集</h2><p data-id="lead">海の見える宿を 30 軒えらびました</p></section>';

const BANNER_CSS = (extra: string): string =>
  `.banner {\n  width: 280px;\n  padding: 20px;\n  border-radius: 12px;\n  background: linear-gradient(120deg, #fff6c2, #9fd3f5 60%, #e6f4ff);\n  color: #fff;\n${extra}}\n.banner h2 {\n  margin: 0 0 4px;\n  font-size: 24px;\n}\n.banner p {\n  margin: 0;\n}\n`;

const SALE_HTML = '<p data-id="text" class="text">このセットは <em data-id="mark">本日かぎり</em> の特別価格です。</p>';

const SALE_CSS = (extra: string): string => `.text {\n  font-size: 18px;\n}\n.text em {\n${extra}}\n`;

const CARD_HTML =
  '<article class="card"><span data-id="label" class="label">new arrival</span><h3 data-id="title">春の新作バッグ</h3></article>';

const CARD_CSS = (extra: string): string =>
  `.card {\n  width: 280px;\n  padding: 16px;\n  border-radius: 12px;\n  background: #eef1f8;\n}\n/* 英字の小見出し */\n.label {\n  color: #2f5fd0;\n  font-size: 13px;\n  font-weight: 700;\n${extra}}\n.card h3 {\n  margin: 4px 0 0;\n}\n`;

/** One computed text shadow: a colour, then x, y and blur, the blur not 0. */
const BLURRED_SHADOW = "^rgba?\\([^)]*\\) -?[\\d.]+px -?[\\d.]+px (?!0px)[\\d.]+px";

/** A dark shadow colour: red, green and blue all below 128. */
const DARK_SHADOW = "^rgba?\\((?:\\d|[1-9]\\d|1[01]\\d|12[0-7]), (?:\\d|[1-9]\\d|1[01]\\d|12[0-7]), (?:\\d|[1-9]\\d|1[01]\\d|12[0-7])";

export const textEffectsTrack: Track = {
  id: "text-effects",
  title: "文字の飾り（text-shadow・傍点・大文字）",
  summary: "text-shadow で明るい背景の上の白い文字を読みやすくし、text-emphasis で強調したい語に傍点を付け、text-transform と letter-spacing で英字の小見出しを大文字にそろえる。",
  emoji: "🔠",
  lessons: [
    {
      id: "text-shadow",
      title: "明るい背景の上の白い文字に: text-shadow",
      explanation:
        "<p><code>text-shadow</code> は、文字に影を付けます。値は「横のずれ・縦のずれ・ぼかし・色」で、<code>0 1px 3px rgb(24 32 58 / 0.6)</code> なら、下に 1px ずらして 3px ぼかした、暗い半透明の影です。明るい背景の上の白い文字の縁に暗い影が付くと、文字の形がはっきりします。</p><p>色を書かないと影の色はブラウザ任せになるので、色は必ず指定します。カンマで区切って、複数の影を重ねることもできます。<code>text-shadow</code> は子に受け継がれるので、見出しと本文の両方に効かせるなら親に書けます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/text-shadow",
      viz: { concept: "none" },
      challenge: {
        starterHTML: BANNER_HTML,
        starterCSS: BANNER_CSS(""),
        task: "明るいバナーの上の白い文字が読みにくくなっています。見出しと本文の文字に、下向きにぼかした暗い影を付けよう。",
        snapshot: { props: ["text-shadow"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "computedMatches", id: "title", prop: "text-shadow", pattern: BLURRED_SHADOW },
                  { kind: "computedMatches", id: "lead", prop: "text-shadow", pattern: BLURRED_SHADOW },
                ],
                message: "見出しと本文の文字に、ぼかした影が付いていません（text-shadow: 0 1px 3px rgb(24 32 58 / 0.6) など）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "computedMatches", id: "title", prop: "text-shadow", pattern: DARK_SHADOW },
                  { kind: "computedMatches", id: "lead", prop: "text-shadow", pattern: DARK_SHADOW },
                ],
                message: "影の色が明るすぎます（白い文字の縁を際立たせるには、暗い色の影にします。色を書かないと、影の色はブラウザ任せになります）",
              },
            ],
          },
        ],
        hints: ["影は「横のずれ・縦のずれ・ぼかし・色」の順で書けます。親に書けば子にも受け継がれます", ".banner { text-shadow: 0 1px 3px rgb(24 32 58 / 0.6); }"],
        solution: BANNER_CSS("  text-shadow: 0 1px 3px rgb(24 32 58 / 0.6);\n"),
      },
    },
    {
      id: "text-emphasis",
      title: "強調したい語に傍点を: text-emphasis",
      explanation:
        "<p><code>em</code> 要素は、ふつう斜体（<code>font-style: italic</code>）で表示されます。斜体の書体がないフォントでは、ブラウザが文字を傾けて斜体をまねします。日本語の文章では、強調したい語の上に点を打つ<b>傍点</b>もよく使われます。</p><p><code>text-emphasis</code> は、文字に傍点などの印を付けます。<code>filled sesame</code> で「﹅」の傍点になり、横書きでは文字の上に付きます（形には dot・circle なども選べ、色は文字の色になります）。<code>em</code> は斜体をやめて <code>font-style: normal</code> にします。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/text-emphasis",
      viz: { concept: "none" },
      challenge: {
        starterHTML: SALE_HTML,
        starterCSS: SALE_CSS(""),
        task: "「本日かぎり」が em の初期設定で斜体になり、読みにくくなっています。斜体をやめて、代わりに傍点（﹅）で強調しよう。",
        snapshot: { props: ["text-emphasis-style", "font-style"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "computedEquals",
                id: "mark",
                prop: "text-emphasis-style",
                value: "filled sesame",
                message: "「本日かぎり」に傍点（﹅）が付いていません（text-emphasis: filled sesame）",
              },
              {
                kind: "computedEquals",
                id: "mark",
                prop: "font-style",
                value: "normal",
                message: "「本日かぎり」が斜体のままです（em の初期設定の斜体を、font-style: normal でやめます）",
              },
              {
                kind: "computedEquals",
                id: "text",
                prop: "text-emphasis-style",
                value: "none",
                message: "傍点が文全体に付いています（強調したい語の em だけに付けます）",
              },
            ],
          },
        ],
        hints: ["傍点は text-emphasis。斜体をやめるのは font-style です", ".text em { font-style: normal; text-emphasis: filled sesame; }"],
        solution: SALE_CSS("  font-style: normal;\n  text-emphasis: filled sesame;\n"),
      },
    },
    {
      id: "text-transform",
      title: "英字の小見出しを大文字に: text-transform と letter-spacing",
      explanation:
        "<p><code>text-transform: uppercase</code> は、HTML の英字はそのままで、表示だけを<b>大文字</b>にします。小さな英字の見出しやラベルを大文字にそろえるときに使い、大文字どうしが詰まって見える分は、<code>letter-spacing</code> で少し（0.08em ほど）字間を広げます。</p><p><code>letter-spacing</code> は文字と文字の間に足す間隔で、大きくしすぎると単語が読めなくなります。また、大文字ばかりの長い文章は読みにくいので、大文字にするのは短いラベルにとどめます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/text-transform",
      viz: { concept: "none" },
      challenge: {
        starterHTML: CARD_HTML,
        starterCSS: CARD_CSS(""),
        task: "英字のラベル「new arrival」を、表示だけ大文字（NEW ARRIVAL）にし、字間を 0.08em ほど広げよう（見出しの字間はそのまま）。",
        snapshot: { props: ["text-transform", "letter-spacing"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "computedEquals",
                id: "label",
                prop: "text-transform",
                value: "uppercase",
                message: "ラベルが大文字になっていません（text-transform: uppercase。HTML の文字は変えません）",
              },
              {
                kind: "computedMatches",
                id: "label",
                prop: "letter-spacing",
                pattern: "^(?:0\\.[6-9]\\d*|1(?:\\.\\d+)?|2(?:\\.[0-5]\\d*)?)px$",
                message: "ラベルの字間が、0.05em〜0.2em ほど広がっていません（letter-spacing: 0.08em など。13px の文字なら 1px ほどです）",
              },
              {
                kind: "computedEquals",
                id: "title",
                prop: "letter-spacing",
                value: "normal",
                message: "見出しの字間まで変わっています（ラベルだけを広げます）",
              },
            ],
          },
        ],
        hints: ["表示だけ大文字にするのは text-transform、字間は letter-spacing です", ".label { text-transform: uppercase; letter-spacing: 0.08em; }"],
        solution: CARD_CSS("  text-transform: uppercase;\n  letter-spacing: 0.08em;\n"),
      },
    },
  ],
};
