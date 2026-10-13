import type { ValidatorSpec } from "../validate/primitives.js";
import { svgUri } from "./svg-uri.js";
import type { Track } from "./types.js";

// Sizes are judged by the boxes they produce inside a 280px card: a
// border-box field ends exactly at the card's content edge, an auto-width
// notice keeps 16px of margin on both sides, and a picture limited by
// max-width: 100% comes out 254px wide (the card's content box) and, with
// height: auto, 127px tall (its 2:1 ratio). Hard-coding the result (calc() for the field or the
// notice, width: 100% on the picture) passes the geometry and then fails the
// last step, which says why the taught value is better.

const CARD_CSS = ".card {\n  width: 280px;\n  padding: 12px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n";

const FIELD_HTML =
  '<div data-id="card" class="card"><label for="q" class="label">キーワード</label><input data-id="field" id="q" class="field" type="search" placeholder="例: カメラ"></div>';

const FIELD_CSS = (extra: string): string =>
  `${CARD_CSS}.label {\n  display: block;\n  margin-bottom: 4px;\n  font-size: 14px;\n}\n/* 以前から使っている部品の CSS */\n.field {\n  box-sizing: content-box;\n  width: 100%;\n  padding: 8px 12px;\n  border: 2px solid #2f5fd0;\n  border-radius: 6px;\n  font: inherit;\n${extra}}\n`;

const NOTICE_HTML =
  '<div data-id="card" class="card"><p class="title">お知らせ</p><p data-id="notice" class="notice">12 月 29 日から 1 月 3 日まで休業します。</p></div>';

const NOTICE_CSS = (width: string): string =>
  `${CARD_CSS}.title {\n  margin: 0 0 8px;\n  font-weight: 700;\n}\n.notice {\n${width}  margin: 0 16px;\n  padding: 8px;\n  border-radius: 6px;\n  background: #fff3c4;\n  font-size: 14px;\n}\n`;

const PICTURE = svgUri(
  480,
  240,
  "<rect width='480' height='240' fill='#9fd3f5'/><circle cx='380' cy='64' r='28' fill='#fff3c4'/><path d='M0 240l140-120 100 80 80-60 160 100z' fill='#2f9d5b'/>",
);

const ARTICLE_HTML =
  '<article data-id="card" class="card"><h3 class="title">春の公園</h3>' +
  `<img data-id="photo" class="photo" src="${PICTURE}" width="480" height="240" alt="丘と太陽の写真"></article>`;

const ARTICLE_CSS = (extra: string): string =>
  `${CARD_CSS}.title {\n  margin: 0 0 8px;\n  font-size: 16px;\n}\n.photo {\n  display: block;\n${extra}}\n`;

/** `id` spans the card's content box: 13px in from both edges (12px padding and a 1px border). */
const fillsCard = (id: string, inset: number): ValidatorSpec => ({
  kind: "allOf",
  of: [
    { kind: "offset", a: "card", b: id, edgeA: "left", edgeB: "left", min: inset - 1, max: inset + 1 },
    { kind: "offset", a: id, b: "card", edgeA: "right", edgeB: "right", min: inset - 1, max: inset + 1 },
  ],
});

