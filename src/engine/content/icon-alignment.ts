import { svgUri } from "./svg-uri.js";
import type { Track } from "./types.js";

// Icons next to text are judged by box geometry that does not depend on the
// font: in a flex button the icon's and the label's boxes share a vertical
// centre (an inline icon on the baseline does not); icons sized in em are as
// wide and tall as each button's font size (14px and 22px); and the warning
// icon's centre sits half a line (12px of a 24px line) below the top of the
// text, on the first line rather than in the middle of three.

const SAVE = svgUri(
  20,
  20,
  "<path d='M3 3h11l3 3v11H3z' fill='none' stroke='#fff' stroke-width='2' stroke-linejoin='round'/><path d='M6 3h7v5H6z' fill='#fff'/>",
);

const WARN = svgUri(20, 20, "<path d='M10 1l9 17H1z' fill='#e0a100'/><path d='M9 7h2v6H9zM9 14.5h2v2H9z' fill='#fff'/>");

const dataBlock = (selector: string, name: string, uri: string): string =>
  `/* 画像のデータ（SVG）。ここは変えなくて大丈夫です */\n${selector} {\n  ${name}: url("${uri}");\n}\n`;

const BUTTON_HTML =
  '<button data-id="btn" class="btn" type="button"><span data-id="icon" class="icon"></span><span data-id="label">保存する</span></button>';

const BUTTON_CSS = (extra: string): string =>
  `.btn {\n${extra}  padding: 8px 14px;\n  border: 0;\n  border-radius: 8px;\n  background: #2f5fd0;\n  color: #fff;\n  font: inherit;\n}\n.icon {\n  display: inline-block;\n  width: 20px;\n  height: 20px;\n  margin-right: 6px;\n  background: var(--save) no-repeat center / contain;\n}\n${dataBlock(".btn", "--save", SAVE)}`;

const SIZES_HTML =
  '<div class="row">' +
  '<button data-id="small" class="btn small" type="button"><span data-id="icon-s" class="icon"></span>保存</button>' +
  '<button data-id="large" class="btn large" type="button"><span data-id="icon-l" class="icon"></span>保存</button>' +
  "</div>";

const SIZES_CSS = (size: string): string =>
  `.row {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n}\n.btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 6px 12px;\n  border: 0;\n  border-radius: 8px;\n  background: #2f5fd0;\n  color: #fff;\n  font: inherit;\n}\n.small {\n  font-size: 14px;\n}\n.large {\n  font-size: 22px;\n}\n.icon {\n  width: ${size};\n  height: ${size};\n  background: var(--save) no-repeat center / contain;\n}\n${dataBlock(".row", "--save", SAVE)}`;

const NOTE_HTML =
  '<div class="note"><span data-id="icon" class="icon"></span>' +
  '<p data-id="text" class="text">配送が 1 日ほど遅れています。お届けの日時は、あらためてメールでお知らせします。</p></div>';

const NOTE_CSS = (align: string, icon: string): string =>
  `.note {\n  display: flex;\n  align-items: ${align};\n  gap: 8px;\n  width: 280px;\n  padding: 12px;\n  border-radius: 8px;\n  background: #fff3c4;\n  line-height: 24px;\n}\n.icon {\n  flex-shrink: 0;\n  width: 1em;\n  height: 1em;\n${icon}  background: var(--warn) no-repeat center / contain;\n}\n.text {\n  margin: 0;\n}\n${dataBlock(".note", "--warn", WARN)}`;

