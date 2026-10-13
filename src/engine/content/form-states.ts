import type { Track } from "./types.js";

// Form states that the learner cannot change from the preview: disabled and
// readonly controls take no input, and :default follows the checked
// attribute, not the radio the learner may click. So the computed colours
// read here do not depend on what was clicked or typed in the preview (unlike
// :checked or :placeholder-shown). Each lesson also checks that the controls
// in the other state keep their look.

const GRAY = "rgb(238, 241, 248)";
const WHITE = "rgb(255, 255, 255)";
const CLEAR = "rgba(0, 0, 0, 0)";
const FIELD = "rgb(159, 178, 230)";
const YELLOW = "rgb(245, 196, 0)";
const QUIET = "rgb(197, 205, 224)";

const ORDER_HTML =
  '<form class="order"><fieldset data-id="ship" class="ship" disabled><legend>お届け先（会員情報と同じ）</legend>' +
  '<input data-id="zip" value="150-0001" aria-label="郵便番号"><input data-id="addr" value="東京都渋谷区神宮前" aria-label="住所"></fieldset>' +
  '<label class="coupon">クーポン<input data-id="code" placeholder="お持ちの方のみ"></label>' +
  '<button data-id="send" type="submit" disabled>注文する</button></form>';

const ORDER_CSS = (selector: string): string =>
  `.order {\n  display: grid;\n  gap: 8px;\n  width: 280px;\n}\n.ship {\n  display: grid;\n  gap: 6px;\n  margin: 0;\n  padding: 8px 12px 12px;\n  border: 1px solid #c5cde0;\n  border-radius: 8px;\n}\n.coupon {\n  display: grid;\n  gap: 4px;\n}\ninput,\nbutton {\n  padding: 6px 10px;\n  border: 1px solid #9fb2e6;\n  border-radius: 6px;\n  background: #fff;\n  color: #18203a;\n  font: inherit;\n}\n/* 押せない・入力できない部品は灰色に */\n${selector} {\n  background: #eef1f8;\n  color: #8a94b3;\n}\n`;

const CONFIRM_HTML =
  '<form class="confirm">' +
  '<label class="row">お名前<input data-id="name" value="山田 花子" readonly></label>' +
  '<label class="row">メール<input data-id="mail" value="hanako@example.com" readonly></label>' +
  '<label class="row">ご要望<input data-id="note" placeholder="（任意）"></label>' +
  "</form>";

const CONFIRM_CSS = (extra: string): string =>
  `.confirm {\n  width: 280px;\n}\n.row {\n  display: grid;\n  gap: 4px;\n  margin-bottom: 8px;\n}\ninput {\n  padding: 6px 10px;\n  border: 1px solid #9fb2e6;\n  border-radius: 6px;\n  background: #fff;\n  color: #18203a;\n  font: inherit;\n}\n${extra}`;

const PLANS_HTML =
  '<div class="plans">' +
  '<span class="opt"><input id="plan-light" type="radio" name="plan"><label data-id="p1" for="plan-light">ライト</label></span>' +
  '<span class="opt"><input id="plan-standard" type="radio" name="plan" checked><label data-id="p2" for="plan-standard">スタンダード</label></span>' +
  '<span class="opt"><input id="plan-pro" type="radio" name="plan"><label data-id="p3" for="plan-pro">プロ</label></span>' +
  "</div>";

const PLANS_CSS = (extra: string): string =>
  `.plans {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n}\n.opt {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n}\n.opt label {\n  padding: 6px 12px;\n  border: 2px solid #c5cde0;\n  border-radius: 8px;\n}\n/* いま選んでいるプラン */\n.opt input:checked + label {\n  background: #eef1f8;\n}\n${extra}`;

