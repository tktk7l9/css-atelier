import type { Track } from "./types.js";

// Like the first anchor track, these lessons are judged by geometry: where the
// positioned box ended up against its anchors, so any valid spelling passes.

const SUPPORT =
  "<p>Baseline 2026（2026 年 1 月から主要ブラウザの最新版で利用可: Chrome 125 / Firefox 147 / Safari 26 以降）。古いブラウザでは動きません。</p>";

const CENTER_HTML =
  '<div class="stage"><button data-id="btn" class="btn" type="button">保存</button><div data-id="tip" class="tip">Ctrl + S で保存できます</div></div>';

const CENTER_CSS = (extra: string): string =>
  `.stage {\n  padding: 60px 0 0 120px;\n}\n.btn {\n  anchor-name: --btn;\n  padding: 8px 16px;\n}\n.tip {\n  position: absolute;\n  position-anchor: --btn;\n  bottom: anchor(top);\n  left: anchor(left);\n  padding: 4px 8px;\n  background: #18203a;\n  color: #fff;\n${extra}}\n`;

const SIZE_HTML =
  '<div class="stage"><button data-id="btn" class="btn" type="button">表示の順番を選ぶ</button><ul data-id="menu" class="menu"><li>新しい順</li><li>古い順</li></ul></div>';

const SIZE_CSS = (extra: string): string =>
  `.stage {\n  padding: 16px;\n}\n.btn {\n  anchor-name: --btn;\n  padding: 8px 16px;\n}\n.menu {\n  position: absolute;\n  position-anchor: --btn;\n  top: anchor(bottom);\n  left: anchor(left);\n  margin: 0;\n  padding: 8px;\n  background: #dbe4fb;\n  list-style: none;\n${extra}}\n`;

const LINE_HTML =
  '<div class="flow"><div data-id="a" class="node a">注文</div><div data-id="b" class="node b">発送</div><div data-id="line" class="line"></div></div>';

const LINE_CSS = (extra: string): string =>
  `.flow {\n  display: flex;\n  justify-content: space-between;\n  padding: 16px;\n}\n.node {\n  padding: 16px;\n  background: #dbe4fb;\n}\n.a {\n  anchor-name: --a;\n}\n.b {\n  anchor-name: --b;\n}\n/* 2 つの箱をつなぐ線 */\n.line {\n  position: absolute;\n  position-anchor: --a;\n  top: anchor(center);\n  height: 2px;\n  background: #2f5fd0;\n${extra}}\n`;

export const anchorInPracticeTrack: Track = {
  id: "anchor-in-practice",
  title: "アンカーの応用（anchor-center・anchor-size()・2 つのアンカー）",
  summary: "justify-self: anchor-center でアンカーの中央にそろえ、anchor-size() でメニューの幅をボタンに合わせ、anchor() に名前を書いて 2 つのアンカーの間に線を渡す。",
  emoji: "🪝",
  lessons: [
    {
      id: "anchor-center",
      title: "アンカーの中央にそろえる: anchor-center",
      explanation:
        "<p><code>anchor()</code> で辺を合わせると、ツールチップの<b>端</b>がアンカーの端にそろいます。中央でそろえたいときに、幅を計算する必要はありません。</p><p><code>justify-self: anchor-center</code> は、配置する要素をアンカーの<b>横方向の中央</b>にそろえます（縦方向は <code>align-self: anchor-center</code>）。ただし、<code>left</code> などの横方向の inset が残っていると、その位置のままで中央にそろいません。<code>left</code> を外して使います。</p>" +
        SUPPORT,
      mdnPath: "/ja/docs/Web/CSS/Guides/Anchor_positioning/Using",
      viz: { concept: "none" },
      challenge: {
        starterHTML: CENTER_HTML,
        starterCSS: CENTER_CSS(""),
        task: "ツールチップの左端がボタンの左端にそろっています。left を消して justify-self: anchor-center を指定し、ボタンの中央にそろえよう。",
        snapshot: { props: [] },
        validators: [
          { kind: "centeredIn", id: "tip", axis: "x", containerId: "btn", message: "ツールチップがボタンの中央に来ていません（left: anchor(left) を消して、justify-self: anchor-center を指定します）" },
        ],
        hints: ["left: anchor(left); の行を消します", ".tip { justify-self: anchor-center; }"],
        solution: CENTER_CSS("  justify-self: anchor-center;\n").replace("  left: anchor(left);\n", ""),
      },
    },
    {
      id: "anchor-size",
      title: "アンカーの幅に合わせる: anchor-size()",
      explanation:
        "<p><code>anchor-size()</code> は、アンカーの大きさを長さとして返す関数です。<code>width: anchor-size(width)</code> と書くと、メニューの幅がボタンの幅と同じになります。ボタンの文字が変わっても、一緒に変わります。</p><p>使えるのは、アンカーで配置した要素の大きさ・inset・margin のプロパティです。<code>calc()</code> の中でも使えるので、<code>calc(anchor-size(width) * 2)</code> のように倍にもできます。</p>" +
        SUPPORT,
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/anchor-size",
      viz: { concept: "none" },
      challenge: {
        starterHTML: SIZE_HTML,
        starterCSS: SIZE_CSS(""),
        task: "メニューの幅がボタンより狭くなっています。.menu の width を anchor-size(width) にして、ボタンと同じ幅にしよう。",
        snapshot: { props: [] },
        validators: [
          { kind: "relativeSize", a: "menu", b: "btn", ratio: 1, dim: "w", tol: 1, message: "メニューの幅がボタンと同じになっていません（.menu に width: anchor-size(width)）" },
        ],
        hints: ["anchor-size() は position-anchor で結んだアンカーの大きさを返します", ".menu { width: anchor-size(width); }"],
        solution: SIZE_CSS("  width: anchor-size(width);\n"),
      },
    },
    {
      id: "anchor-two-names",
      title: "2 つのアンカーをつなぐ: anchor(--名前 辺)",
      explanation:
        "<p><code>anchor()</code> の最初に名前を書くと、<code>position-anchor</code> とは別のアンカーの辺を使えます。<code>left: anchor(--a right)</code> は <code>--a</code> の右端に、<code>right: anchor(--b left)</code> は <code>--b</code> の左端に合わせます。</p><p>左右の両方を決めると、幅はその間いっぱいになり、箱の間に線を渡せます。箱の位置が変わっても線がついてきます。ここで名前を書いても、要素がそのアンカーに結びつくわけではありません。結びつけるのは <code>position-anchor</code> です。</p>" +
        SUPPORT,
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/anchor",
      viz: { concept: "none" },
      challenge: {
        starterHTML: LINE_HTML,
        starterCSS: LINE_CSS(""),
        task: "線の左端を --a の右端に、右端を --b の左端に合わせて、2 つの箱をつなごう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "offset", a: "a", b: "line", edgeA: "right", edgeB: "left", min: -1, max: 1, message: "" },
              { kind: "offset", a: "b", b: "line", edgeA: "left", edgeB: "right", min: -1, max: 1, message: "" },
            ],
            message: "線が 2 つの箱をつないでいません（.line に left: anchor(--a right) と right: anchor(--b left)）",
          },
        ],
        hints: ["anchor() の最初に、アンカーの名前を書きます", ".line {\n  left: anchor(--a right);\n  right: anchor(--b left);\n}"],
        solution: LINE_CSS("  left: anchor(--a right);\n  right: anchor(--b left);\n"),
      },
    },
  ],
};