export const iconAlignmentTrack: Track = {
  id: "icon-alignment",
  title: "アイコンと文字（inline-flex・em・1 行目にそろえる）",
  summary: "inline-flex と align-items: center でボタンのアイコンと文字の中心をそろえ、1em でアイコンを文字の大きさに合わせ、複数行の文では 1 行目の真ん中にアイコンを置く。",
  emoji: "🔔",
  lessons: [
    {
      id: "inline-flex-icon",
      title: "アイコンと文字の中心をそろえる: inline-flex",
      explanation:
        "<p>行の中に置いた <code>inline-block</code> のアイコンは、下端が文字の<b>ベースライン</b>にそろうので、文字より上にずれて見えます。<code>vertical-align: middle</code> は、アイコンの真ん中を「ベースライン＋小文字の高さの半分」に合わせる指定で、文字の箱の真ん中とぴったり同じにはなりません。</p><p>ボタンを <code>display: inline-flex</code> にして <code>align-items: center</code> を付けると、アイコンと文字が flex のアイテムになり、<b>箱の真ん中どうし</b>がそろいます。inline-flex なので、ボタンは行の中に並んだままです。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/display",
      viz: { concept: "none" },
      challenge: {
        starterHTML: BUTTON_HTML,
        starterCSS: BUTTON_CSS(""),
        task: "ボタンの保存アイコンが、文字「保存する」より上にずれています。アイコンと文字の上下の中心をそろえよう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "alignedEdge",
            ids: ["icon", "label"],
            edge: "centery",
            tol: 0.5,
            message: "アイコンと文字の上下の中心がそろっていません（行の中のアイコンは、下端が文字のベースラインにそろいます。ボタンを inline-flex にして align-items: center を付けると、箱の真ん中どうしがそろいます）",
          },
        ],
        hints: ["ボタンを flex にして、交差軸の中央にそろえます", ".btn { display: inline-flex; align-items: center; }"],
        solution: BUTTON_CSS("  display: inline-flex;\n  align-items: center;\n"),
      },
    },
    {
      id: "icon-em",
      title: "アイコンを文字の大きさに合わせる: 1em",
      explanation:
        "<p><code>em</code> は、<b>その要素の文字の大きさ</b>が基準の単位です。アイコンの幅と高さを <code>20px</code> と決めると、小さいボタンでも大きいボタンでも同じ大きさのままですが、<code>1em</code> にすると、ボタンから受け継いだ文字の大きさ（14px・22px）と同じになります。</p><p>ページ全体の文字の大きさが基準の <code>rem</code> と違い、<code>em</code> は置かれた場所の文字の大きさに合わせて伸び縮みするので、文字の横に置く部品に向いています。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/length",
      viz: { concept: "none" },
      challenge: {
        starterHTML: SIZES_HTML,
        starterCSS: SIZES_CSS("20px"),
        task: "アイコンが、小さいボタンでも大きいボタンでも 20px のままです。アイコンの幅と高さを、それぞれのボタンの文字の大きさ（14px と 22px）と同じにしよう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "sizeApprox", id: "icon-s", w: 14, h: 14, tol: 0.5 },
              { kind: "sizeApprox", id: "icon-l", w: 22, h: 22, tol: 0.5 },
            ],
            message: "アイコンの大きさが、それぞれのボタンの文字の大きさ（14px と 22px）になっていません（1em は、その要素の文字の大きさです。rem はページ全体の文字の大きさなので、どちらも 16px になります）",
          },
        ],
        hints: ["文字の大きさを基準にする単位があります", ".icon { width: 1em; height: 1em; }"],
        solution: SIZES_CSS("1em"),
      },
    },
    {
      id: "icon-first-line",
      title: "複数行の文の 1 行目にそろえる: flex-start と 1lh",
      explanation:
        "<p><code>align-items: center</code> は、文の箱<b>全体の高さ</b>の真ん中にアイコンを置くので、文が 3 行になると、アイコンは 2 行目の横に来てしまいます。注意書きのアイコンは、1 行目の横にあるほうが読みやすくなります。</p><p><code>align-items: flex-start</code> で上端をそろえ、アイコンを (1 行の高さ − アイコンの高さ) ÷ 2 だけ下げると、1 行目の真ん中に来ます。<code>1lh</code> はその要素の <code>line-height</code> と同じ長さなので、<code>margin-top: calc((1lh - 1em) / 2)</code> と書けば、行の高さや文字の大きさが変わってもそろいます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/align-items",
      viz: { concept: "none" },
      challenge: {
        starterHTML: NOTE_HTML,
        starterCSS: NOTE_CSS("center", ""),
        task: "3 行の注意書きで、アイコンが 2 行目の横に来ています。アイコンを、文の 1 行目の真ん中にそろえよう（行の高さは 24px、アイコンは 1em です）。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "offset",
            a: "text",
            b: "icon",
            edgeA: "top",
            edgeB: "centery",
            min: 11.5,
            max: 12.5,
            message: "アイコンが、文の 1 行目の真ん中（文の上端から 12px）にそろっていません（align-items: center は、3 行ぶんの高さの真ん中にそろえます。flex-start で上端をそろえ、アイコンを (1lh - 1em) / 2 だけ下げます）",
          },
        ],
        hints: ["上端でそろえてから、アイコンを行の高さとの差の半分だけ下げます", ".note { align-items: flex-start; } .icon { margin-top: calc((1lh - 1em) / 2); }"],
        solution: NOTE_CSS("flex-start", "  margin-top: calc((1lh - 1em) / 2);\n"),
      },
    },
  ],
};
