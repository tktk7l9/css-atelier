import type { ValidatorSpec } from "../validate/primitives.js";
import { svgUri } from "./svg-uri.js";
import type { Track } from "./types.js";

// Backgrounds paint behind the content and take no room, so these lessons are
// judged by the computed background values the browser resolved: the size
// keyword (cover), the position as percentages or lengths ("50% 50%" for
// center, "12px 50%" for 12px center), the repeat keyword, and the layer list
// of background-image (its first layer is the one on top). The only geometry
// read is where the notice's text starts, so that it clears the icon. The
// pictures are SVG data: URIs (the CSP allows data: images), kept in a custom
// property at the end of the CSS so the declarations being edited stay short.

const PHOTO = svgUri(
  160,
  100,
  "<rect width='160' height='100' fill='#bfe3fa'/><circle cx='122' cy='28' r='11' fill='#ffd75e'/><path d='M0 72l38-32 26 22 36-34 60 46v26H0z' fill='#2f9d5b'/><rect y='80' width='160' height='20' fill='#2f5fd0'/><path d='M56 84h30l-5 6H61z' fill='#fff'/>",
);

const ICON = svgUri(24, 24, "<path d='M12 2l11 19H1z' fill='#e0a100'/><path d='M11 8h2v7h-2zM11 17h2v2h-2z' fill='#fff'/>");

const BEACH = svgUri(
  200,
  120,
  "<rect width='200' height='120' fill='#cdeeff'/><circle cx='150' cy='34' r='16' fill='#fff6c2'/><path d='M0 70q50-10 100 0t100 0v50H0z' fill='#7cc8f2'/><path d='M0 96q60-12 120-2t80-4v30H0z' fill='#f6e3b4'/>",
);

/** The picture's data, set apart at the end of the CSS with a note. */
const dataBlock = (selector: string, name: string, uri: string): string =>
  `/* 画像のデータ（SVG）。ここは変えなくて大丈夫です */\n${selector} {\n  ${name}: url("${uri}");\n}\n`;

const HERO_HTML = '<section data-id="hero" class="hero"><h2>春の新作</h2><p>4 月 10 日から店頭に並びます</p></section>';

const HERO_CSS = (extra: string): string =>
  `.hero {\n  width: 280px;\n  height: 140px;\n  padding: 20px;\n  border-radius: 12px;\n  background-color: #bfe3fa;\n  background-image: var(--photo);\n${extra}}\n.hero h2 {\n  margin: 0 0 4px;\n  font-size: 22px;\n}\n.hero p {\n  margin: 0;\n}\n${dataBlock(".hero", "--photo", PHOTO)}`;

const NOTICE_HTML = '<p data-id="notice" class="notice"><span data-id="text">配送が 1 日ほど遅れています</span></p>';

const NOTICE_CSS = (padding: string, extra: string): string =>
  `.notice {\n  width: 280px;\n  margin: 0;\n  padding: ${padding};\n  border-radius: 8px;\n  background-color: #fff3c4;\n  background-image: var(--icon);\n${extra}}\n${dataBlock(".notice", "--icon", ICON)}`;

const BANNER_HTML = '<section data-id="banner" class="banner"><h2>夏の旅特集</h2><p>海の見える宿 30 選</p></section>';

const BANNER_CSS = (image: string): string =>
  `.banner {\n  width: 280px;\n  height: 140px;\n  padding: 20px;\n  border-radius: 12px;\n  color: #fff;\n  background-image:${image};\n  background-size: cover;\n  background-position: center;\n}\n.banner h2 {\n  margin: 0 0 4px;\n  font-size: 22px;\n}\n.banner p {\n  margin: 0;\n}\n${dataBlock(".banner", "--beach", BEACH)}`;

/** The first layer is a gradient and a url() comes after it (below it). */
const GRADIENT_ON_TOP = "^(?:linear|radial|conic)-gradient\\(.*\\), url\\(";

/** ...and that first layer has a see-through colour in it. */
const SEE_THROUGH_ON_TOP = "^(?:linear|radial|conic)-gradient\\([^]*?(?:rgba\\(|/ 0?\\.\\d)[^]*?\\), url\\(";

const textClearsIcon: ValidatorSpec = { kind: "offset", a: "notice", b: "text", edgeA: "left", edgeB: "left", min: 30, max: 48 };

