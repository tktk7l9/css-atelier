import type { Track } from "./types.js";

export const flexboxTrack: Track = {
  id: "flexbox",
  title: "Flexbox",
  summary: "1次元レイアウトの定番。主軸と交差軸で要素をそろえる。",
  emoji: "🪡",
  lessons: [
    {
      id: "flexbox-justify-center",
      title: "主軸でそろえる: justify-content",
      explanation:
        "<p><code>display: flex</code> にすると子要素は<b>主軸</b>（既定では横）に並びます。<code>justify-content</code> は主軸方向の配置を決め、<code>center</code> で中央に集めます。</p>",
      mdnPath: "/ja/docs/Web/CSS/justify-content",
      viz: { concept: "flexbox", containerId: "pond" },
      challenge: {
        starterHTML:
          '<div data-id="pond" class="pond"><div data-id="frog" class="frog"></div></div>',
        starterCSS:
          ".pond {\n  display: flex;\n  width: 300px;\n  height: 160px;\n  background: #dbe4fb;\n}\n.frog {\n  width: 48px;\n  height: 48px;\n  background: #2f9d5b;\n  border-radius: 8px;\n}\n",
        task: "カエル（緑）を池の横方向の中央へ運ぼう。",
        snapshot: { props: ["display", "justify-content"] },
        validators: [
          { kind: "declarationEquals", selector: ".pond", prop: "display", value: "flex" },
          { kind: "centeredIn", id: "frog", axis: "x", containerId: "pond" },
        ],
        hints: ["主軸（横）の配置は justify-content で決まります", "値は center"],
        solution:
          ".pond {\n  display: flex;\n  justify-content: center;\n  width: 300px;\n  height: 160px;\n  background: #dbe4fb;\n}\n.frog {\n  width: 48px;\n  height: 48px;\n  background: #2f9d5b;\n  border-radius: 8px;\n}\n",
      },
    },
    {
      id: "flexbox-align-center",
      title: "交差軸でそろえる: align-items",
      explanation:
        "<p><code>align-items</code> は<b>交差軸</b>（主軸が横なら縦）の配置を決めます。<code>center</code> で縦方向の中央にそろえます。</p>",
      mdnPath: "/ja/docs/Web/CSS/align-items",
      viz: { concept: "flexbox", containerId: "pond" },
      challenge: {
        starterHTML:
          '<div data-id="pond" class="pond"><div data-id="frog" class="frog"></div></div>',
        starterCSS:
          ".pond {\n  display: flex;\n  width: 300px;\n  height: 160px;\n  background: #dbe4fb;\n}\n.frog {\n  width: 48px;\n  height: 48px;\n  background: #2f9d5b;\n  border-radius: 8px;\n}\n",
        task: "カエルを池の縦方向の中央へ運ぼう。",
        snapshot: { props: ["display", "align-items"] },
        validators: [
          { kind: "declarationEquals", selector: ".pond", prop: "display", value: "flex" },
          { kind: "centeredIn", id: "frog", axis: "y", containerId: "pond" },
        ],
        hints: ["交差軸（縦）の配置は align-items で決まります", "値は center"],
        solution:
          ".pond {\n  display: flex;\n  align-items: center;\n  width: 300px;\n  height: 160px;\n  background: #dbe4fb;\n}\n.frog {\n  width: 48px;\n  height: 48px;\n  background: #2f9d5b;\n  border-radius: 8px;\n}\n",
      },
    },
    {
      id: "flexbox-place-center",
      title: "完全中央: justify-content × align-items",
      explanation:
        "<p>主軸と交差軸の両方を <code>center</code> にすると、要素はコンテナの<b>ど真ん中</b>に配置されます。</p>",
      mdnPath: "/ja/docs/Web/CSS/CSS_flexible_box_layout",
      viz: { concept: "flexbox", containerId: "pond" },
      challenge: {
        starterHTML:
          '<div data-id="pond" class="pond"><div data-id="frog" class="frog"></div></div>',
        starterCSS:
          ".pond {\n  display: flex;\n  width: 300px;\n  height: 160px;\n  background: #dbe4fb;\n}\n.frog {\n  width: 48px;\n  height: 48px;\n  background: #2f9d5b;\n  border-radius: 8px;\n}\n",
        task: "カエルを池の中央（縦・横とも）に置こう。",
        snapshot: { props: ["display", "justify-content", "align-items"] },
        validators: [
          { kind: "declarationEquals", selector: ".pond", prop: "display", value: "flex" },
          { kind: "centeredIn", id: "frog", axis: "x", containerId: "pond" },
          { kind: "centeredIn", id: "frog", axis: "y", containerId: "pond" },
        ],
        hints: ["justify-content と align-items を両方 center に"],
        solution:
          ".pond {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  width: 300px;\n  height: 160px;\n  background: #dbe4fb;\n}\n.frog {\n  width: 48px;\n  height: 48px;\n  background: #2f9d5b;\n  border-radius: 8px;\n}\n",
      },
    },
    {
      id: "flexbox-row",
      title: "横一列に並べる: display: flex",
      explanation:
        "<p>ブロック要素は既定で縦に積まれます。親を <code>display: flex</code> にすると、子要素は<b>横一列</b>に並びます。</p>",
      mdnPath: "/ja/docs/Web/CSS/flex-direction",
      viz: { concept: "flexbox", containerId: "row" },
      challenge: {
        starterHTML:
          '<div data-id="row" class="row"><div data-id="a" class="box"></div><div data-id="b" class="box"></div><div data-id="c" class="box"></div></div>',
        starterCSS:
          ".row {\n  width: 300px;\n  background: #dbe4fb;\n}\n.box {\n  width: 60px;\n  height: 60px;\n  background: #2f5fd0;\n  border-radius: 8px;\n}\n",
        task: "3つの箱を縦積みから横一列（a→b→c）に並べ替えよう。",
        snapshot: { props: ["display"] },
        validators: [
          { kind: "declarationEquals", selector: ".row", prop: "display", value: "flex" },
          { kind: "order", ids: ["a", "b", "c"], axis: "x" },
          { kind: "alignedEdge", ids: ["a", "b", "c"], edge: "top" },
        ],
        hints: ["親要素 .row を flex コンテナにします", "display: flex"],
        solution:
          ".row {\n  display: flex;\n  width: 300px;\n  background: #dbe4fb;\n}\n.box {\n  width: 60px;\n  height: 60px;\n  background: #2f5fd0;\n  border-radius: 8px;\n}\n",
      },
    },
    {
      id: "flexbox-grow",
      title: "余白を埋める: flex: 1",
      explanation:
        "<p><code>flex: 1</code> を付けた要素は、余ったスペースを伸びて埋めます。他の要素は自分のサイズを保ちます。</p>",
      mdnPath: "/ja/docs/Web/CSS/flex",
      viz: { concept: "flexbox", containerId: "row" },
      challenge: {
        starterHTML:
          '<div data-id="row" class="row"><div data-id="a" class="grow">伸びる</div><div data-id="b" class="fixed">固定</div></div>',
        starterCSS:
          ".row {\n  display: flex;\n  width: 300px;\n}\n.grow {\n  background: #2f5fd0;\n  color: #fff;\n  padding: 10px;\n}\n.fixed {\n  width: 80px;\n  background: #dbe4fb;\n  padding: 10px;\n}\n",
        task: "「伸びる」箱を flex: 1 で伸ばし、固定80px 以外の残りスペースを埋めよう。",
        snapshot: { props: ["display"] },
        validators: [
          { kind: "declarationEquals", selector: ".row", prop: "display", value: "flex" },
          { kind: "sizeApprox", id: "a", w: 220, tol: 4 },
          { kind: "alignedEdge", ids: ["a", "b"], edge: "top" },
        ],
        hints: ["伸ばしたい要素に flex: 1 を指定します", "残り = 300 − 80 = 220px"],
        solution:
          ".row {\n  display: flex;\n  width: 300px;\n}\n.grow {\n  flex: 1;\n  background: #2f5fd0;\n  color: #fff;\n  padding: 10px;\n}\n.fixed {\n  width: 80px;\n  background: #dbe4fb;\n  padding: 10px;\n}\n",
      },
    },
    {
      id: "flexbox-gap",
      title: "間隔を空ける: gap",
      explanation:
        "<p>flex コンテナでも <code>gap</code> で子要素どうしの間隔をまとめて指定できます。マージンより簡単で端に余白が出ません。</p>",
      mdnPath: "/ja/docs/Web/CSS/gap",
      viz: { concept: "flexbox", containerId: "row" },
      challenge: {
        starterHTML:
          '<div data-id="row" class="row"><div data-id="a" class="item"></div><div data-id="b" class="item"></div><div data-id="c" class="item"></div></div>',
        starterCSS:
          ".row {\n  display: flex;\n  width: 300px;\n}\n.item {\n  width: 60px;\n  height: 50px;\n  background: #2f5fd0;\n  border-radius: 6px;\n}\n",
        task: "箱の間に 16px の間隔（gap）を空けよう。",
        snapshot: { props: ["display", "column-gap"] },
        validators: [
          { kind: "declarationEquals", selector: ".row", prop: "display", value: "flex" },
          { kind: "computedEquals", id: "row", prop: "column-gap", value: "16px" },
        ],
        hints: ["gap: 16px を flex コンテナに指定します"],
        solution:
          ".row {\n  display: flex;\n  gap: 16px;\n  width: 300px;\n}\n.item {\n  width: 60px;\n  height: 50px;\n  background: #2f5fd0;\n  border-radius: 6px;\n}\n",
      },
    },
  ],
};
