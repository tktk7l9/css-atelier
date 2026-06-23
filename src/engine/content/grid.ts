import type { Track } from "./types.js";

export const gridTrack: Track = {
  id: "grid",
  title: "Grid",
  summary: "2次元レイアウト。行と列のトラックで自在に配置する。",
  emoji: "🧱",
  lessons: [
    {
      id: "grid-three-columns",
      title: "列を作る: grid-template-columns",
      explanation:
        "<p><code>display: grid</code> と <code>grid-template-columns</code> で列（トラック）を定義します。<code>1fr</code> は余りスペースを比率で分け合う単位です。<code>repeat(3, 1fr)</code> で等幅3列に。</p>",
      mdnPath: "/ja/docs/Web/CSS/grid-template-columns",
      viz: { concept: "grid", containerId: "grid" },
      challenge: {
        starterHTML:
          '<div data-id="grid" class="grid"><div data-id="a"></div><div data-id="b"></div><div data-id="c"></div></div>',
        starterCSS:
          ".grid {\n  display: grid;\n  width: 300px;\n  background: #dbe4fb;\n}\n.grid > div {\n  height: 48px;\n  background: #2f5fd0;\n  border-radius: 6px;\n}\n",
        task: "3つのセルを等幅3列に並べよう（各 100px）。",
        snapshot: { props: ["display", "grid-template-columns"] },
        validators: [
          { kind: "declarationEquals", selector: ".grid", prop: "display", value: "grid" },
          { kind: "sizeApprox", id: "a", w: 100, tol: 3 },
          { kind: "sizeApprox", id: "b", w: 100, tol: 3 },
          { kind: "order", ids: ["a", "b", "c"], axis: "x" },
          { kind: "alignedEdge", ids: ["a", "b", "c"], edge: "top" },
        ],
        hints: ["grid-template-columns でトラックを定義します", "repeat(3, 1fr) または 1fr 1fr 1fr"],
        solution:
          ".grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  width: 300px;\n  background: #dbe4fb;\n}\n.grid > div {\n  height: 48px;\n  background: #2f5fd0;\n  border-radius: 6px;\n}\n",
      },
    },
    {
      id: "grid-fr-ratio",
      title: "比率で分ける: fr 単位",
      explanation:
        "<p><code>fr</code> は比率です。<code>1fr 2fr 1fr</code> なら中央の列が両端の<b>2倍</b>の幅になります。</p>",
      mdnPath: "/ja/docs/Web/CSS/grid-template-columns",
      viz: { concept: "grid", containerId: "grid" },
      challenge: {
        starterHTML:
          '<div data-id="grid" class="grid"><div data-id="a"></div><div data-id="b"></div><div data-id="c"></div></div>',
        starterCSS:
          ".grid {\n  display: grid;\n  width: 400px;\n  background: #dbe4fb;\n}\n.grid > div {\n  height: 48px;\n  background: #2f5fd0;\n  border-radius: 6px;\n}\n",
        task: "中央の列を、両端の列の2倍の幅にしよう。",
        snapshot: { props: ["display", "grid-template-columns"] },
        validators: [
          { kind: "declarationEquals", selector: ".grid", prop: "display", value: "grid" },
          { kind: "relativeSize", a: "b", b: "a", ratio: 2, dim: "w" },
          { kind: "relativeSize", a: "b", b: "c", ratio: 2, dim: "w" },
          { kind: "order", ids: ["a", "b", "c"], axis: "x" },
        ],
        hints: ["3つのトラックの比率を指定します", "1fr 2fr 1fr"],
        solution:
          ".grid {\n  display: grid;\n  grid-template-columns: 1fr 2fr 1fr;\n  width: 400px;\n  background: #dbe4fb;\n}\n.grid > div {\n  height: 48px;\n  background: #2f5fd0;\n  border-radius: 6px;\n}\n",
      },
    },
    {
      id: "grid-gap",
      title: "すき間を空ける: gap",
      explanation:
        "<p><code>gap</code> はトラック間のすき間（溝）をまとめて指定します。マージンより簡単で、外側に余白が出ません。</p>",
      mdnPath: "/ja/docs/Web/CSS/gap",
      viz: { concept: "grid", containerId: "grid" },
      challenge: {
        starterHTML:
          '<div data-id="grid" class="grid"><div data-id="a"></div><div data-id="b"></div><div data-id="c"></div></div>',
        starterCSS:
          ".grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  width: 320px;\n  background: #dbe4fb;\n}\n.grid > div {\n  height: 48px;\n  background: #2f5fd0;\n  border-radius: 6px;\n}\n",
        task: "セルの間に 16px のすき間を空けよう。",
        snapshot: { props: ["display", "column-gap", "row-gap"] },
        validators: [
          { kind: "declarationEquals", selector: ".grid", prop: "display", value: "grid" },
          { kind: "computedEquals", id: "grid", prop: "column-gap", value: "16px" },
        ],
        hints: ["gap プロパティを使います", "gap: 16px"],
        solution:
          ".grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 16px;\n  width: 320px;\n  background: #dbe4fb;\n}\n.grid > div {\n  height: 48px;\n  background: #2f5fd0;\n  border-radius: 6px;\n}\n",
      },
    },
    {
      id: "grid-areas",
      title: "領域で組む: grid-template-areas",
      explanation:
        "<p><code>grid-template-areas</code> は名前付きの領域でレイアウトを“絵”のように書けます。各要素に <code>grid-area</code> で名前を割り当てます。</p>",
      mdnPath: "/ja/docs/Web/CSS/grid-template-areas",
      viz: { concept: "grid", containerId: "layout" },
      challenge: {
        starterHTML:
          '<div data-id="layout" class="layout"><div data-id="head" class="head">Head</div><div data-id="side" class="side">Side</div><div data-id="main" class="main">Main</div></div>',
        starterCSS:
          ".layout {\n  display: grid;\n  grid-template-columns: 100px 1fr;\n  width: 300px;\n}\n.head { background: #2f5fd0; color: #fff; padding: 8px; }\n.side { background: #dbe4fb; padding: 8px; }\n.main { background: #eef1f8; padding: 8px; }\n",
        task: "上段に head を全幅、その下に side（左100px）と main（右）を配置しよう（grid-template-areas を使う）。",
        snapshot: { props: ["display"] },
        validators: [
          { kind: "sourceMatches", pattern: "grid-template-areas" },
          { kind: "sizeApprox", id: "head", w: 300, tol: 3 },
          { kind: "order", ids: ["head", "side"], axis: "y" },
          { kind: "alignedEdge", ids: ["side", "main"], edge: "top" },
          { kind: "order", ids: ["side", "main"], axis: "x" },
          { kind: "sizeApprox", id: "side", w: 100, tol: 3 },
        ],
        hints: ['grid-template-areas: "head head" "side main";', "各要素に grid-area: head / side / main を割り当てます"],
        solution:
          ".layout {\n  display: grid;\n  grid-template-columns: 100px 1fr;\n  grid-template-areas: \"head head\" \"side main\";\n  width: 300px;\n}\n.head { grid-area: head; background: #2f5fd0; color: #fff; padding: 8px; }\n.side { grid-area: side; background: #dbe4fb; padding: 8px; }\n.main { grid-area: main; background: #eef1f8; padding: 8px; }\n",
      },
    },
  ],
};
