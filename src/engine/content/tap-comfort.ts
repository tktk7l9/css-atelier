import type { ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// What a press reaches is judged by hit tests (hitTarget). The points are
// placed on boxes whose size the lesson does not change (the menu row, the
// fixed-width paragraph and its 28px line), so they stay on the same spot of
// the drawing whatever the learner does to the link itself. Geometry checks
// keep the layout the lesson relies on (the paragraph stays one 28px line).

const NAV_HTML =
  '<ul class="nav">' +
  '<li data-id="row1"><a data-id="l1" href="#">ホーム</a></li>' +
  '<li data-id="row2"><a data-id="l2" href="#">講座の一覧</a></li>' +
  '<li data-id="row3"><a data-id="l3" href="#">お問い合わせ</a></li>' +
  "</ul>";

const NAV_CSS = (row: string, link: string): string =>
  `.nav {\n  width: 240px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n  border: 1px solid #c5cde0;\n  border-radius: 8px;\n}\n.nav li {\n${row}  border-bottom: 1px solid #e3e8f4;\n}\n.nav li:last-child {\n  border-bottom: 0;\n}\n.nav a {\n${link}  color: #18203a;\n  text-decoration: none;\n}\n`;

const FAV_HTML =
  '<article data-id="card" class="card"><div data-id="photo" class="photo"></div><h3 class="title"><a data-id="link" href="#">海の見える宿 30 選</a></h3>' +
  '<p>夏の旅特集。予約の取り方も紹介します。</p><button data-id="fav" class="fav" type="button" aria-label="保存">♡</button></article>';

const FAV_CSS = (extra: string): string =>
  `.card {\n  position: relative;\n  width: 280px;\n  padding: 16px;\n  border: 1px solid #c5cde0;\n  border-radius: 12px;\n  background: #fff;\n}\n.photo {\n  height: 80px;\n  border-radius: 8px;\n  background: linear-gradient(#9fd3f5, #2f5fd0);\n}\n.title {\n  margin: 10px 0 4px;\n  font-size: 18px;\n}\n.card p {\n  margin: 0;\n}\n/* カード全体を記事へのリンクに */\n.card a::after {\n  content: "";\n  position: absolute;\n  inset: 0;\n}\n/* 保存ボタン */\n.fav {\n  margin-top: 8px;\n  width: 36px;\n  height: 36px;\n  border: 1px solid #c5cde0;\n  border-radius: 50%;\n  background: #fff;\n  font: inherit;\n${extra}}\n`;

const TEXT_HTML =
  '<p data-id="para" class="para"><a data-id="link" href="#">利用規約</a>をご覧ください。</p>' +
  '<p data-id="next" class="para">お問い合わせは平日 10 時から受け付けます。</p>';

const TEXT_CSS = (extra: string): string =>
  `.para {\n  width: 280px;\n  margin: 0;\n  line-height: 28px;\n}\n.para a {\n  color: #2f5fd0;\n${extra}}\n`;

/** The paragraph is still one 28px line: inline padding does not grow it. */
const lineKept: ValidatorSpec = { kind: "offset", a: "para", b: "para", edgeA: "top", edgeB: "bottom", min: 27.5, max: 28.5 };

export const tapComfortTrack: Track = {
  id: "tap-comfort",
  title: "押しやすさの工夫（行全体のリンク・リンクの上のボタン・上下の余白）",
  summary: "リンクを display: block にしてメニューの行全体を押せるようにし、カード全体に広げたリンクの上に保存ボタンを出し、上下の padding で文中のリンクの押せる範囲を行の高さを変えずに広げる。",
  emoji: "🛟",
  lessons: [
    {
      id: "block-links",
      title: "行全体を押せるメニュー: リンクを display: block に",
      explanation:
        "<p>メニューの行（<code>li</code>）に余白を付けても、押せるのは<b>リンクの文字の部分だけ</b>です。行の右側や余白を押しても、何も起きません。</p><p>リンクを <code>display: block</code> にすると、リンクが行の幅いっぱいの箱になります。余白を <code>li</code> からリンクの <code>padding</code> に移せば、見た目はそのままで、<b>行のどこを押してもリンクが反応</b>します。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/display",
      viz: { concept: "none" },
      challenge: {
        starterHTML: NAV_HTML,
        starterCSS: NAV_CSS("  padding: 10px 12px;\n", ""),
        task: "メニューの行の右側や余白を押しても、リンクが反応しません。見た目はそのままで、行のどこを押してもリンクが反応するようにしよう。",
        snapshot: {
          props: [],
          hits: [
            { at: "row2", fx: 0.85, fy: 0.5 },
            { at: "row2", fx: 0.03, fy: 0.15 },
          ],
        },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "hitTarget",
                at: "row2",
                fx: 0.85,
                fy: 0.5,
                top: "l2",
                message: "行の右側を押しても、リンクが反応しません（リンクを display: block にして、行の幅いっぱいに広げます）",
              },
              {
                kind: "hitTarget",
                at: "row2",
                fx: 0.03,
                fy: 0.15,
                top: "l2",
                message: "行の端の余白を押しても、リンクが反応しません（余白を li からリンクの padding に移します）",
              },
              {
                kind: "offset",
                a: "row2",
                b: "row2",
                edgeA: "top",
                edgeB: "bottom",
                min: 42.5,
                max: 44.5,
                message: "行の高さが変わっています（li の padding をリンクの padding に移して、見た目はそのままにします）",
              },
            ],
          },
        ],
        hints: ["押せる範囲はリンクの箱です。リンクを行いっぱいの箱にします", ".nav li { padding: 0; } .nav a { display: block; padding: 10px 12px; }"],
        solution: NAV_CSS("", "  display: block;\n  padding: 10px 12px;\n"),
      },
    },
    {
      id: "button-over-link",
      title: "広げたリンクの上にボタンを出す: position と z-index",
      explanation:
        "<p>見出しのリンクの <code>::after</code> をカード全体に広げると、カードのどこを押してもリンクが開きます。でも、::after は position: absolute で、カードの中の「保存」ボタン（position なし）より<b>上に描かれる</b>ので、ボタンを押してもリンクが開いてしまいます。</p><p>ボタンに <code>position: relative</code> と <code>z-index: 1</code> を指定すると、広げたリンクより手前に出て、ボタンだけは別に押せるようになります。カードの残りの部分は、今までどおりリンクです。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/z-index",
      viz: { concept: "none" },
      challenge: {
        starterHTML: FAV_HTML,
        starterCSS: FAV_CSS(""),
        task: "カード全体をリンクにしたら、「♡」（保存）ボタンを押しても記事が開くようになってしまいました。カードの残りはリンクのまま、保存ボタンだけを押せるようにしよう。",
        snapshot: {
          props: [],
          hits: [
            { at: "fav", fx: 0.5, fy: 0.5 },
            { at: "photo", fx: 0.5, fy: 0.5 },
          ],
        },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "hitTarget",
                at: "fav",
                top: "fav",
                message: "保存ボタンを押すと、記事へのリンクが反応してしまいます（ボタンに position: relative と z-index: 1 を指定して、広げたリンクより手前に出します）",
              },
              {
                kind: "hitTarget",
                at: "photo",
                top: "link",
                message: "写真を押しても、記事へのリンクが反応しなくなっています（::after でカード全体に広げたリンクは残します）",
              },
            ],
          },
        ],
        hints: ["position のないボタンは、position: absolute の ::after の下に描かれます", ".fav { position: relative; z-index: 1; }"],
        solution: FAV_CSS("  position: relative;\n  z-index: 1;\n"),
      },
    },
    {
      id: "inline-link-padding",
      title: "行の高さを変えずに押せる範囲を広げる: 文中のリンクの上下の padding",
      explanation:
        "<p>文中のリンク（インラインの要素）は、押せる範囲が文字の高さしかありません。インラインの要素に<b>上下の padding</b> を付けると、その分だけ箱は広がりますが、<b>まわりの行の位置は動きません</b>（上下の padding は、ほかの行に重なって広がります）。左右の padding は、前後の文字を押しのけます。</p><p><code>padding-block: 6px</code> のように上下だけを広げると、行の間隔はそのままで、リンクの少し上や下を押しても反応します。<code>display: inline-block</code> にすると、padding の分だけ行の高さが増えてしまいます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/padding-block",
      viz: { concept: "none" },
      challenge: {
        starterHTML: TEXT_HTML,
        starterCSS: TEXT_CSS(""),
        task: "文中の「利用規約」のリンクは、文字の高さしか押せません。行の高さ（28px）を変えずに、リンクの押せる範囲を上下に 6px ずつ広げよう。",
        snapshot: {
          props: [],
          hits: [
            { at: "para", fx: 0.05, fy: 0.07 },
            { at: "para", fx: 0.05, fy: 0.93 },
          ],
        },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "hitTarget", at: "para", fx: 0.05, fy: 0.07, top: "link" },
                  { kind: "hitTarget", at: "para", fx: 0.05, fy: 0.93, top: "link" },
                ],
                message: "リンクの文字のすぐ上や下を押しても、リンクが反応しません（リンクに上下の padding を付けます）",
              },
              {
                ...lineKept,
                message: "行の高さが 28px から変わっています（display はインラインのまま、上下の padding だけを付けます）",
              },
            ],
          },
        ],
        hints: ["インラインの要素の上下の padding は、行の高さを変えずに箱だけを広げます", ".para a { padding-block: 6px; }"],
        solution: TEXT_CSS("  padding-block: 6px;\n"),
      },
    },
  ],
};
