import type { ValidatorSpec } from "../validate/primitives.js";
import { svgUri } from "./svg-uri.js";
import type { Track } from "./types.js";

// Intrinsic sizes come from the content, so these lessons are judged by
// geometry. Text widths depend on the learner's fonts, so a box is never
// compared with a pixel width of text: it is compared with the span that holds
// the text (the label column ends where the longest label ends, the underline
// ends where the heading's text ends). Line heights are fixed in px, so "one
// line" is an exact height, and the photos have fixed widths, so a frame as
// wide as its photo is an exact width. Each lesson also wants its keyword in
// the CSS: a fixed width or inline-block can draw the same picture for this
// content, but that is not what the lesson teaches.

const PROFILE_HTML =
  '<dl class="profile">' +
  '<dt data-id="l1"><span data-id="l1-text">メールアドレス</span></dt><dd>taro@example.com</dd>' +
  "<dt><span>電話番号</span></dt><dd>03-1234-5678</dd>" +
  "<dt><span>住所</span></dt><dd>東京都千代田区</dd>" +
  "</dl>";

const PROFILE_CSS = (columns: string): string =>
  `.profile {\n  display: grid;\n  grid-template-columns: ${columns};\n  gap: 8px 16px;\n  width: 340px;\n  margin: 0;\n  padding: 12px 16px;\n  border: 1px solid #dbe4fb;\n  border-radius: 8px;\n}\n.profile dt {\n  color: #4a5578;\n  line-height: 24px;\n}\n.profile dd {\n  margin: 0;\n  line-height: 24px;\n}\n`;

const SUNSET = svgUri(
  160,
  100,
  "<rect width='160' height='100' fill='#ffd27a'/><circle cx='80' cy='62' r='22' fill='#ff8a65'/>" +
    "<rect y='62' width='160' height='38' fill='#2f5fd0'/>" +
    "<path d='M20 76h30M70 86h40M118 74h26' stroke='#9fb2e6' stroke-width='3' stroke-linecap='round'/>",
);

const PARK = svgUri(
  120,
  120,
  "<rect width='120' height='120' fill='#dbe4fb'/><rect y='86' width='120' height='34' fill='#2f9d5b'/>" +
    "<rect x='82' y='50' width='8' height='40' fill='#b9791b'/><circle cx='86' cy='42' r='24' fill='#f5c400'/>" +
    "<rect x='14' y='62' width='48' height='5' rx='2' fill='#18203a'/><rect x='14' y='74' width='48' height='6' rx='2' fill='#18203a'/>" +
    "<rect x='18' y='80' width='4' height='14' fill='#18203a'/><rect x='54' y='80' width='4' height='14' fill='#18203a'/>",
);

const FIGURES_HTML =
  `<figure data-id="f1" class="figure"><img src="${SUNSET}" width="160" height="100" alt="夕暮れの海"><figcaption>夕暮れの海。水平線に沈んでいく夕日を、浜辺から撮りました。</figcaption></figure>` +
  `<figure data-id="f2" class="figure"><img src="${PARK}" width="120" height="120" alt="公園のベンチとイチョウ"><figcaption>雨上がりの公園。ベンチの向こうで、イチョウが色づいています。</figcaption></figure>`;

const FIGURES_CSS = (extra: string): string =>
  `.figure {\n  margin: 0 0 12px;\n  padding: 8px;\n  border-radius: 8px;\n  background: #eef1f8;\n${extra}}\n.figure img {\n  display: block;\n}\n.figure figcaption {\n  margin-top: 6px;\n  font-size: 13px;\n  line-height: 20px;\n}\n`;

const HEADINGS_HTML =
  '<section data-id="col" class="col">' +
  '<h2 data-id="short" class="heading"><span data-id="short-text">お知らせ</span></h2>' +
  '<p class="text">年末年始の営業日についてお知らせします。</p>' +
  '<h2 data-id="long" class="heading">新しい講座「はじめての CSS レイアウト」の受付を始めました</h2>' +
  '<p class="text">定員になりしだい、受付を締め切ります。</p>' +
  "</section>";

const HEADINGS_CSS = (extra: string): string =>
  `.col {\n  width: 280px;\n}\n.heading {\n  margin: 0 0 8px;\n  font-size: 18px;\n  line-height: 28px;\n  border-bottom: 3px solid #2f5fd0;\n${extra}}\n.text {\n  margin: 0 0 20px;\n  font-size: 14px;\n}\n`;

/** Each frame is its photo's width plus 8px of padding on either side. */
const framesFitPhotos: ValidatorSpec = {
  kind: "allOf",
  of: [
    { kind: "sizeApprox", id: "f1", w: 176 },
    { kind: "sizeApprox", id: "f2", w: 136 },
  ],
  message: "枠（.figure）が写真より横に広がっています。2 枚とも、枠を写真の幅に合わせて、キャプションを写真の幅で折り返しましょう",
};

