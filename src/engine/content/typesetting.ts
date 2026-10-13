import type { ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Indents are judged where the text starts. A span around the first words of
// each paragraph shows how far its first line is indented (exactly 1em: 20px
// in the larger lead paragraph, 16px in the others). In the notes, the ※ and
// the note's text are separate spans: the text wraps onto a second line, and
// an inline box's rect starts at its leftmost line, so the text's left edge is
// where the wrapped lines start. The last steps read the computed text-indent,
// so that padding or positioning that mimics the indent fails with a reason.
// Underlines leave no box to measure, so that lesson reads the computed offset
// and thickness.

const STORY_HTML =
  '<article data-id="story" class="story">' +
  '<p data-id="p1" class="lead"><span data-id="s1">駅から</span>坂をのぼった先に、小さな古書店があります。</p>' +
  '<p data-id="p2"><span data-id="s2">店主は</span>毎朝、店先の棚に百円の文庫本を並べます。通りがかりの人が足を止め、一冊ずつ手に取っていきます。</p>' +
  "</article>";

const STORY_CSS = (extra: string): string =>
  `.story {\n  width: 280px;\n}\n.story p {\n  margin: 0 0 8px;\n  line-height: 1.7;\n${extra}}\n/* 書き出しの段落は大きく */\n.lead {\n  font-size: 20px;\n}\n`;

const NOTES_HTML =
  '<div data-id="notes" class="notes">' +
  '<p data-id="n1" class="note"><span data-id="m1">※</span><span data-id="b1">価格はすべて税込みです。お届けまでに 3〜5 日ほどかかります。</span></p>' +
  '<p data-id="n2" class="note"><span data-id="m2">※</span><span data-id="b2">セール品は、お客様のご都合による返品をお受けできません。</span></p>' +
  "</div>";

const NOTES_CSS = (extra: string): string =>
  `.notes {\n  width: 280px;\n  font-size: 14px;\n  line-height: 1.6;\n}\n.note {\n  margin: 0 0 6px;\n${extra}}\n`;

const LINKS_HTML =
  '<p data-id="para" class="para">ご不明な点は<a data-id="faq" href="#">よくある質問（FAQ）</a>をご覧ください。お急ぎの方は<a data-id="chat" href="#">お問い合わせ（チャット）</a>からどうぞ。</p>';

const LINKS_CSS = (extra: string): string => `.para {\n  width: 280px;\n  line-height: 1.8;\n}\n.para a {\n  color: #2f5fd0;\n${extra}}\n`;

/** `id` starts `min`..`max` px right of the left edge of `from`. */
const startsAt = (from: string, id: string, at: number): ValidatorSpec => ({
  kind: "offset",
  a: from,
  b: id,
  edgeA: "left",
  edgeB: "left",
  min: at - 0.5,
  max: at + 0.5,
});

const hangs = (mark: string, body: string): ValidatorSpec[] => [startsAt("notes", mark, 0), startsAt("notes", body, 14)];

export const typesettingTrack: Track = {
  id: "typesetting",
  title: "文字の組み方（字下げ・ぶら下げ・下線の位置）",
  summary: "text-indent で段落の頭を 1 字下げ、負の text-indent で ※ の注記をぶら下げ、text-underline-offset でリンクの下線を文字から離す。",
  emoji: "✒️",
  lessons: [
    {
      id: "text-indent",
      title: "段落の頭を 1 字下げる: text-indent: 1em",
      explanation:
        "<p>日本語の文章では、段落の書き出しを 1 文字下げるのが一般的です。<code>text-indent</code> は、ブロックの<b>1 行目の前</b>に空白を入れます。2 行目からは下がらないので、全部の行が動く <code>padding-left</code> とは違います。</p><p>1 文字ぶんは <code>1em</code>（その要素の文字の大きさ）です。<code>text-indent</code> は子に受け継がれますが、受け継がれるのは<b>計算した後の長さ</b>なので、親の <code>.story</code> に <code>1em</code> と書くと、文字の大きい段落にも親の 16px のまま伝わります。段落（<code>p</code>）に直接書けば、段落ごとの文字の大きさで 1 文字ぶんになります。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/text-indent",
      viz: { concept: "none" },
      challenge: {
        starterHTML: STORY_HTML,
        starterCSS: STORY_CSS(""),
        task: "どの段落も、書き出しを 1 文字ぶん（1em）下げよう。文字の大きい最初の段落は、その大きさの 1 文字ぶんです。",
        snapshot: { props: ["text-indent"] },
        validators: [
          {
            kind: "allOf",
            of: [
              { ...startsAt("story", "s2", 16), message: "段落の書き出しが 1 文字ぶん下がっていません（text-indent: 1em）" },
              {
                ...startsAt("story", "s1", 20),
                message: "文字の大きい段落（20px）で、書き出しが 1 文字ぶん（20px）下がっていません（px で書いたり、親の .story に 1em と書いたりすると 16px のままです。段落の p に 1em を書きます）",
              },
              {
                kind: "computedMatches",
                id: "p2",
                prop: "text-indent",
                pattern: "^(?!0px$)",
                message: "padding や margin ではなく、text-indent で下げましょう（下がるのは 1 行目だけで、2 行目からは左端にそろいます）",
              },
            ],
          },
        ],
        hints: ["1 行目だけを下げるのは text-indent。1 文字ぶんは 1em です", ".story p { text-indent: 1em; }"],
        solution: STORY_CSS("  text-indent: 1em;\n"),
      },
    },
    {
      id: "hanging-indent",
      title: "※ の注記をぶら下げる: 負の text-indent",
      explanation:
        "<p>「※」で始まる注記は、2 行目からの文字を ※ の右にそろえる<b>ぶら下げ</b>にすると、どこからが次の注記か分かりやすくなります。</p><p><code>padding-left: 1em</code> で全体を 1 文字ぶん右へ寄せ、<code>text-indent: -1em</code> で<b>1 行目だけ</b>を 1 文字ぶん左へ戻します。<code>text-indent</code> には負の値も使え、1 行目が左へはみ出します（ここでは padding の中に収まります）。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。1 行目以外を下げる <code>text-indent: 1em hanging</code> という書き方もありますが、Chrome が対応したのは 146（2026 年 3 月）からと新しいので、ここでは負の値を使います。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/text-indent",
      viz: { concept: "none" },
      challenge: {
        starterHTML: NOTES_HTML,
        starterCSS: NOTES_CSS(""),
        task: "注記の 2 行目が「※」の下から始まっています。※ だけを左に出し、2 行目からの文字を ※ の右（1 文字ぶん右）にそろえよう。",
        snapshot: { props: ["text-indent"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [...hangs("m1", "b1"), ...hangs("m2", "b2")],
                message: "※ だけが左に出て、2 行目からの文字が ※ の右（1 文字ぶん）にそろう形になっていません（padding-left: 1em と text-indent: -1em）",
              },
              {
                kind: "computedMatches",
                id: "n1",
                prop: "text-indent",
                pattern: "^-|hanging",
                message: "position や flex で ※ を動かすのではなく、padding-left と負の text-indent でぶら下げましょう（1 行目だけが左に出ます）",
              },
              {
                kind: "computedMatches",
                id: "n1",
                prop: "text-indent",
                pattern: "^(?:-14px|14px hanging)$",
                message: "ずらす幅が、※ 1 文字ぶん（1em＝14px）になっていません（2 行目が ※ の右端とそろいません。px ではなく 1em で書くと、文字の大きさに合います）",
              },
            ],
          },
        ],
        hints: ["全体を padding-left で 1 文字ぶん右へ寄せ、1 行目だけを text-indent で 1 文字ぶん左へ戻します", ".note { padding-left: 1em; text-indent: -1em; }"],
        solution: NOTES_CSS("  padding-left: 1em;\n  text-indent: -1em;\n"),
      },
    },
    {
      id: "underline-offset",
      title: "下線を文字から離す: text-underline-offset",
      explanation:
        "<p>リンクの下線は、初期値の <code>auto</code> ではブラウザが位置と太さを決めるので、文字に近すぎて読みにくいことがあります。</p><p><code>text-underline-offset</code> は<b>下線の位置</b>を、本来の位置からずらします。<code>em</code> で書くと、文字の大きさに合わせて離れ具合も変わります（MDN もこの単位を勧めています）。<code>text-decoration-thickness</code> は<b>線の太さ</b>を決めます。どちらも下線を残したまま見た目だけを整えられます。なお <code>text-underline-offset</code> は、<code>text-decoration</code> の一括指定には含まれません。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/text-underline-offset",
      viz: { concept: "none" },
      challenge: {
        starterHTML: LINKS_HTML,
        starterCSS: LINKS_CSS(""),
        task: "リンクの下線が文字に近く、読みにくくなっています。下線を文字から少し（0.2em ほど）離し、線の太さを 1px にそろえよう。",
        snapshot: { props: ["text-underline-offset", "text-decoration-thickness"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "computedMatches", id: "faq", prop: "text-underline-offset", pattern: "^[2-7](?:\\.\\d+)?px$" },
                  { kind: "computedMatches", id: "chat", prop: "text-underline-offset", pattern: "^[2-7](?:\\.\\d+)?px$" },
                ],
                message: "下線が文字から少し離れていません（text-underline-offset: 0.2em など。離しすぎると、どの文字の下線か分かりにくくなります）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "computedMatches", id: "faq", prop: "text-decoration-thickness", pattern: "^(?:1(?:\\.\\d+)?|2)px$" },
                  { kind: "computedMatches", id: "chat", prop: "text-decoration-thickness", pattern: "^(?:1(?:\\.\\d+)?|2)px$" },
                ],
                message: "下線の太さが 1px になっていません（text-decoration-thickness: 1px。auto のままだと、フォントやブラウザで太さが変わります）",
              },
            ],
          },
        ],
        hints: ["下線の位置は text-underline-offset、太さは text-decoration-thickness です", ".para a { text-underline-offset: 0.2em; text-decoration-thickness: 1px; }"],
        solution: LINKS_CSS("  text-underline-offset: 0.2em;\n  text-decoration-thickness: 1px;\n"),
      },
    },
  ],
};
