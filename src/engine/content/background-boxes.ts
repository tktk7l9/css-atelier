import type { Track } from "./types.js";

// What a background is clipped to or measured from is a painting matter the
// snapshot cannot see, so these lessons read the computed values (the colour of
// the text for the clipped gradient, too).

const ALERT_HTML = '<div data-id="box" class="box">下書きを保存しました</div>';

const ALERT_CSS =
  ".box {\n  padding: 12px;\n  border: 8px dashed rgb(47 95 208 / 0.4);\n  background: #fbe9a8;\n}\n";

const TITLE_HTML = '<h2 data-id="title" class="title">春の新作コレクション</h2>';

const TITLE_CSS = (extra: string): string =>
  `.title {\n  margin: 0;\n  font-size: 32px;\n  background: linear-gradient(90deg, #2f5fd0, #d93636);\n${extra}}\n`;

const ICON_HTML = '<div data-id="note" class="note">重要なお知らせがあります</div>';

const ICON_CSS =
  `.note {\n  padding: 16px;\n  border: 8px solid #dbe4fb;\n  background: linear-gradient(#2f5fd0, #2f5fd0) no-repeat top left / 40px 4px;\n}\n`;

export const backgroundBoxesTrack: Track = {
  id: "background-boxes",
  title: "背景の範囲（background-clip・文字の形の背景・background-origin）",
  summary: "background-clip で背景が枠線の下へ広がるのを止め、text の値で背景を文字の形に切り抜き、background-origin で背景の基準を padding の内側に動かす。",
  emoji: "🖌️",
  lessons: [
    {
      id: "background-clip",
      title: "背景を枠線の内側で止める: background-clip",
      explanation:
        "<p>背景は、初期状態では<b>枠線の下まで</b>広がっています（<code>background-clip: border-box</code>）。枠線が破線や半透明だと、そのすき間から背景が見えます。</p><p><code>background-clip: padding-box</code> にすると、背景は枠線の内側で止まります。<code>content-box</code> なら padding の内側（内容の範囲）で止まります。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/background-clip",
      viz: { concept: "none" },
      challenge: {
        starterHTML: ALERT_HTML,
        starterCSS: ALERT_CSS,
        task: "黄色の背景が、半透明の破線の枠の下まで見えています。背景が枠線の内側で止まるようにしよう。",
        snapshot: { props: ["background-clip"] },
        validators: [
          { kind: "computedEquals", id: "box", prop: "background-clip", value: "padding-box", message: "背景が枠線の下まで広がっています（.box に background-clip: padding-box）" },
        ],
        hints: ["初期値は border-box です", ".box { background-clip: padding-box; }"],
        solution: ALERT_CSS + ".box {\n  background-clip: padding-box;\n}\n",
      },
    },
    {
      id: "background-clip-text",
      title: "背景を文字の形に: background-clip: text",
      explanation:
        "<p><code>background-clip: text</code> は、背景を<b>文字の形に</b>切り抜きます。文字そのものの色が背景の上に塗られるので、<code>color: transparent</code> にして背景を見せます。グラデーションの見出しによく使います。</p><p>対応していない環境では文字が見えなくなることがあるので、<code>@supports (background-clip: text)</code> の中で <code>color: transparent</code> にすると安全です。背景の色によっては読みにくくなるので、コントラストも確かめます。</p><p>接頭辞なしの <code>text</code> は Chrome 120・Firefox 49・Safari 14 から使えます（古い Chrome と Safari は <code>-webkit-background-clip</code>）。Firefox は <code>background-attachment: fixed</code> と一緒だと効かないなどの差があり、MDN の Baseline には入っていません。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/background-clip",
      viz: { concept: "none" },
      challenge: {
        starterHTML: TITLE_HTML,
        starterCSS: TITLE_CSS(""),
        task: "見出しの背景のグラデーションを文字の形に切り抜こう。background-clip: text と color: transparent を .title に指定します。",
        snapshot: { props: ["background-clip", "color"] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "computedEquals", id: "title", prop: "background-clip", value: "text", message: "" },
              { kind: "computedEquals", id: "title", prop: "color", value: "rgba(0, 0, 0, 0)", message: "" },
            ],
            message: ".title に background-clip: text と color: transparent を、2 つとも指定しましょう",
          },
        ],
        hints: ["文字の色が残っていると、背景が隠れます", ".title {\n  background-clip: text;\n  color: transparent;\n}"],
        solution: TITLE_CSS("  background-clip: text;\n  color: transparent;\n"),
      },
    },
    {
      id: "background-origin",
      title: "背景の基準を動かす: background-origin",
      explanation:
        "<p><code>background-position</code> の基準になる箱を決めるのが <code>background-origin</code> です。初期値は <code>padding-box</code> で、<code>top left</code> は枠線のすぐ内側です。<code>content-box</code> にすると、padding の内側、つまり文章と同じ位置が基準になります。<code>border-box</code> は枠線の外側の角です。</p><p><code>background-clip</code> が<b>どこまで塗るか</b>を決めるのに対し、<code>background-origin</code> は<b>どこから置くか</b>を決めます。<code>background-attachment: fixed</code> のときは無視されます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/background-origin",
      viz: { concept: "none" },
      challenge: {
        starterHTML: ICON_HTML,
        starterCSS: ICON_CSS,
        task: "青い線は背景の画像で、文章より左上にずれています。.note の background-origin を変えて、文章の左上を基準にしよう。",
        snapshot: { props: ["background-origin"] },
        validators: [
          { kind: "computedEquals", id: "note", prop: "background-origin", value: "content-box", message: "背景の基準が文章の左上になっていません（.note に background-origin: content-box）" },
        ],
        hints: ["padding の内側が基準になる値です", ".note { background-origin: content-box; }"],
        solution: ICON_CSS + ".note {\n  background-origin: content-box;\n}\n",
      },
    },
  ],
};
