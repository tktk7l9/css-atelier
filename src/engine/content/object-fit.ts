import type { ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// object-fit and object-position change how the picture is drawn inside the
// <img> box, not the box itself, so these lessons read the computed values and
// also check that the box keeps its size (changing the box would dodge the
// distortion or the crop without object-fit). The pictures are small SVG
// drawings in data: URIs, which the CSP allows (img-src data:), so the preview
// requests no image.

/** An SVG drawing as a data: URI (`#` would start a fragment, so it is escaped). */
function svgUri(w: number, h: number, body: string, attrs = ""): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'${attrs}>${body}</svg>`;
  return `data:image/svg+xml,${svg.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}`;
}

// preserveAspectRatio='none' makes the drawing stretch like a photo would: an
// SVG keeps its own proportions inside any box by default, so `fill` would not
// visibly distort it. With cover / contain the box the drawing gets already has
// its proportions, so nothing changes there.
const landscape = (sky: string, sun: string, hill: string): string =>
  svgUri(
    300,
    200,
    `<rect width='300' height='200' fill='${sky}'/><circle cx='150' cy='78' r='34' fill='${sun}'/><path d='M0 200V138Q75 92 150 132T300 118V200Z' fill='${hill}'/>`,
    " preserveAspectRatio='none'",
  );

/** A portrait with the face near the top: a centred crop shows only the shirt. */
const PORTRAIT = svgUri(
  200,
  300,
  "<rect width='200' height='300' fill='#dbe4fb'/><rect x='86' y='70' width='28' height='56' fill='#f2c49b'/>" +
    "<path d='M24 300V196Q24 120 100 120T176 196V300Z' fill='#2f5fd0'/><circle cx='100' cy='46' r='30' fill='#f2c49b'/>" +
    "<path d='M70 46A30 30 0 0 1 130 46Q100 30 70 46Z' fill='#18203a'/><circle cx='89' cy='48' r='3.5' fill='#18203a'/>" +
    "<circle cx='111' cy='48' r='3.5' fill='#18203a'/><path d='M90 60Q100 68 110 60' fill='none' stroke='#18203a' stroke-width='3' stroke-linecap='round'/>",
);

const WIDE_LOGO = svgUri(
  300,
  100,
  "<rect width='300' height='100' rx='14' fill='#18203a'/><circle cx='52' cy='50' r='28' fill='#f5c400'/>" +
    "<rect x='98' y='30' width='170' height='16' rx='8' fill='#fff'/><rect x='98' y='56' width='112' height='14' rx='7' fill='#9fb2e6'/>",
);

const TALL_LOGO = svgUri(
  120,
  160,
  "<rect width='120' height='160' rx='14' fill='#2f9d5b'/><path d='M60 20L100 64H20Z' fill='#fff'/>" +
    "<rect x='32' y='64' width='56' height='44' fill='#fff'/><rect x='22' y='124' width='76' height='12' rx='6' fill='#d6f5e3'/>",
);

const THUMBS_HTML =
  '<div class="row">' +
  `<img data-id="t1" class="thumb" src="${landscape("#9fd3f5", "#f5c400", "#2f9d5b")}" alt="朝の丘">` +
  `<img data-id="t2" class="thumb" src="${landscape("#ffd27a", "#ff6f3c", "#b9791b")}" alt="夕焼けの丘">` +
  `<img data-id="t3" class="thumb" src="${landscape("#18203a", "#f5f0d0", "#2f5fd0")}" alt="夜の丘">` +
  "</div>";

const THUMBS_CSS = (extra: string): string =>
  `.row {\n  display: flex;\n  gap: 12px;\n}\n.thumb {\n  width: 120px;\n  height: 120px;\n  border-radius: 8px;\n${extra}}\n`;

const HERO_HTML = `<img data-id="hero" class="hero" src="${PORTRAIT}" alt="店長の写真"><p class="caption">店長からのごあいさつ</p>`;

const HERO_CSS = (extra: string): string =>
  `.hero {\n  display: block;\n  width: 300px;\n  height: 120px;\n  border-radius: 8px;\n  object-fit: cover;\n${extra}}\n.caption {\n  margin: 8px 0 0;\n  font-weight: 700;\n}\n`;

const LOGOS_HTML =
  '<p class="label">協賛</p><div class="logos">' +
  `<img data-id="wide" class="logo" src="${WIDE_LOGO}" alt="横長のロゴ">` +
  `<img data-id="tall" class="logo" src="${TALL_LOGO}" alt="縦長のロゴ">` +
  "</div>";

const LOGOS_CSS = (fit: string): string =>
  `.label {\n  margin: 0 0 6px;\n  font-size: 13px;\n  color: #4a5578;\n}\n.logos {\n  display: flex;\n  gap: 12px;\n}\n.logo {\n  width: 140px;\n  height: 80px;\n  border: 1px solid #dbe4fb;\n  border-radius: 8px;\n  background: #f4f6fb;\n  object-fit: ${fit};\n}\n`;

const keepsSize = (ids: readonly string[], w: number, h: number, message: string): ValidatorSpec => ({
  kind: "allOf",
  of: ids.map((id): ValidatorSpec => ({ kind: "sizeApprox", id, w, h })),
  message,
});