export const sizingBasicsTrack: Track = {
  id: "sizing-basics",
  title: "幅の決まり方（box-sizing・width: auto・max-width: 100%）",
  summary: "box-sizing: border-box で余白と枠線を幅に含め、width: auto で margin のぶん自動で縮め、max-width: 100% で画像を枠に収める。",
  emoji: "↔️",
  lessons: [
    {
      id: "box-sizing",
      title: "余白と枠線を幅に含める: box-sizing: border-box",
      explanation:
        "<p>CSS の初期値（<code>box-sizing: content-box</code>）では、<code>width</code> は<b>中身の幅</b>だけを表し、<code>padding</code> と <code>border</code> は外側に足されます。<code>width: 100%</code> に左右の padding 12px と枠線 2px を付けると、親より 28px 広くなってはみ出します。</p><p><code>box-sizing: border-box</code> にすると、<code>width</code> と <code>height</code> が<b>padding と border を含めた大きさ</b>になります（margin は含みません）。幅を決めてから余白を足しても大きさが変わらないので、<code>*, *::before, *::after { box-sizing: border-box; }</code> とページ全体にかけておくのが定番です（このアプリのプレビューもそうしていますが、この部品は CSS で content-box に戻されています）。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/box-sizing",
      viz: { concept: "none" },
      challenge: {
        starterHTML: FIELD_HTML,
        starterCSS: FIELD_CSS(""),
        task: "検索欄（.field）が width: 100% なのに、カードの右からはみ出しています（以前の部品の CSS で box-sizing: content-box になっているため）。padding と枠線を含めて、カードの幅にぴったり収めよう。",
        snapshot: { props: ["box-sizing"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                ...fillsCard("field", 13),
                message: "検索欄がカードの幅にぴったり収まっていません（content-box では、width: 100% に padding と枠線が足されます）",
              },
              {
                kind: "computedEquals",
                id: "field",
                prop: "box-sizing",
                value: "border-box",
                message: "calc で引き算しなくても、box-sizing: border-box なら width に padding と枠線が含まれます",
              },
            ],
          },
        ],
        hints: ["width に padding と border を含める box-sizing の値を使います", ".field { box-sizing: border-box; }"],
        solution: FIELD_CSS("  box-sizing: border-box;\n"),
      },
    },
    {
      id: "width-auto",
      title: "margin のぶん自動で縮む: width: auto",
      explanation:
        "<p>ブロック要素の <code>width</code> の初期値 <code>auto</code> は、<b>親の幅から左右の margin（と padding・border）を引いた残り</b>に自動でなります。わざわざ <code>width: 100%</code> と書くと、幅は親と同じになり、そこに margin が足されて<b>はみ出します</b>。</p><p>左右に余白を取りたいブロックは、<code>width</code> を指定しない（<code>auto</code> のまま）のがいちばん簡単です。<code>calc(100% - 32px)</code> でも合いますが、margin を変えるたびに計算を直す必要があります。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/width",
      viz: { concept: "none" },
      challenge: {
        starterHTML: NOTICE_HTML,
        starterCSS: NOTICE_CSS("  width: 100%;\n"),
        task: "お知らせ（.notice）を左右 16px あけて置きたいのに、width: 100% のせいで右にはみ出しています。左右の margin を残したまま、カードの中に収めよう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                ...fillsCard("notice", 29),
                message: "お知らせが、左右に 16px ずつあけてカードに収まっていません（width: 100% に margin が足されてはみ出しています）",
              },
              {
                kind: "sourceMatches",
                pattern: "^(?![\\s\\S]*width\\s*:\\s*calc\\()",
                message: "calc で幅を引き算しなくても、width: auto（指定しない）なら左右の margin を除いた幅に自動で収まります",
              },
            ],
          },
        ],
        hints: ["width: 100% を消すか auto にすると、margin を除いた残りの幅になります", ".notice { width: auto; }"],
        solution: NOTICE_CSS(""),
      },
    },
    {
      id: "image-max-width",
      title: "画像を枠に収める: max-width: 100% と height: auto",
      explanation:
        "<p>画像は、指定がなければ<b>元の大きさ</b>で表示されるので、狭い枠ではみ出します。<code>max-width: 100%</code> にすると、親の幅より広いときだけ親の幅まで縮み、小さい画像は元の大きさのままです（<code>width: 100%</code> だと、小さい画像まで引き伸ばされます）。</p><p><code>&lt;img&gt;</code> に <code>width</code> と <code>height</code> の属性を書いておくと、読み込み前から場所を確保できますが、その高さが CSS の高さとして使われるので、幅だけ縮めると<b>縦に引き伸ばされます</b>。<code>height: auto</code> を一緒に書けば、縦横比を保って縮みます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/max-width",
      viz: { concept: "none" },
      challenge: {
        starterHTML: ARTICLE_HTML,
        starterCSS: ARTICLE_CSS(""),
        task: "記事の写真（幅 480px）が、幅 280px のカードからはみ出しています。写真をカードの幅まで縮め、縦横比（2:1）も保とう。",
        snapshot: { props: ["max-width"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                ...fillsCard("photo", 13),
                message: "写真がカードの幅に収まっていません（画像は元の大きさで表示されます）",
              },
              {
                kind: "sizeApprox",
                id: "photo",
                h: 127,
                tol: 1,
                message: "写真が縦に引き伸ばされています（height 属性の 240px が残っています。height: auto で縦横比を保ちます）",
              },
              {
                kind: "computedEquals",
                id: "photo",
                prop: "max-width",
                value: "100%",
                message: "width: 100% だと、枠より小さい画像まで引き伸ばされます。max-width: 100% で「枠より大きいときだけ縮める」にしましょう",
              },
            ],
          },
        ],
        hints: ["親より大きいときだけ縮める max-width と、縦横比を保つ height: auto を組み合わせます", ".photo { max-width: 100%; height: auto; }"],
        solution: ARTICLE_CSS("  max-width: 100%;\n  height: auto;\n"),
      },
    },
  ],
};
