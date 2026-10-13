import type { Edge, ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Negative margins are judged by box edges: the photo reaches the card's left
// and right edges while the heading stays 16px inside; the avatar overlaps the
// cover by 32px and the name follows 8px below it (moving it with position or
// transform leaves the gap behind); and the photo in the 320px column spans
// the whole page at any preview width while the paragraphs stay in the column.

const between = (a: string, b: string, edgeA: Edge, edgeB: Edge, px: number): ValidatorSpec => ({
  kind: "offset",
  a,
  b,
  edgeA,
  edgeB,
  min: px - 0.5,
  max: px + 0.5,
});

const spans = (outer: string, inner: string): ValidatorSpec[] => [
  { kind: "alignedEdge", ids: [outer, inner], edge: "left", tol: 0.5 },
  { kind: "alignedEdge", ids: [outer, inner], edge: "right", tol: 0.5 },
];

const PHOTO_BG = "  background: linear-gradient(135deg, #9fd3f5, #2f5fd0);\n";

const BLEED_HTML =
  '<article data-id="card" class="card"><div data-id="photo" class="photo"></div>' +
  '<h3 data-id="title">春の旅</h3><p>桜の名所をめぐる、三泊四日の旅です。</p></article>';

const BLEED_CSS = (extra: string): string =>
  `.card {\n  width: 240px;\n  padding: 16px;\n  border-radius: 12px;\n  background: #eef1f8;\n}\n.photo {\n  height: 96px;\n  margin-bottom: 12px;\n${PHOTO_BG}${extra}}\n.card h3 {\n  margin: 0 0 4px;\n}\n.card p {\n  margin: 0;\n}\n`;

const PROFILE_HTML =
  '<article class="profile"><div data-id="cover" class="cover"></div><div data-id="avatar" class="avatar"></div>' +
  '<h3 data-id="name" class="name">さくら</h3><p class="bio">春の写真を撮っています。</p></article>';

const PROFILE_CSS = (extra: string): string =>
  `.profile {\n  width: 260px;\n  padding-bottom: 12px;\n  border-radius: 12px;\n  background: #eef1f8;\n}\n.cover {\n  height: 80px;\n  border-radius: 12px 12px 0 0;\n${PHOTO_BG}}\n.avatar {\n  width: 64px;\n  height: 64px;\n  margin-left: 16px;\n  border: 3px solid #fff;\n  border-radius: 50%;\n  background: #f5c400;\n${extra}}\n.name {\n  margin: 8px 16px 0;\n  font-size: 18px;\n}\n.bio {\n  margin: 4px 16px 0;\n}\n`;

const BREAKOUT_HTML =
  '<div data-id="page" class="page"><article data-id="column" class="column">' +
  '<p data-id="p1">海辺の町を歩く、日帰りの講座です。</p><div data-id="photo" class="photo"></div>' +
  "<p>集合は駅の改札前、午前 10 時です。</p></article></div>";

const BREAKOUT_CSS = (extra: string): string =>
  `/* ページ全体をコンテナにする（cqi の基準） */\n.page {\n  container-type: inline-size;\n}\n/* 文章は 320px の列で真ん中に */\n.column {\n  max-width: 320px;\n  margin-inline: auto;\n}\n.column p {\n  margin: 0 0 8px;\n}\n.photo {\n  height: 72px;\n  margin-bottom: 8px;\n${PHOTO_BG}${extra}}\n`;

export const negativeMarginsTrack: Track = {
  id: "negative-margins",
  title: "負のマージン（端まで広げる・重ねる・列から飛び出す）",
  summary: "負の margin-inline で写真をカードの余白の外まで広げ、負の margin-top でアイコンを表紙に重ね、calc(50% - 50cqi) で列の中の写真をページの端から端まで広げる。",
  emoji: "🥞",
  lessons: [
    {
      id: "negative-bleed",
      title: "余白の外まで広げる: 負の margin-inline",
      explanation:
        "<p>margin には<b>負の値</b>も使えます。幅が auto のブロックの左右に負のマージンを付けると、その分だけ外へ広がります。カードの padding が 16px なら、写真に <code>margin-inline: -16px</code> を付けると、写真だけがカードの左右の端まで広がり、見出しや文章は余白の内側に残ります。</p><p>カードの padding を 0 にすると、文章まで端にくっつきます。広げたい要素にだけ負のマージンを付けるのがこつです。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/margin",
      viz: { concept: "none" },
      challenge: {
        starterHTML: BLEED_HTML,
        starterCSS: BLEED_CSS(""),
        task: "写真だけを、カードの余白（16px）の外まで、カードの左右の端いっぱいに広げよう（見出しと文章は余白の内側のまま）。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: spans("card", "photo"),
                message: "写真が、カードの左右の端まで広がっていません（padding の内側の要素は、負の margin-inline で余白の外へ広げられます）",
              },
              {
                ...between("card", "title", "left", "left", 16),
                message: "見出しが、カードの余白（16px）の内側からはみ出しました（写真にだけ負のマージンを付けます）",
              },
            ],
          },
        ],
        hints: ["写真の左右のマージンを、カードの padding と同じだけ負にします", ".photo { margin-inline: -16px; }"],
        solution: BLEED_CSS("  margin-inline: -16px;\n"),
      },
    },
    {
      id: "negative-overlap",
      title: "前の要素に重ねる: 負の margin-top",
      explanation:
        "<p>負の <code>margin-top</code> を付けると、要素は前の要素の側へ引き寄せられ、<b>重なって</b>置かれます。プロフィールのアイコン（高さ 64px）に <code>margin-top: -32px</code> を付けると、半分が表紙の写真に重なります。あとに続く名前も、いっしょに上がってきます。</p><p><code>position: relative</code> と <code>top</code> や、<code>transform</code> で上にずらすと、見た目だけが動き、もとの場所は空いたままなので、名前との間が開いてしまいます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/margin-top",
      viz: { concept: "none" },
      challenge: {
        starterHTML: PROFILE_HTML,
        starterCSS: PROFILE_CSS(""),
        task: "プロフィールのアイコンを上に引き上げ、半分（32px）を表紙の写真に重ねよう。名前はアイコンのすぐ下（8px）についてくるように。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                ...between("cover", "avatar", "bottom", "top", -32),
                message: "アイコンが、表紙の写真に 32px（半分）重なっていません（負の margin-top で、前の要素の側へ引き寄せます）",
              },
              {
                ...between("avatar", "name", "bottom", "top", 8),
                message: "名前がアイコンのすぐ下（8px）についてきていません（position: relative や transform は見た目だけを動かし、もとの場所が空いたままになります。負の margin-top なら、あとの要素もいっしょに上がります）",
              },
            ],
          },
        ],
        hints: ["アイコンの上のマージンを、高さの半分だけ負にします", ".avatar { margin-top: -32px; }"],
        solution: PROFILE_CSS("  margin-top: -32px;\n"),
      },
    },
    {
      id: "negative-breakout",
      title: "列から飛び出す: margin-inline: calc(50% - 50cqi)",
      explanation:
        "<p>320px の列の中にある写真を、<b>ページの端から端まで</b>広げるには、列の幅とページの幅の差の半分だけ、左右のマージンを負にします。margin の % は親（列）の幅が基準なので <code>50%</code> は列の幅の半分、ページをコンテナにしておけば <code>50cqi</code> はページの幅の半分です。</p><p><code>margin-inline: calc(50% - 50cqi)</code> は、ページが列より広いと負になり、写真がその分だけ左右に広がります。列とページが同じ幅（狭い画面）なら 0 で、そのまま収まります。文章は列の中に残ります。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/margin",
      viz: { concept: "none" },
      challenge: {
        starterHTML: BREAKOUT_HTML,
        starterCSS: BREAKOUT_CSS(""),
        task: "320px の列の中の写真だけを、列から飛び出させて、ページの端から端まで広げよう（文章は列の中のまま。画面の幅が変わっても）。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: spans("page", "photo"),
                message: "写真が、ページの端から端まで広がっていません（列の幅の半分（50%）とページの幅の半分（50cqi）の差だけ、左右のマージンを負にします）",
              },
              {
                kind: "allOf",
                of: [...spans("column", "p1"), { kind: "offset", a: "p1", b: "p1", edgeA: "left", edgeB: "right", max: 320.5 }],
                message: "文章が、幅 320px の列の中に収まっていません（列はそのままにして、写真にだけ負のマージンを付けます）",
              },
            ],
          },
        ],
        hints: ["列の半分とページの半分の差を、負のマージンにします", ".photo { margin-inline: calc(50% - 50cqi); }"],
        solution: BREAKOUT_CSS("  margin-inline: calc(50% - 50cqi);\n"),
      },
    },
  ],
};
