import type { Track } from "./types.js";

// A checkbox toggles the toast through `:has(:checked)`, so the learner can
// replay the entry/exit transition in the preview without any script.
const TOAST_HTML =
  '<label class="toggle"><input type="checkbox" checked> 通知を表示</label><div data-id="toast" class="toast">保存しました</div>';

export const entryAnimationsTrack: Track = {
  id: "entry-animations",
  title: "出現と退場のアニメーション",
  summary: "@starting-style と allow-discrete で、display: none からの出入りを滑らかに。",
  emoji: "🎬",
  lessons: [
    {
      id: "entry-starting-style",
      title: "現れる瞬間の出発点: @starting-style",
      explanation:
        "<p><code>display: none</code> から現れた要素には「変化前のスタイル」が無いので、<code>transition</code> を書いてもパッと出るだけです。<code>@starting-style</code> で<b>現れる瞬間の出発点</b>を与えると、そこから通常のスタイルへトランジションします。</p><p><code>@starting-style { .toast { opacity: 0; } }</code> のように、元のルールより<b>後ろ</b>に書きます（詳細度が同じなので、前に書くと負けます）。Baseline 2024（Chrome 117 / Firefox 129 / Safari 17.5 以降で利用可）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/At-rules/@starting-style",
      viz: { concept: "none" },
      challenge: {
        starterHTML: TOAST_HTML,
        starterCSS:
          ".toast {\n  display: none;\n  width: 200px;\n  margin-top: 12px;\n  padding: 12px;\n  background: #18203a;\n  color: #fff;\n  opacity: 1;\n  \n}\n.toggle:has(:checked) + .toast {\n  display: block;\n}\n",
        task: "チェックを入れたとき、通知が 0.4 秒かけてふわっと現れるようにしよう（transition と、opacity: 0 から始める @starting-style）。プレビューのチェックを付け外しして確かめられます。",
        snapshot: { props: ["transition-duration", "transition-property"] },
        validators: [
          { kind: "computedEquals", id: "toast", prop: "transition-duration", value: "0.4s", message: ".toast に 0.4s の transition を指定しましょう" },
          {
            kind: "sourceMatches",
            pattern: "@starting-style\\s*\\{[^}]*opacity\\s*:\\s*0(?![.\\d])",
            message: "@starting-style の中で opacity: 0 を指定しましょう",
          },
        ],
        hints: ["まず .toast に transition: opacity 0.4s; を足します", "最後に @starting-style { .toast { opacity: 0; } } を書きます"],
        solution:
          ".toast {\n  display: none;\n  width: 200px;\n  margin-top: 12px;\n  padding: 12px;\n  background: #18203a;\n  color: #fff;\n  opacity: 1;\n  transition: opacity 0.4s;\n}\n.toggle:has(:checked) + .toast {\n  display: block;\n}\n@starting-style {\n  .toast {\n    opacity: 0;\n  }\n}\n",
      },
    },
    {
      id: "exit-allow-discrete",
      title: "消えるときも滑らかに: transition-behavior",
      explanation:
        "<p>消えるときは逆の問題が起きます。<code>display</code> は中間の値を持たない<b>離散的</b>なプロパティなので、<code>none</code> に変わった瞬間に要素が消え、フェードアウトを見せる時間がありません。</p><p><code>transition-behavior: allow-discrete</code>（<code>transition</code> の中にも書けます）で <code>display</code> もトランジション対象にすると、<code>none</code> への切り替えが<b>アニメーションの最後まで待つ</b>ようになります。</p><p><code>transition-behavior</code> 自体は Baseline 2024 ですが、<code>display</code> のトランジションは Chrome 117 / Safari 18 以降で、Firefox は未対応です（2026 年 10 月時点）。未対応のブラウザではこれまでどおり即座に消えるだけなので、安心して足せます。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/transition-behavior",
      viz: { concept: "none" },
      challenge: {
        starterHTML: TOAST_HTML,
        starterCSS:
          ".toast {\n  display: none;\n  width: 200px;\n  margin-top: 12px;\n  padding: 12px;\n  background: #18203a;\n  color: #fff;\n  opacity: 0;\n  transition: opacity 0.4s;\n}\n.toggle:has(:checked) + .toast {\n  display: block;\n  opacity: 1;\n}\n@starting-style {\n  .toggle:has(:checked) + .toast {\n    opacity: 0;\n  }\n}\n",
        task: "チェックを外したとき、通知が 0.4 秒かけて消えてから display: none になるようにしよう（transition に display と allow-discrete を足す）。",
        snapshot: { props: ["transition-property", "transition-behavior"] },
        validators: [
          { kind: "computedMatches", id: "toast", prop: "transition-property", pattern: "display|all", message: "transition の対象に display を足しましょう" },
          { kind: "computedMatches", id: "toast", prop: "transition-behavior", pattern: "allow-discrete", message: "allow-discrete を指定しましょう" },
        ],
        hints: ["transition はカンマで区切って複数書けます: opacity 0.4s, display 0.4s …", "transition: opacity 0.4s, display 0.4s allow-discrete;"],
        solution:
          ".toast {\n  display: none;\n  width: 200px;\n  margin-top: 12px;\n  padding: 12px;\n  background: #18203a;\n  color: #fff;\n  opacity: 0;\n  transition: opacity 0.4s, display 0.4s allow-discrete;\n}\n.toggle:has(:checked) + .toast {\n  display: block;\n  opacity: 1;\n}\n@starting-style {\n  .toggle:has(:checked) + .toast {\n    opacity: 0;\n  }\n}\n",
      },
    },
  ],
};