export const intrinsicSizingTrack: Track = {
  id: "intrinsic-sizing",
  title: "中身に合わせた幅",
  summary: "max-content・min-content・fit-content で、要素の幅を中身の長さから決める。",
  emoji: "📏",
  lessons: [
    {
      id: "size-max-content",
      title: "折り返さない幅: max-content",
      explanation:
        "<p>要素の大きさを、<b>中身の長さから</b>決めるキーワードがあります。<code>max-content</code> は、中身を<b>一度も折り返さずに</b>並べたときの幅です。文章なら、どれだけ長くても 1 行のままです。</p><p>グリッドの列の幅にも使えます。<code>grid-template-columns: max-content 1fr</code> なら、左の列は<b>いちばん長いラベルがちょうど 1 行に収まる幅</b>になり、残りを右の列が使います。<code>6em</code> のような固定の幅だと、長いラベルが来たときに折り返し、短いラベルばかりのときは余白が空きます。列を <code>auto</code> にしてもここでは同じ幅になりますが、fr の列がないと auto の列は余った幅まで引き伸ばされます。max-content なら、いつでも中身の幅で止まります。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/max-content",
      viz: { concept: "none" },
      challenge: {
        starterHTML: PROFILE_HTML,
        starterCSS: PROFILE_CSS("6em 1fr"),
        task: "会員情報の表で、ラベルの列（左）の幅を 6em に決めているため、長いラベル「メールアドレス」が 2 行に折り返しています。ラベルの列を、いちばん長いラベルがちょうど 1 行に収まる幅（max-content）にしよう。",
        snapshot: { props: [] },
        validators: [
          // allOf reports only the first unmet step, so a fresh starter gets one message.
          {
            kind: "allOf",
            of: [
              { kind: "sizeApprox", id: "l1", h: 24, message: "長いラベル「メールアドレス」が折り返して、2 行以上になっています" },
              {
                kind: "alignedEdge",
                ids: ["l1", "l1-text"],
                edge: "right",
                message: "ラベルの列の幅が、いちばん長いラベルの長さと合っていません（固定の幅だと、列が余ったり、ラベルがはみ出したりします）",
              },
              { kind: "sourceMatches", pattern: "max-content", message: "列の幅に max-content を使いましょう" },
            ],
          },
        ],
        hints: ["max-content は、中身を一度も折り返さないときの幅です。グリッドの列の幅にも使えます", "grid-template-columns: max-content 1fr;"],
        solution: PROFILE_CSS("max-content 1fr"),
      },
    },
    {
      id: "size-min-content",
      title: "いちばん狭い幅: min-content",
      explanation:
        "<p><code>min-content</code> は、中身を<b>折り返せるところですべて折り返した</b>ときの幅、つまり<b>いちばん狭くできる幅</b>です。英語ならいちばん長い単語の幅、日本語はほぼ 1 文字ごとに折り返せるので 1〜2 文字分です。ただし、写真のように<b>縮められない中身</b>があれば、その幅より狭くはなりません。</p><p>写真とキャプションを囲む <code>figure</code> は、ふつうは親の幅いっぱいに広がります。<code>width: min-content</code> を指定すると、枠は<b>写真の幅</b>になり、キャプションは写真の幅で折り返します。写真の幅を CSS に書かなくても、写真ごとに合わせられます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/min-content",
      viz: { concept: "none" },
      challenge: {
        starterHTML: FIGURES_HTML,
        starterCSS: FIGURES_CSS(""),
        task: "写真の枠（.figure）がプレビューの幅いっぱいに広がり、キャプションが写真の下で長い 1 行になっています。枠を写真の幅に合わせて、キャプションは写真の幅で折り返そう（写真の幅は 2 枚で違います）。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              framesFitPhotos,
              { kind: "sourceMatches", pattern: "min-content", message: "width: min-content で、いちばん狭くできる幅（写真の幅）にしましょう" },
            ],
          },
        ],
        hints: [
          "min-content は、折り返せるところですべて折り返したときの幅です。写真は縮められないので、写真の幅より狭くはなりません",
          ".figure { width: min-content; }",
        ],
        solution: FIGURES_CSS("  width: min-content;\n"),
      },
    },
    {
      id: "size-fit-content",
      title: "はみ出さずに中身の幅に: fit-content",
      explanation:
        "<p><code>fit-content</code> は、<b>中身の幅に合わせつつ、親からははみ出さない</b>幅です。中身が親より短ければ <code>max-content</code>（折り返さない幅）、長ければ親の幅で折り返します。式で書くと <code>min(max-content, max(min-content, 親の幅))</code> です。</p><p>見出しのようなブロック要素は親の幅いっぱいに広がるので、下線（<code>border-bottom</code>）も列の端まで伸びます。<code>width: fit-content</code> なら、短い見出しは文字の幅に、長い見出しは列の幅で折り返します。<code>max-content</code> だと長い見出しが列からはみ出し、<code>min-content</code> だと短い見出しまで 1 文字ずつ折り返します。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能。Firefox は 94 から接頭辞なし）。グリッドの列には、上限を決める <code>fit-content(200px)</code> 関数もあります（width などで使う関数の形は、まだ Firefox の試験的な機能だけです）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/fit-content",
      viz: { concept: "none" },
      challenge: {
        starterHTML: HEADINGS_HTML,
        starterCSS: HEADINGS_CSS(""),
        task: "見出しの下線（border-bottom）が、短い見出しでも列の右端まで伸びています。下線を見出しの文字の幅に合わせよう。ただし長い見出しは、列からはみ出さずに折り返すように。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              // One line is 28px plus the 3px underline.
              {
                kind: "sizeApprox",
                id: "short",
                h: 31,
                message: "短い見出し「お知らせ」が 1 文字ずつ折り返しています（min-content は、折り返せるところですべて折り返します）",
              },
              {
                kind: "alignedEdge",
                ids: ["short", "short-text"],
                edge: "right",
                message: "短い見出しの下線が、文字より右まで伸びています（見出しが列の幅いっぱいに広がっています）",
              },
              {
                kind: "insideContainer",
                id: "long",
                containerId: "col",
                message: "長い見出しが列の右へはみ出しています（max-content は折り返さないので、列より広くなります）",
              },
              { kind: "sourceMatches", pattern: "fit-content", message: "width: fit-content を使いましょう" },
            ],
          },
        ],
        hints: ["fit-content は、中身が短ければ中身の幅、親より長ければ親の幅で折り返します", ".heading { width: fit-content; }"],
        solution: HEADINGS_CSS("  width: fit-content;\n"),
      },
    },
  ],
};
