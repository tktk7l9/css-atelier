import type { ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Hiding is judged by what stays in the layout and what the element computes
// to. A button hidden with visibility keeps its box (the next button does not
// move) and reads `hidden`; a notice with the hidden attribute must compute
// to display: none while the visible notices stay flex; a visually hidden
// label takes no room in its button (32px wide: the icon and padding) yet is
// neither display: none nor visibility: hidden, which would also remove it
// from what screen readers announce.

const TOOLBAR_HTML =
  '<div data-id="bar" class="toolbar"><button data-id="edit" class="tool" type="button">編集</button>' +
  '<button data-id="del" class="tool delete" type="button">削除</button><button data-id="share" class="tool" type="button">共有</button></div>';

const TOOLBAR_CSS = (hide: string): string =>
  `.toolbar {\n  display: flex;\n  gap: 8px;\n}\n.tool {\n  padding: 6px 14px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n  background: #fff;\n  font: inherit;\n}\n.delete {\n  ${hide}\n}\n`;

const NOTICES_HTML =
  '<div data-id="n1" class="notice">保存しました</div>' +
  '<div data-id="n2" class="notice error" hidden>保存できませんでした</div>' +
  '<div data-id="n3" class="notice error">オフラインです。再接続を待っています</div>';

const NOTICES_CSS = (extra: string): string =>
  `.notice {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-bottom: 8px;\n  padding: 8px 12px;\n  border-radius: 8px;\n  background: #e3f4ea;\n  font-size: 14px;\n}\n.error {\n  background: #fde8e8;\n}\n${extra}`;

const SEARCH_HTML =
  '<button data-id="search" class="icon-btn" type="button"><svg data-id="icon" class="icon" viewBox="0 0 16 16" aria-hidden="true">' +
  '<circle cx="7" cy="7" r="5"/><path d="M11 11l4 4"/></svg><span data-id="label" class="label">検索</span></button>';

const SEARCH_CSS = (extra: string): string =>
  `.icon-btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 8px;\n  border: 0;\n  border-radius: 8px;\n  background: #2f5fd0;\n  color: #fff;\n  font: inherit;\n}\n.icon {\n  width: 16px;\n  height: 16px;\n  fill: none;\n  stroke: currentColor;\n  stroke-width: 2;\n}\n${extra}`;

const VISUALLY_HIDDEN =
  ".label {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  overflow: hidden;\n  clip-path: inset(50%);\n  white-space: nowrap;\n}\n";

const computed = (id: string, prop: string, value: string): ValidatorSpec => ({ kind: "computedEquals", id, prop, value });

export const hidingTrack: Track = {
  id: "hiding",
  title: "隠し方の使い分け（visibility・hidden・visually-hidden）",
  summary: "visibility で場所を残して隠し、hidden 属性を display で打ち消さないようにし、読み上げには残して見た目だけ消す。",
  emoji: "🙈",
  lessons: [
    {
      id: "visibility-hidden",
      title: "場所を残して隠す: visibility: hidden",
      explanation:
        "<p><code>display: none</code> は要素を<b>レイアウトから取り除く</b>ので、後ろの要素が詰めて表示されます。<code>visibility: hidden</code> は<b>見えなくするだけで、場所はそのまま残します</b>。ボタンの位置を変えたくないときや、表示を切り替えても周りが動かないようにしたいときに使います。</p><p><code>visibility: hidden</code> の要素はクリックもキーボードのフォーカスもできず、読み上げソフトからも隠れます。<code>opacity: 0</code> も見えなくなって場所も残りますが、<b>クリックやフォーカスはできてしまう</b>ので、使えないボタンを隠す用途には向きません。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/visibility",
      viz: { concept: "none" },
      challenge: {
        starterHTML: TOOLBAR_HTML,
        starterCSS: TOOLBAR_CSS("display: none;"),
        task: "この画面では「削除」を使えないので隠していますが、display: none だと「共有」が左に詰まり、ボタンの位置が変わってしまいます。削除ボタンを見えなくしたまま、場所は残そう。",
        snapshot: { props: ["visibility", "opacity"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "offset", a: "del", b: "del", edgeA: "left", edgeB: "right", min: 20 },
                  { kind: "offset", a: "del", b: "share", edgeA: "right", edgeB: "left", min: 6, max: 10 },
                ],
                message: "削除ボタンの場所が詰められ、共有ボタンが左にずれています（display: none は場所ごと取り除きます）",
              },
              {
                kind: "anyOf",
                of: [computed("del", "visibility", "hidden"), computed("del", "opacity", "0")],
                message: "削除ボタンが見えたままです（場所を残したまま隠します）",
              },
              {
                ...computed("del", "visibility", "hidden"),
                message: "opacity: 0 では見えないだけで、クリックやキーボードのフォーカスはできてしまいます。visibility: hidden にしましょう",
              },
            ],
          },
        ],
        hints: ["表示するかどうかだけを切り替え、場所は残すプロパティを使います", ".delete { visibility: hidden; }"],
        solution: TOOLBAR_CSS("visibility: hidden;"),
      },
    },
    {
      id: "hidden-attribute",
      title: "hidden 属性を効かせる: [hidden] { display: none }",
      explanation:
        "<p>HTML の <code>hidden</code> 属性は、ブラウザの既定のスタイル <code>[hidden] { display: none; }</code> で要素を隠します。ところが、作者の CSS で <code>.notice { display: flex; }</code> のように <code>display</code> を指定すると、そちらが優先されて <b>hidden を付けても表示されてしまいます</b>（ブラウザの既定のスタイルは、作者の CSS に負けるため）。</p><p>そこで、属性セレクタで <code>[hidden] { display: none !important; }</code> のように書いておくと、どのクラスで <code>display</code> を変えていても hidden の付いた要素は確実に隠れます（リセット用の CSS の定番です）。<code>.notice[hidden]</code> のように、クラスと組み合わせて詳細度を上げる方法もあります。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/display",
      viz: { concept: "none" },
      challenge: {
        starterHTML: NOTICES_HTML,
        starterCSS: NOTICES_CSS(""),
        task: "hidden 属性を付けた「保存できませんでした」が表示されてしまっています（.notice の display: flex が hidden を打ち消しています）。display: flex は残したまま、hidden の付いた要素だけが表示されないようにしよう。",
        snapshot: { props: ["display"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                ...computed("n2", "display", "none"),
                message: "hidden の付いた「保存できませんでした」が表示されたままです（hidden 属性で選んで display: none にします）",
              },
              {
                kind: "allOf",
                of: [computed("n1", "display", "flex"), computed("n3", "display", "flex")],
                message: "表示するお知らせまで消えたり、display: flex でなくなったりしています（hidden の付いた要素だけを選びます）",
              },
            ],
          },
        ],
        hints: ["hidden 属性が付いた要素は、属性セレクタ [hidden] で選べます", "[hidden] { display: none !important; }"],
        solution: NOTICES_CSS("[hidden] {\n  display: none !important;\n}\n"),
      },
    },
    {
      id: "visually-hidden",
      title: "読み上げには残す: visually-hidden",
      explanation:
        "<p>アイコンだけのボタンにも、読み上げソフトがボタンの名前として読むテキストが必要です。ところが <code>display: none</code> や <code>visibility: hidden</code> で隠すと、<b>読み上げソフトからも消えてしまいます</b>。</p><p>見た目だけを消すには、要素を <code>position: absolute</code> で流れから外し、<code>width: 1px; height: 1px; overflow: hidden;</code> で 1px に切り詰め、<code>clip-path: inset(50%)</code> で切り抜きます。<code>white-space: nowrap</code> は、1px の狭い箱の中で文字が折り返されないようにするための指定です。これを <code>.visually-hidden</code> のようなクラスにまとめて使い回すのが定番です（アイコンの SVG には <code>aria-hidden=\"true\"</code> を付けて、読み上げから外しておきます）。</p><p>使うプロパティはどれも主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/display",
      viz: { concept: "none" },
      challenge: {
        starterHTML: SEARCH_HTML,
        starterCSS: SEARCH_CSS(""),
        task: "検索ボタンは虫めがねのアイコンだけで見せたいので、ラベル「検索」を見た目から消そう。ただし、読み上げソフトがボタンの名前として読めるよう、display: none や visibility: hidden は使わずに残します。",
        snapshot: { props: ["display", "visibility", "clip-path"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "computedMatches", id: "label", prop: "display", pattern: "^(?!none$)" },
                  computed("label", "visibility", "visible"),
                ],
                message: "display: none や visibility: hidden では、読み上げソフトからも消えてしまいます（見た目だけを消します）",
              },
              {
                kind: "sizeApprox",
                id: "search",
                w: 32,
                tol: 1,
                message: "ラベルが、まだボタンの中で場所を取っています（position: absolute で流れから外します）",
              },
              {
                kind: "anyOf",
                of: [
                  { kind: "sizeApprox", id: "label", w: 1, h: 1, tol: 1 },
                  { kind: "computedMatches", id: "label", prop: "clip-path", pattern: "^inset\\(50%\\)$" },
                ],
                message: "ラベルが、まだ見えています（1px の大きさに切り詰めるか、clip-path: inset(50%) で切り抜きます）",
              },
            ],
          },
        ],
        hints: ["ラベル（.label）を position: absolute で流れから外し、1px に切り詰めます", ".label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }"],
        solution: SEARCH_CSS(VISUALLY_HIDDEN),
      },
    },
  ],
};
