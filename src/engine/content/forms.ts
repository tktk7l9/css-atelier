import type { Track } from "./types.js";

// Form controls are drawn by the browser, so these lessons read computed
// values (accent-color, appearance) and the box size the learner keeps.
// The markup uses <div> instead of <form>: the sandbox iframe has no
// allow-forms, and pressing Enter in a field would log a blocked submission.

const CONTROLS_HTML =
  '<div data-id="form" class="form">' +
  '<label><input data-id="check" type="checkbox" checked> お知らせを受け取る</label>' +
  '<label><input data-id="radio" type="radio" name="plan" checked> 月額プラン</label>' +
  '<label><input type="radio" name="plan"> 年額プラン</label>' +
  '<label>音量 <input data-id="range" type="range" value="70"></label>' +
  '<progress data-id="progress" value="60" max="100">60%</progress>' +
  "</div>";

const CONTROLS_CSS = (extra: string): string =>
  `.form {\n  display: grid;\n  gap: 10px;\n  justify-items: start;\n${extra}}\n`;

const OPTIONS_HTML =
  '<label class="opt"><input data-id="off" type="checkbox"> メールで受け取る</label>' +
  '<label class="opt"><input data-id="on" type="checkbox" checked> アプリの通知で受け取る</label>';

// A white tick drawn as an inline SVG: data: images are allowed by the CSP.
const TICK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3 8.5l3 3 7-7' fill='none' stroke='%23fff' stroke-width='2.4'/%3E%3C/svg%3E\")";

const OPTIONS_CSS = (extra: string): string =>
  `.opt {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-bottom: 10px;\n}\n.opt input {\n${extra}  width: 20px;\n  height: 20px;\n  margin: 0;\n  border: 2px solid #8a94b3;\n  border-radius: 6px;\n  background: #fff;\n}\n/* チェックされたとき */\n.opt input:checked {\n  border-color: #2f9d5b;\n  background: #2f9d5b ${TICK} center / 14px no-repeat;\n}\n/* キーボードで選んだとき */\n.opt input:focus-visible {\n  outline: 2px solid #2f9d5b;\n  outline-offset: 2px;\n}\n`;

// The hidden third input stands for a field nobody has touched yet: hidden
// inputs cannot be focused or typed into, so :user-invalid never matches it
// while :invalid does from the start. The visible fields stay free to try out,
// so the result does not depend on what the learner typed into the preview.
const SIGNUP_HTML =
  '<div class="field"><label for="mail">メールアドレス</label><input data-id="mail" id="mail" type="email" required placeholder="name@example.com"></div>' +
  '<div class="field"><label for="nick">ニックネーム</label><input data-id="nick" id="nick" required></div>' +
  '<input data-id="untouched" required hidden>';

const SIGNUP_CSS = (selector: string): string =>
  `.field {\n  display: grid;\n  gap: 4px;\n  margin-bottom: 12px;\n}\ninput {\n  width: 240px;\n  padding: 8px 10px;\n  font: inherit;\n  border: 2px solid #c5cde0;\n  border-radius: 8px;\n}\n/* 入力に誤りがあるときは、赤い枠で知らせる */\ninput${selector} {\n  border-color: #d93636;\n}\n`;

// The brand green, chosen to stand apart from the blue most browsers use by default.
const BRAND = "rgb(47, 157, 91)";