export const objectFitTrack: Track = {
  id: "object-fit",
  title: "画像の収め方",
  summary: "object-fit と object-position で、縦横比の違う写真やロゴを、ゆがめずに枠へ収める。",
  emoji: "🏞️",
  lessons: [
    {
      id: "fit-cover",
      title: "ゆがめずに切り抜く: object-fit: cover",
      explanation:
        "<p><code>&lt;img&gt;</code> に <code>width</code> と <code>height</code> の両方を指定すると、写真は初期値の <code>object-fit: fill</code> で<b>枠いっぱいに引き伸ばされ</b>、縦横比の違う写真はゆがみます。</p><p><code>object-fit: cover</code> にすると、縦横比を保ったまま枠を<b>すき間なく覆う</b>大きさに拡大・縮小し、はみ出した部分を切り落とします。サムネイルを正方形にそろえるときの定番です。ほかに、全体を収めて余白を残す <code>contain</code>、元の大きさのまま切り取る <code>none</code> があります。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/object-fit",
      viz: { concept: "none" },
      challenge: {
        starterHTML: THUMBS_HTML,
        starterCSS: THUMBS_CSS(""),
        task: "横長の写真が、120px 四方のサムネイル（.thumb）に押し込まれてゆがんでいます。大きさはそのままに、縦横比を保って枠いっぱいに切り抜こう。",
        snapshot: { props: ["object-fit"] },
        validators: [
          // allOf reports only the first unmet step, so a fresh starter gets one message.
          {
            kind: "allOf",
            of: [
              {
                kind: "computedMatches",
                id: "t1",
                prop: "object-fit",
                pattern: "^(?!fill$)",
                message: "写真が縦横に引き伸ばされてゆがんでいます。.thumb に object-fit を指定しましょう",
              },
              {
                kind: "computedEquals",
                id: "t1",
                prop: "object-fit",
                value: "cover",
                message: "枠いっぱいに切り抜くのは cover です（contain は余白が残り、none は元の大きさのまま切り取ります）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "computedEquals", id: "t2", prop: "object-fit", value: "cover" },
                  { kind: "computedEquals", id: "t3", prop: "object-fit", value: "cover" },
                ],
                message: "3 枚すべての写真（.thumb）に指定しましょう",
              },
            ],
          },
          keepsSize(["t1", "t2", "t3"], 120, 120, "サムネイルの大きさ（120px × 120px）は変えないでおきましょう"),
        ],
        hints: ["縦横比を保ったまま枠を覆い、はみ出した分を切り落とす値があります", "object-fit: cover;"],
        solution: THUMBS_CSS("  object-fit: cover;\n"),
      },
    },
    {
      id: "fit-position",
      title: "見せる位置を選ぶ: object-position",
      explanation:
        "<p><code>object-fit: cover</code> で切り抜くと、写真の<b>中央</b>を残して周りが切り落とされます。大事なものが写真の端にあると、そこが切れてしまいます。</p><p><code>object-position</code> は、枠の中で写真を<b>どこに寄せるか</b>を決めます。<code>background-position</code> と同じ書き方で、初期値は中央（<code>50% 50%</code>）。<code>top</code> なら上端に寄せて、写真の上のほうを残します。<code>left top</code> や <code>30% 20%</code> のように、横と縦の位置を並べても書けます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/object-position",
      viz: { concept: "none" },
      challenge: {
        starterHTML: HERO_HTML,
        starterCSS: HERO_CSS(""),
        task: "縦長の写真を横長のバナー（.hero）に cover で切り抜いたら、店長の顔が切れて服しか見えません。写真の上端に寄せて、顔が見えるようにしよう。",
        snapshot: { props: ["object-fit", "object-position"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "computedMatches",
                id: "hero",
                prop: "object-position",
                // Any horizontal position works: the scaled photo is exactly as wide as the banner.
                pattern: "^\\S+ 0(?:%|px)$",
                message: "顔のある写真の上端が見えていません。object-position で上（top）に寄せましょう",
              },
              {
                kind: "computedEquals",
                id: "hero",
                prop: "object-fit",
                value: "cover",
                message: "object-fit: cover は残しておきましょう（外すと写真が引き伸ばされます）",
              },
            ],
          },
          keepsSize(["hero"], 300, 120, "バナーの大きさ（300px × 120px）は変えないでおきましょう"),
        ],
        hints: ["寄せる位置は background-position と同じ書き方です", "object-position: top;"],
        solution: HERO_CSS("  object-position: top;\n"),
      },
    },
    {
      id: "fit-contain",
      title: "切らずに全体を収める: object-fit: contain",
      explanation:
        "<p>ロゴや商品の写真は、<b>端が切れると困ります</b>。<code>object-fit: contain</code> は、縦横比を保ったまま<b>全体が枠に収まる</b>大きさにするので、何も切り落としません。枠と縦横比が違う分は余白になり、そこには要素の <code>background</code> が見えます。</p><p>縦横比のばらばらなロゴを同じ大きさの枠に並べるときに便利です。<code>scale-down</code> は、<code>contain</code> と元の大きさ（<code>none</code>）のうち小さいほうになり、小さな画像を引き伸ばしません。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/object-fit",
      viz: { concept: "none" },
      challenge: {
        starterHTML: LOGOS_HTML,
        starterCSS: LOGOS_CSS("cover"),
        task: "サムネイルと同じ cover を使ったら、横長と縦長のロゴ（.logo）の端が切れてしまいました。枠の大きさはそのままに、ロゴ全体が枠に収まるようにしよう。",
        snapshot: { props: ["object-fit"] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "computedMatches", id: "wide", prop: "object-fit", pattern: "^(?:contain|scale-down)$" },
              { kind: "computedMatches", id: "tall", prop: "object-fit", pattern: "^(?:contain|scale-down)$" },
            ],
            message: "ロゴの端が切れています。全体を枠に収める object-fit: contain にしましょう",
          },
          keepsSize(["wide", "tall"], 140, 80, "ロゴの枠の大きさ（140px × 80px）は変えないでおきましょう"),
        ],
        hints: ["cover は枠を覆うまで拡大するので、はみ出した端が切れます", "object-fit: contain;"],
        solution: LOGOS_CSS("contain"),
      },
    },
  ],
};
