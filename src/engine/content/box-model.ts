import type { SnapshotRequest } from "../validate/snapshot.js";
import type { Track } from "./types.js";

// The box-model visualizer reads all four edges of padding / border / margin.
const BOX_PROPS: SnapshotRequest = {
  props: [
    "width",
    "height",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "border-top-width",
    "border-right-width",
    "border-bottom-width",
    "border-left-width",
    "margin-top",
    "margin-right",
    "margin-bottom",
    "margin-left",
  ],
};

export const boxModelTrack: Track = {
  id: "box-model",
  title: "ボックスモデル",
  summary: "content・padding・border・margin の4層を理解する。",
  emoji: "📦",
  lessons: [
    {
      id: "box-model-padding",
      title: "内側の余白: padding",
      explanation:
        "<p>すべての要素は content / padding / border / margin の<b>4層</b>でできています。<code>padding</code> は枠線の内側、コンテンツとの余白です。</p>",
      mdnPath: "/ja/docs/Web/CSS/padding",
      viz: { concept: "box-model", subjectId: "card" },
      challenge: {
        starterHTML: '<div data-id="card" class="card">Atelier</div>',
        starterCSS:
          ".card {\n  width: 160px;\n  background: #dbe4fb;\n  color: #18203a;\n}\n",
        task: "カードの内側に 20px の余白（padding）を付けよう。",
        snapshot: BOX_PROPS,
        validators: [
          { kind: "computedEquals", id: "card", prop: "padding-top", value: "20px" },
          { kind: "computedEquals", id: "card", prop: "padding-left", value: "20px" },
        ],
        hints: ["padding で内側の余白を指定します", "padding: 20px"],
        solution:
          ".card {\n  width: 160px;\n  padding: 20px;\n  background: #dbe4fb;\n  color: #18203a;\n}\n",
      },
    },
    {
      id: "box-model-border",
      title: "枠線: border",
      explanation:
        "<p><code>border</code> は太さ・線種・色をまとめて指定します（例: <code>3px solid #335</code>）。padding と margin の境界になります。</p>",
      mdnPath: "/ja/docs/Web/CSS/border",
      viz: { concept: "box-model", subjectId: "card" },
      challenge: {
        starterHTML: '<div data-id="card" class="card">Atelier</div>',
        starterCSS:
          ".card {\n  width: 160px;\n  padding: 16px;\n  background: #fff;\n  color: #18203a;\n}\n",
        task: "カードに 3px の実線ボーダーを付けよう。",
        snapshot: BOX_PROPS,
        validators: [
          { kind: "computedEquals", id: "card", prop: "border-top-width", value: "3px" },
          { kind: "declarationMatches", selector: ".card", prop: "border", pattern: "solid" },
        ],
        hints: ["border に 太さ・線種・色 を指定します", "border: 3px solid #335"],
        solution:
          ".card {\n  width: 160px;\n  padding: 16px;\n  border: 3px solid #335;\n  background: #fff;\n  color: #18203a;\n}\n",
      },
    },
    {
      id: "box-model-margin-auto",
      title: "外側の余白で中央寄せ: margin auto",
      explanation:
        "<p><code>margin</code> は枠線の外側の余白です。左右のマージンを <code>auto</code> にすると、ブロックは親の中で<b>水平中央</b>に寄ります。</p>",
      mdnPath: "/ja/docs/Web/CSS/margin",
      viz: { concept: "box-model", subjectId: "box" },
      challenge: {
        starterHTML:
          '<div data-id="wrap" class="wrap"><div data-id="box" class="box"></div></div>',
        starterCSS:
          ".wrap {\n  width: 300px;\n  background: #dbe4fb;\n  padding: 12px 0;\n}\n.box {\n  width: 120px;\n  height: 60px;\n  background: #2f5fd0;\n}\n",
        task: "青い箱を親の水平中央に寄せよう（margin を使って）。",
        snapshot: BOX_PROPS,
        validators: [
          { kind: "centeredIn", id: "box", axis: "x", containerId: "wrap" },
          { kind: "declarationMatches", selector: ".box", prop: "margin", pattern: "auto" },
        ],
        hints: ["左右マージンを auto にします", "margin: 0 auto"],
        solution:
          ".wrap {\n  width: 300px;\n  background: #dbe4fb;\n  padding: 12px 0;\n}\n.box {\n  width: 120px;\n  height: 60px;\n  margin: 0 auto;\n  background: #2f5fd0;\n}\n",
      },
    },
  ],
};
