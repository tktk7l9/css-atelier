import type { Track } from "./types.js";

export const logicalPropsTrack: Track = {
  id: "logical-props",
  title: "論理プロパティ",
  summary: "left/right ではなく inline/block で、書字方向に強いCSS。",
  emoji: "🧭",
  lessons: [
    {
      id: "logical-padding",
      title: "block と inline: padding-block / padding-inline",
      explanation:
        "<p>論理プロパティは物理方向（上下左右）ではなく、<b>書字方向</b>を基準にします。横書きでは <code>block</code>＝上下、<code>inline</code>＝左右です。</p>",
      mdnPath: "/ja/docs/Web/CSS/CSS_logical_properties_and_values",
      viz: { concept: "none" },
      challenge: {
        starterHTML: '<div data-id="box" class="box">Logical</div>',
        starterCSS: ".box {\n  width: 200px;\n  background: #dbe4fb;\n}\n",
        task: "padding-block を 12px、padding-inline を 24px にしよう。",
        snapshot: { props: ["padding-top", "padding-left"] },
        validators: [
          { kind: "sourceMatches", pattern: "padding-inline" },
          { kind: "computedEquals", id: "box", prop: "padding-top", value: "12px" },
          { kind: "computedEquals", id: "box", prop: "padding-left", value: "24px" },
        ],
        hints: ["padding-block は上下、padding-inline は左右（横書き時）", "padding-block: 12px; padding-inline: 24px;"],
        solution:
          ".box {\n  width: 200px;\n  padding-block: 12px;\n  padding-inline: 24px;\n  background: #dbe4fb;\n}\n",
      },
    },
    {
      id: "logical-margin-auto",
      title: "margin-inline: auto で中央寄せ",
      explanation:
        "<p><code>margin-inline: auto</code> は左右マージンを auto にする論理版。書字方向に依存せず中央寄せできます。</p>",
      mdnPath: "/ja/docs/Web/CSS/margin-inline",
      viz: { concept: "none" },
      challenge: {
        starterHTML: '<div data-id="wrap" class="wrap"><div data-id="box" class="box"></div></div>',
        starterCSS:
          ".wrap {\n  width: 300px;\n  background: #dbe4fb;\n  padding: 12px 0;\n}\n.box {\n  width: 120px;\n  height: 60px;\n  background: #2f5fd0;\n}\n",
        task: "margin-inline を使って、青い箱を水平中央に寄せよう。",
        snapshot: { props: ["margin-left"] },
        validators: [
          { kind: "sourceMatches", pattern: "margin-inline" },
          { kind: "centeredIn", id: "box", axis: "x", containerId: "wrap" },
        ],
        hints: ["margin-inline: auto を box に指定します"],
        solution:
          ".wrap {\n  width: 300px;\n  background: #dbe4fb;\n  padding: 12px 0;\n}\n.box {\n  width: 120px;\n  height: 60px;\n  margin-inline: auto;\n  background: #2f5fd0;\n}\n",
      },
    },
  ],
};