export const formsTrack: Track = {
  id: "forms",
  title: "フォームの見た目",
  summary: "accent-color・appearance・:user-invalid で、フォーム部品をブランドに合わせて使いやすく。",
  emoji: "☑️",
  lessons: [
    {
      id: "form-accent-color",
      title: "部品の色をそろえる: accent-color",
      explanation:
        "<p>チェックボックスやラジオボタン、スライダー（range）、進み具合のバー（progress）の<b>色のついた部分</b>は、ブラウザ既定の色で描かれます。<code>accent-color</code> を指定すると、部品の作りはそのままに、その色だけをブランドの色に変えられます。</p><p><code>accent-color</code> は<b>継承される</b>ので、フォーム全体（親要素）に 1 回書けば、中の部品すべてに効きます。チェックの印の色は、多くのブラウザが背景とのコントラストを見て白か黒を選びます。</p><p>Chrome 93・Firefox 92・Safari 15.4 以降で使えます。ただし Android 版 Chrome と Safari 26.1 以前は、この印のコントラストを自動で保たないため、MDN の Baseline では「限定的」の扱いです（Safari は 26.2 で解消）。薄い色を指定するときは、印が見えるか確かめましょう。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/accent-color",
      viz: { concept: "none" },
      challenge: {
        starterHTML: CONTROLS_HTML,
        starterCSS: CONTROLS_CSS(""),
        task: "チェックボックス・ラジオボタン・スライダー・バーの色を、まとめてブランドの緑（#2f9d5b）にしよう。部品ごとではなく、フォーム全体（.form）に 1 回だけ書きます。",
        snapshot: { props: ["accent-color"] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "computedEquals", id: "check", prop: "accent-color", value: BRAND },
              { kind: "computedEquals", id: "radio", prop: "accent-color", value: BRAND },
              { kind: "computedEquals", id: "range", prop: "accent-color", value: BRAND },
              { kind: "computedEquals", id: "progress", prop: "accent-color", value: BRAND },
            ],
            message: "部品の色が #2f9d5b になっていません。.form に accent-color を指定すると、中の部品すべてに継承されます",
          },
        ],
        hints: ["accent-color は継承されるので、親の .form に書けば中の部品すべてに効きます", "accent-color: #2f9d5b;"],
        solution: CONTROLS_CSS("  accent-color: #2f9d5b;\n"),
      },
    },
    {
      id: "form-appearance",
      title: "チェックボックスを描き直す: appearance: none",
      explanation:
        "<p>チェックボックスなどのフォーム部品は、OS やブラウザが<b>既定の見た目</b>（<code>appearance: auto</code>）で描くので、<code>border</code> や <code>background</code> を書いてもほとんど反映されません。<code>appearance: none</code> を指定すると既定の描画が外れ、<b>ふつうの箱として</b>自由に描けるようになります。</p><p>見た目を描き直しても、クリックやキーボードでの操作、チェックの状態（<code>:checked</code>）といった<b>部品としての働きはそのまま</b>です。そのぶん、チェックされたときや、キーボードで選んだとき（<code>:focus-visible</code>）の見た目は自分で用意します（ここでは用意済み）。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能。接頭辞なしは Chrome 84・Firefox 80・Safari 15.4 から）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/appearance",
      viz: { concept: "none" },
      challenge: {
        starterHTML: OPTIONS_HTML,
        starterCSS: OPTIONS_CSS(""),
        task: "チェックボックス（.opt input）の既定の見た目を外して、用意してある角丸の枠と、チェックされたときの緑の塗りが表示されるようにしよう。",
        snapshot: { props: ["appearance"] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "computedEquals", id: "off", prop: "appearance", value: "none" },
              { kind: "computedEquals", id: "on", prop: "appearance", value: "none" },
            ],
            message: ".opt input に appearance: none を指定して、ブラウザ既定の見た目を外しましょう",
          },
          { kind: "sizeApprox", id: "on", w: 20, h: 20, message: "チェックボックスの大きさ（20px × 20px）は変えないでおきましょう" },
        ],
        hints: ["既定の見た目のままだと、border や background はほとんど反映されません", "appearance: none;"],
        solution: OPTIONS_CSS("  appearance: none;\n"),
      },
    },
    {
      id: "form-user-invalid",
      title: "触ってから知らせる: :user-invalid",
      explanation:
        "<p><code>:invalid</code> は、入力が <code>required</code> や <code>type=\"email\"</code> などの条件を満たしていないときに当てはまります。ただし<b>ページを開いた瞬間から</b>当てはまるので、まだ何も入力していない欄まで最初から赤く表示され、責められているように感じさせてしまいます。</p><p><code>:user-invalid</code> は、利用者が<b>実際に入力して欄を離れた後</b>（または送信しようとした後）にだけ当てはまります。間違いを知らせるのは、触ってからで十分です。主要ブラウザすべてで使えます（Baseline: 広く利用可能。2023 年 11 月に主要ブラウザがそろいました）。</p><p>自動のチェックでは「まだ触っていない欄が赤くないこと」を確かめます。プレビューのメール欄に「abc」と入れて欄を離れると赤くなることも、試してみましょう。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/:user-invalid",
      viz: { concept: "none" },
      challenge: {
        starterHTML: SIGNUP_HTML,
        starterCSS: SIGNUP_CSS(":invalid"),
        task: "登録フォームの欄が、まだ何も入力していないのに最初から赤くなっています。利用者が入力して欄を離れた後だけ赤い枠で知らせるようにしよう。",
        snapshot: { props: ["border-top-color"] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "sourceMatches", pattern: ":user-invalid", message: ":invalid の代わりに :user-invalid を使いましょう" },
              {
                kind: "computedEquals",
                id: "untouched",
                prop: "border-top-color",
                value: "rgb(197, 205, 224)",
                message: "まだ触っていない欄まで、最初から赤くなっています（:invalid は入力する前から当てはまります）",
              },
            ],
          },
        ],
        hints: ["入力して欄を離れた後だけ当てはまる疑似クラスがあります", "input:user-invalid { border-color: #d93636; }"],
        solution: SIGNUP_CSS(":user-invalid"),
      },
    },
  ],
};
