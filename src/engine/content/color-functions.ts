import type { Track } from "./types.js";

export const colorFunctionsTrack: Track = {
  id: "color-functions",
  title: "色の合成と派生",
  summary: "color-mix()・相対色・light-dark() — 1 つの色から配色を組み立てる。",
  emoji: "🧪",
  lessons: [
    {
      id: "color-mix",
      title: "色を混ぜる: color-mix()",
      explanation:
        "<p><code>color-mix(in 色空間, 色1 割合, 色2 割合)</code> は 2 つの色を指定した色空間で混ぜます。割合を省くと 50% ずつです。<code>color-mix(in srgb, #2f5fd0, white)</code> ならブランド色と白の中間の淡い青になります。</p><p>混ぜる色空間で結果は変わります。なめらかな中間色がほしいときは <code>in oklab</code> が向いています。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/color_value/color-mix",
      viz: { concept: "none" },
      challenge: {
        starterHTML: '<div data-id="base" class="box base"></div><div data-id="tint" class="box tint"></div>',
        starterCSS:
          ".box {\n  --brand: #2f5fd0;\n  display: inline-block;\n  width: 90px;\n  height: 90px;\n  margin-right: 12px;\n  border-radius: 10px;\n}\n.base {\n  background: var(--brand);\n}\n.tint {\n  background: #cccccc;\n}\n",
        task: "右の箱（.tint）の背景を、ブランド色（--brand）と white を srgb で半分ずつ混ぜた色にしよう。",
        snapshot: { props: ["background-color"] },
        validators: [
          { kind: "sourceMatches", pattern: "color-mix\\(\\s*in\\s+srgb", message: "color-mix(in srgb, …) を使いましょう" },
          {
            kind: "computedMatches",
            id: "tint",
            prop: "background-color",
            // #2f5fd0 and white at 50/50 in sRGB: (151, 175, 231.5).
            pattern: "color\\(srgb 0\\.59\\d* 0\\.68\\d* 0\\.90\\d*\\)|151[,\\s]+175[,\\s]+23[12]",
          },
        ],
        hints: ["color-mix(in srgb, 色1, 色2) の形です。割合を省くと 50% ずつ混ざります", "background: color-mix(in srgb, var(--brand), white)"],
        solution:
          ".box {\n  --brand: #2f5fd0;\n  display: inline-block;\n  width: 90px;\n  height: 90px;\n  margin-right: 12px;\n  border-radius: 10px;\n}\n.base {\n  background: var(--brand);\n}\n.tint {\n  background: color-mix(in srgb, var(--brand), white);\n}\n",
      },
    },
    {
      id: "color-relative",
      title: "元の色から派生させる: 相対色構文",
      explanation:
        "<p>相対色構文は、<code>from</code> で<b>元の色</b>を渡し、そのチャンネルを使い回して新しい色を作ります。<code>rgb(from var(--brand) r g b / 50%)</code> は、色みはそのままで不透明度だけ 50% にした色です。</p><p><code>oklch(from var(--brand) calc(l + 0.2) c h)</code> のように <code>calc()</code> で明度だけ動かすこともできます。Baseline 2024（Chrome 125 / Firefox 128 / Safari 18 以降で利用可）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Guides/Colors/Using_relative_colors",
      viz: { concept: "none" },
      challenge: {
        starterHTML: '<div data-id="wrap" class="wrap"><div data-id="chip" class="chip">半透明のチップ</div></div>',
        starterCSS:
          ".wrap {\n  --brand: #2f5fd0;\n  width: 220px;\n  padding: 24px;\n  background: repeating-linear-gradient(45deg, #fff 0 10px, #e3e9f7 10px 20px);\n}\n.chip {\n  padding: 12px;\n  color: #fff;\n  background: var(--brand);\n}\n",
        task: ".chip の背景を、--brand の色みのまま不透明度 50% にしよう（相対色構文 rgb(from …) を使う）。",
        snapshot: { props: ["background-color"] },
        validators: [
          { kind: "sourceMatches", pattern: "from\\s+var\\(\\s*--brand", message: "rgb(from var(--brand) …) の形で元の色を渡しましょう" },
          {
            kind: "computedMatches",
            id: "chip",
            prop: "background-color",
            pattern: "/\\s*0\\.5\\)$|,\\s*0\\.5\\)$",
            message: "背景の不透明度が 50% になっていません",
          },
        ],
        hints: ["rgb(from 元の色 r g b / 不透明度) の形です。r g b は元の色のチャンネルをそのまま指します", "background: rgb(from var(--brand) r g b / 50%)"],
        solution:
          ".wrap {\n  --brand: #2f5fd0;\n  width: 220px;\n  padding: 24px;\n  background: repeating-linear-gradient(45deg, #fff 0 10px, #e3e9f7 10px 20px);\n}\n.chip {\n  padding: 12px;\n  color: #fff;\n  background: rgb(from var(--brand) r g b / 50%);\n}\n",
      },
    },
    {
      id: "color-light-dark",
      title: "明暗テーマを 1 行で: light-dark()",
      explanation:
        "<p><code>light-dark(明るいときの色, 暗いときの色)</code> は、要素の <code>color-scheme</code> に応じてどちらかの色を返します。メディアクエリを書かずに、ライト／ダーク両対応の色を 1 か所で定義できます。<code>color-scheme: light dark</code> なら OS の設定に追従し、<code>light</code> や <code>dark</code> と書けばその要素以下を固定できます。</p><p>Baseline 2024（Chrome 123 / Firefox 120 / Safari 17.5 以降で利用可）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/color_value/light-dark",
      viz: { concept: "none" },
      challenge: {
        starterHTML:
          '<div data-id="day" class="card day">color-scheme: light</div><div data-id="night" class="card night">color-scheme: dark</div>',
        starterCSS:
          ".day {\n  color-scheme: light;\n}\n.night {\n  color-scheme: dark;\n}\n.card {\n  width: 220px;\n  padding: 12px;\n  margin-bottom: 8px;\n  background: #ffffff;\n  color: #18203a;\n}\n",
        task: ".card の背景を「ライトでは #ffffff、ダークでは #18203a」、文字色をその逆にしよう（light-dark() を使う）。",
        snapshot: { props: ["background-color", "color"] },
        validators: [
          { kind: "sourceMatches", pattern: "light-dark\\(", message: "light-dark() を使いましょう" },
          { kind: "computedMatches", id: "day", prop: "background-color", pattern: "255[,\\s]+255[,\\s]+255", message: "ライト側の背景が #ffffff になっていません" },
          { kind: "computedMatches", id: "night", prop: "background-color", pattern: "24[,\\s]+32[,\\s]+58", message: "ダーク側の背景が #18203a になっていません" },
          { kind: "computedMatches", id: "day", prop: "color", pattern: "24[,\\s]+32[,\\s]+58", message: "ライト側の文字色が #18203a になっていません" },
          { kind: "computedMatches", id: "night", prop: "color", pattern: "255[,\\s]+255[,\\s]+255", message: "ダーク側の文字色が #ffffff になっていません" },
        ],
        hints: ["light-dark(ライトの色, ダークの色) を background と color の両方に使います", "background: light-dark(#ffffff, #18203a); color: light-dark(#18203a, #ffffff);"],
        solution:
          ".day {\n  color-scheme: light;\n}\n.night {\n  color-scheme: dark;\n}\n.card {\n  width: 220px;\n  padding: 12px;\n  margin-bottom: 8px;\n  background: light-dark(#ffffff, #18203a);\n  color: light-dark(#18203a, #ffffff);\n}\n",
      },
    },
  ],
};