export const formStatesTrack: Track = {
  id: "form-states",
  title: "フォームの状態で選ぶ（:disabled・:read-only・:default）",
  summary: ":disabled で fieldset ごと無効になった欄まで灰色にし、:read-only で確認画面の欄を文字だけの表示にし、:default で最初から選ばれていたおすすめのプランに印を付ける。",
  emoji: "🔒",
  lessons: [
    {
      id: "disabled-fieldset",
      title: "無効な部品をすべて選ぶ: :disabled",
      explanation:
        "<p><code>:disabled</code> は、押したり入力したりできない（無効な）部品を選びます。<code>fieldset</code> に <code>disabled</code> 属性を付けると、<b>中の部品もすべて無効</b>になります。このとき中の欄には属性が付かないので、属性セレクタの <code>[disabled]</code> では選べませんが、<code>:disabled</code> なら選べます。</p><p>無効な部品は、灰色にするなどして、押せないことが見た目で分かるようにします。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/:disabled",
      viz: { concept: "none" },
      challenge: {
        starterHTML: ORDER_HTML,
        starterCSS: ORDER_CSS("input[disabled],\nbutton[disabled]"),
        task: "お届け先の欄は fieldset ごと無効（disabled）なのに、白いままで入力できそうに見えます。無効な部品をすべて灰色にしよう（クーポンの欄は白のまま）。",
        snapshot: { props: ["background-color"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "computedEquals", id: "zip", prop: "background-color", value: GRAY },
                  { kind: "computedEquals", id: "addr", prop: "background-color", value: GRAY },
                ],
                message: "fieldset ごと無効になった欄が、灰色になっていません（disabled 属性は fieldset に付いているので、[disabled] では中の欄を選べません。:disabled なら選べます）",
              },
              {
                kind: "computedEquals",
                id: "send",
                prop: "background-color",
                value: GRAY,
                message: "無効な「注文する」ボタンが、灰色になっていません",
              },
              {
                kind: "computedEquals",
                id: "code",
                prop: "background-color",
                value: WHITE,
                message: "入力できるクーポンの欄まで灰色になっています（無効な部品だけを選びます）",
              },
            ],
          },
        ],
        hints: ["属性ではなく、無効という状態で選ぶ擬似クラスがあります", "input:disabled, button:disabled { … }"],
        solution: ORDER_CSS("input:disabled,\nbutton:disabled"),
      },
    },
    {
      id: "read-only-fields",
      title: "書き換えられない欄を文字だけに: :read-only",
      explanation:
        "<p><code>:read-only</code> は、利用者が<b>書き換えられない</b>要素を選びます。<code>readonly</code> 属性の付いた入力欄のほか、ラジオボタンや p のような入力欄でない要素など、<code>:read-write</code>（書き換えられる要素）に当てはまらないものすべてが対象です。そのため <code>input:read-only</code> のように、要素を絞って書きます。</p><p>確認画面のように、値を見せるだけの欄は、枠と背景を <code>transparent</code> にすると、ふつうの文字のように読めます。枠を消さずに透明にすると、文字の位置もずれません。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/:read-only",
      viz: { concept: "none" },
      challenge: {
        starterHTML: CONFIRM_HTML,
        starterCSS: CONFIRM_CSS(""),
        task: "確認画面で、書き換えられない（readonly の）欄が、入力欄と同じ枠付きで表示されています。読み取り専用の欄を、枠も背景もない文字だけの表示にしよう（ご要望の欄はそのまま）。",
        snapshot: { props: ["border-top-color", "border-top-style", "background-color"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  {
                    kind: "anyOf",
                    of: [
                      { kind: "computedEquals", id: "name", prop: "border-top-color", value: CLEAR },
                      { kind: "computedEquals", id: "name", prop: "border-top-style", value: "none" },
                    ],
                  },
                  { kind: "computedEquals", id: "name", prop: "background-color", value: CLEAR },
                  {
                    kind: "anyOf",
                    of: [
                      { kind: "computedEquals", id: "mail", prop: "border-top-color", value: CLEAR },
                      { kind: "computedEquals", id: "mail", prop: "border-top-style", value: "none" },
                    ],
                  },
                  { kind: "computedEquals", id: "mail", prop: "background-color", value: CLEAR },
                ],
                message: "読み取り専用の欄に、まだ枠か背景が残っています（input:read-only で選び、border-color と background を transparent に）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "computedEquals", id: "note", prop: "border-top-color", value: FIELD },
                  { kind: "computedEquals", id: "note", prop: "background-color", value: WHITE },
                ],
                message: "入力できる「ご要望」の欄の枠や背景まで消えています（書き換えられない欄だけを選びます）",
              },
            ],
          },
        ],
        hints: ["書き換えられない欄を選ぶ擬似クラスを、input に付けて絞ります", "input:read-only { border-color: transparent; background: transparent; }"],
        solution: CONFIRM_CSS("/* 確認用に、書き換えられない欄は文字だけに */\ninput:read-only {\n  border-color: transparent;\n  background: transparent;\n}\n"),
      },
    },
    {
      id: "default-option",
      title: "最初の選択に印を残す: :default",
      explanation:
        "<p><code>:checked</code> は<b>いま選ばれている</b>ラジオボタンやチェックボックスを選ぶので、選び直すと印も移ります。<code>:default</code> は、<b>最初から選ばれていた</b>もの（<code>checked</code> 属性の付いたラジオボタンやチェックボックス、<code>selected</code> の option、フォームの最初の送信ボタン）を選び、選び直しても変わりません。</p><p>おすすめのプランや初期値に印を付けておくと、利用者がほかを選んでも、元の選択に戻しやすくなります。ここでは、ラジオボタンのすぐ後ろのラベルを <code>+</code> で選びます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/:default",
      viz: { concept: "none" },
      challenge: {
        starterHTML: PLANS_HTML,
        starterCSS: PLANS_CSS(""),
        task: "最初から選ばれている「スタンダード」は、おすすめのプランです。ほかのプランを選び直しても、スタンダードの枠が黄色（#f5c400）のまま残るようにしよう。",
        snapshot: { props: ["border-top-color"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "computedEquals",
                id: "p2",
                prop: "border-top-color",
                value: YELLOW,
                message: "おすすめの「スタンダード」の枠が、黄色になっていません（最初から選ばれていたラジオボタンは :default で選べます）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "computedEquals", id: "p1", prop: "border-top-color", value: QUIET },
                  { kind: "computedEquals", id: "p3", prop: "border-top-color", value: QUIET },
                ],
                message: "ほかのプランの枠まで黄色になっています（おすすめのプランだけに印を付けます）",
              },
              {
                kind: "sourceMatches",
                pattern: ":default|\\[checked\\]",
                message: ":checked だと、ほかのプランを選び直したときに印が移ってしまいます。最初から選ばれていたものを選ぶ :default を使いましょう",
              },
            ],
          },
        ],
        hints: ["最初から選ばれていたラジオボタンは :default、そのすぐ後ろのラベルは + で選べます", ".opt input:default + label { border-color: #f5c400; }"],
        solution: PLANS_CSS("/* 最初から選ばれていた、おすすめのプラン */\n.opt input:default + label {\n  border-color: #f5c400;\n}\n"),
      },
    },
  ],
};