export const backgroundsTrack: Track = {
  id: "backgrounds",
  title: "背景画像の置き方（background-size・background-position・重ね方）",
  summary: "background-size: cover で写真を枠いっぱいに広げ、no-repeat と位置・大きさでアイコンを 1 つだけ置き、背景を重ねて写真の上に色をかぶせる。",
  emoji: "🌄",
  lessons: [
    {
      id: "bg-cover",
      title: "写真で埋める: background-size: cover",
      explanation:
        "<p><code>background-image</code> で背景に画像を置くと、初期設定では<b>画像の元の大きさのまま</b>、縦横に<b>繰り返して</b>敷き詰められます（<code>background-size: auto</code> と <code>background-repeat: repeat</code>）。</p><p><code>background-size: cover</code> は、画像の<b>縦横比を保ったまま</b>、枠をすき間なく覆う最小の大きさに拡大・縮小します。縦横比が枠と違う分ははみ出して切り取られるので、<code>background-position: center</code> で写真の<b>中央</b>が見えるようにします（初期値は左上の <code>0% 0%</code>）。<code>background-size: 100% 100%</code> は幅と高さを別々に伸ばすので、写真がゆがみます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/background-size",
      viz: { concept: "none" },
      challenge: {
        starterHTML: HERO_HTML,
        starterCSS: HERO_CSS(""),
        task: "写真が小さいまま、タイルのように並んでいます。写真をゆがめずに枠いっぱいに広げ、写真の中央が見えるようにしよう。",
        snapshot: { props: ["background-size", "background-position"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "computedEquals",
                id: "hero",
                prop: "background-size",
                value: "cover",
                message: "写真が、ゆがまずに枠いっぱいに広がっていません（縦横比を保って枠を覆うのは background-size: cover。100% 100% だとゆがみます）",
              },
              {
                kind: "computedEquals",
                id: "hero",
                prop: "background-position",
                value: "50% 50%",
                message: "写真の中央が見えていません（はみ出した分は切り取られるので、background-position: center で中央を見せます）",
              },
            ],
          },
        ],
        hints: ["縦横比を保って枠を覆う大きさは cover、見せる場所は background-position で決めます", ".hero { background-size: cover; background-position: center; }"],
        solution: HERO_CSS("  background-size: cover;\n  background-position: center;\n"),
      },
    },
    {
      id: "bg-icon",
      title: "アイコンを 1 つだけ置く: no-repeat と位置・大きさ",
      explanation:
        "<p>アイコンを背景に 1 つだけ置くときは、3 つを決めます。<code>background-repeat: no-repeat</code> で<b>繰り返しをやめ</b>、<code>background-size: 16px</code> で<b>大きさ</b>を決め（値が 1 つなら、高さは縦横比を保って自動で決まります）、<code>background-position: 12px center</code> で<b>位置</b>を決めます。位置は「横、縦」の順で、ここでは左から 12px・上下の中央です。</p><p>背景は文字の下に描かれるので、そのままでは文字と重なります。<code>padding-left</code> でアイコンの分（12px + 16px と少しの間）をあけ、文字をアイコンの右から始めます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/background-position",
      viz: { concept: "none" },
      challenge: {
        starterHTML: NOTICE_HTML,
        starterCSS: NOTICE_CSS("10px 12px", ""),
        task: "注意のアイコンが、模様のようにいくつも並んでいます。アイコンを 1 つだけ、左から 12px・上下の中央に 16px の大きさで置き、文字はアイコンの右から始めよう（左の余白を 36px に）。",
        snapshot: { props: ["background-repeat", "background-size", "background-position"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "computedEquals",
                id: "notice",
                prop: "background-repeat",
                value: "no-repeat",
                message: "アイコンが繰り返し並んでいます（background-repeat: no-repeat で 1 つだけにします）",
              },
              {
                kind: "computedMatches",
                id: "notice",
                prop: "background-size",
                pattern: "^16px(?: (?:auto|16px))?$",
                message: "アイコンの大きさが 16px になっていません（background-size: 16px）",
              },
              {
                kind: "computedEquals",
                id: "notice",
                prop: "background-position",
                value: "12px 50%",
                message: "アイコンが、左から 12px・上下の中央に来ていません（background-position: 12px center）",
              },
              { ...textClearsIcon, message: "文字がアイコンに重なっています（左の padding を 36px にして、アイコンの分をあけます）" },
            ],
          },
        ],
        hints: ["繰り返しは background-repeat、大きさは background-size、位置は background-position です", ".notice { padding-left: 36px; background-repeat: no-repeat; background-size: 16px; background-position: 12px center; }"],
        solution: NOTICE_CSS("10px 12px 10px 36px", "  background-repeat: no-repeat;\n  background-size: 16px;\n  background-position: 12px center;\n"),
      },
    },
    {
      id: "bg-layers",
      title: "写真の上に色を重ねる: 背景を複数指定する",
      explanation:
        "<p><code>background-image</code> には、<b>カンマで区切って複数の画像</b>を指定できます。<b>先に書いたものほど上（手前）</b>に重なります。<code>background-color</code> はすべての画像の<b>下</b>に描かれるので、写真の上に色をかぶせることはできません。</p><p>色の層には、同じ色を 2 つ並べたグラデーション <code>linear-gradient(rgb(24 32 58 / 0.55), rgb(24 32 58 / 0.55))</code> を使います。色が変わらないので、その色 1 色の層になります。半透明の色なら、写真が透けて見えたまま、白い文字が読みやすくなります。<code>background-size</code> などの値が 1 つだけのときは、すべての層に同じ値が使われます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Guides/Backgrounds_and_borders/Using_multiple_backgrounds",
      viz: { concept: "none" },
      challenge: {
        starterHTML: BANNER_HTML,
        starterCSS: BANNER_CSS(" var(--beach)"),
        task: "明るい写真の上で、白い文字が読みにくくなっています。写真の上に半透明の紺色（rgb(24 32 58 / 0.55) など）を 1 枚重ねて、文字を読みやすくしよう（写真は残す）。",
        snapshot: { props: ["background-image"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "computedMatches",
                id: "banner",
                prop: "background-image",
                pattern: GRADIENT_ON_TOP,
                message: "写真の上に色が重なっていません（background-image にカンマで区切って、色の層を写真より先に書きます。background-color は写真の下に描かれます）",
              },
              {
                kind: "computedMatches",
                id: "banner",
                prop: "background-image",
                pattern: SEE_THROUGH_ON_TOP,
                message: "重ねた色で、写真が見えなくなっています（rgb(24 32 58 / 0.55) のような半透明の色にしましょう）",
              },
            ],
          },
        ],
        hints: ["色の層は linear-gradient(色, 色) で作り、写真（var(--beach)）より先に書きます", ".banner { background-image: linear-gradient(rgb(24 32 58 / 0.55), rgb(24 32 58 / 0.55)), var(--beach); }"],
        solution: BANNER_CSS("\n    linear-gradient(rgb(24 32 58 / 0.55), rgb(24 32 58 / 0.55)),\n    var(--beach)"),
      },
    },
  ],
};
