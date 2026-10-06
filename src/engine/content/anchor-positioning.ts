import type { Track } from "./types.js";

// Anchor positioning is validated by geometry (where the positioned element
// actually ended up relative to its anchor), so any valid spelling passes.
const SUPPORT_NOTE =
  "<p>Baseline 2026（2026 年 1 月から主要ブラウザの最新版で利用可: Chrome 129 / Firefox 147 / Safari 26 以降）。古いブラウザでは動きません。</p>";

export const anchorPositioningTrack: Track = {
  id: "anchor-positioning",
  title: "アンカーポジショニング",
  summary: "要素を別の要素に結びつけて配置する。ツールチップやメニューが CSS だけで。",
  emoji: "⚓",
  lessons: [
    {
      id: "anchor-position-area",
      title: "アンカーに結びつける: anchor-name と position-area",
      explanation:
        "<p>アンカーポジショニングは、絶対配置の要素を<b>別の要素（アンカー）</b>に結びつけます。基準にしたい要素に <code>anchor-name: --btn</code> と名前を付け、配置する側で <code>position-anchor: --btn</code> と指定します。</p><p><code>position-area</code> は、アンカーを中央に置いた 3×3 のマス目のどこに置くかを決めます。<code>top</code> なら真上、<code>bottom right</code> なら右下です。</p>" +
        SUPPORT_NOTE,
      mdnPath: "/ja/docs/Web/CSS/Guides/Anchor_positioning/Using",
      viz: { concept: "none" },
      challenge: {
        starterHTML:
          '<div class="stage"><button data-id="btn" class="btn" type="button">保存</button><div data-id="tip" class="tip">ここを押すと保存</div></div>',
        starterCSS:
          ".stage {\n  padding: 70px 90px;\n}\n.btn {\n  anchor-name: --btn;\n  padding: 8px 16px;\n}\n.tip {\n  position: absolute;\n  \n  padding: 4px 8px;\n  background: #18203a;\n  color: #fff;\n  font-size: 13px;\n  white-space: nowrap;\n}\n",
        task: ".tip を --btn に結びつけ（position-anchor）、ボタンの真上に置こう（position-area: top）。",
        snapshot: { props: ["position-anchor", "position-area"] },
        validators: [
          { kind: "computedEquals", id: "tip", prop: "position-anchor", value: "--btn", message: ".tip に position-anchor: --btn を指定しましょう" },
          { kind: "order", ids: ["tip", "btn"], axis: "y", message: "ツールチップがボタンの上にありません" },
          { kind: "noOverlap", ids: ["tip", "btn"], message: "ツールチップがボタンに重なっています" },
          { kind: "centeredIn", id: "tip", axis: "x", containerId: "btn", message: "ツールチップがボタンの真上（横中央）にありません" },
        ],
        hints: ["position-anchor: --btn で、どのアンカーを基準にするか指定します", "position-area: top"],
        solution:
          ".stage {\n  padding: 70px 90px;\n}\n.btn {\n  anchor-name: --btn;\n  padding: 8px 16px;\n}\n.tip {\n  position: absolute;\n  position-anchor: --btn;\n  position-area: top;\n  padding: 4px 8px;\n  background: #18203a;\n  color: #fff;\n  font-size: 13px;\n  white-space: nowrap;\n}\n",
      },
    },
    {
      id: "anchor-function",
      title: "辺を合わせる: anchor() 関数",
      explanation:
        "<p><code>anchor()</code> は、アンカーの<b>辺の位置</b>を長さとして返す関数で、<code>top</code> や <code>left</code> などの inset プロパティの値に使います。<code>top: anchor(bottom)</code> は「自分の上端をアンカーの下端に合わせる」という意味です。</p><p>position-area より細かく、辺ごとに合わせ方を決められます。<code>calc(anchor(bottom) + 8px)</code> のようにすき間も足せます。</p>" +
        SUPPORT_NOTE,
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/anchor",
      viz: { concept: "none" },
      challenge: {
        starterHTML:
          '<div class="stage"><button data-id="btn" class="btn" type="button">メニュー ▾</button><p data-id="text" class="text">本文のテキスト。メニューはこの上に重なって開きます。</p><ul data-id="menu" class="menu"><li>開く</li><li>保存</li></ul></div>',
        starterCSS:
          ".stage {\n  padding: 24px 40px;\n}\n.btn {\n  display: block;\n  anchor-name: --btn;\n  padding: 8px 16px;\n}\n.text {\n  margin: 0;\n  padding: 8px 0;\n}\n.menu {\n  position: absolute;\n  position-anchor: --btn;\n  \n  margin: 0;\n  padding: 4px 0;\n  list-style: none;\n  min-width: 120px;\n  background: #fff;\n  border: 1px solid #335;\n}\n.menu li {\n  padding: 4px 12px;\n}\n",
        task: "メニューの上端をボタンの下端に、左端をボタンの左端に合わせよう（anchor() を使う）。",
        snapshot: { props: ["position-anchor"] },
        validators: [
          { kind: "sourceMatches", pattern: "anchor\\(", message: "anchor() 関数を使いましょう" },
          { kind: "alignedEdge", ids: ["menu", "text"], edge: "top", message: "メニューの上端がボタンの下端に合っていません" },
          { kind: "alignedEdge", ids: ["menu", "btn"], edge: "left", message: "メニューの左端がボタンの左端に合っていません" },
        ],
        hints: ["top: anchor(bottom) で、上端をアンカーの下端に合わせます", "left: anchor(left)"],
        solution:
          ".stage {\n  padding: 24px 40px;\n}\n.btn {\n  display: block;\n  anchor-name: --btn;\n  padding: 8px 16px;\n}\n.text {\n  margin: 0;\n  padding: 8px 0;\n}\n.menu {\n  position: absolute;\n  position-anchor: --btn;\n  top: anchor(bottom);\n  left: anchor(left);\n  margin: 0;\n  padding: 4px 0;\n  list-style: none;\n  min-width: 120px;\n  background: #fff;\n  border: 1px solid #335;\n}\n.menu li {\n  padding: 4px 12px;\n}\n",
      },
    },
    {
      id: "anchor-try-fallbacks",
      title: "はみ出したら反転: position-try-fallbacks",
      explanation:
        "<p>ツールチップをボタンの上に出したくても、ボタンが画面の上端近くにあると<b>はみ出して</b>しまいます。<code>position-try-fallbacks</code> に代わりの置き方を書いておくと、はみ出すときだけブラウザが順に試してくれます。</p><p><code>flip-block</code> は上下を反転、<code>flip-inline</code> は左右を反転します。JavaScript で位置を計算する必要はもうありません。</p>" +
        SUPPORT_NOTE,
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/position-try-fallbacks",
      viz: { concept: "none" },
      challenge: {
        starterHTML:
          '<div class="stage"><button data-id="btn" class="btn" type="button">保存</button><div data-id="tip" class="tip">ここを押すと保存</div></div>',
        starterCSS:
          ".stage {\n  padding: 6px 90px;\n}\n.btn {\n  anchor-name: --btn;\n  padding: 8px 16px;\n}\n.tip {\n  position: absolute;\n  position-anchor: --btn;\n  position-area: top;\n  \n  padding: 4px 8px;\n  background: #18203a;\n  color: #fff;\n  font-size: 13px;\n  white-space: nowrap;\n}\n",
        task: "ツールチップが上にはみ出しています。position-area: top はそのままに、はみ出すときは下側へ反転させよう。",
        snapshot: { props: ["position-anchor", "position-area"] },
        validators: [
          { kind: "declarationEquals", selector: ".tip", prop: "position-area", value: "top", message: "position-area: top は残したまま、代わりの置き方を足しましょう" },
          { kind: "order", ids: ["btn", "tip"], axis: "y", message: "ツールチップがボタンの下側に反転していません" },
          { kind: "centeredIn", id: "tip", axis: "x", containerId: "btn", message: "ツールチップがボタンの横中央にありません" },
        ],
        hints: ["position-try-fallbacks に、はみ出したときの代わりの置き方を書きます", "position-try-fallbacks: flip-block"],
        solution:
          ".stage {\n  padding: 6px 90px;\n}\n.btn {\n  anchor-name: --btn;\n  padding: 8px 16px;\n}\n.tip {\n  position: absolute;\n  position-anchor: --btn;\n  position-area: top;\n  position-try-fallbacks: flip-block;\n  padding: 4px 8px;\n  background: #18203a;\n  color: #fff;\n  font-size: 13px;\n  white-space: nowrap;\n}\n",
      },
    },
  ],
};
