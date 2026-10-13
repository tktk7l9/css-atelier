import type { ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Specificity is judged by the colour each element ends up with: the element
// that should win turns its colour, and the others keep theirs, so deleting
// the competing rule does not pass. !important wins regardless of
// specificity, so every lesson also rejects it in the source, with a reason.
// Any rewrite that gets the weights right passes (raising one selector,
// lowering the other, or splitting a selector list), except in the :where()
// lesson, which asks for the base rule to be rewritten with :where().

const RED = "rgb(198, 40, 40)";
const BLUE = "rgb(47, 95, 208)";
const GRAY = "rgb(92, 102, 128)";
const INK = "rgb(61, 71, 102)";

const noImportant = (message: string): ValidatorSpec => ({
  kind: "sourceMatches",
  pattern: "^(?![\\s\\S]*!\\s*important)",
  message,
});

const NEWS_HTML =
  '<section id="news" class="news"><h3>お知らせ</h3><p data-id="normal">年末年始の営業時間について</p><p data-id="alert" class="alert">12 月 30 日は臨時休業です</p></section>';

const NEWS_CSS = (alertSelector: string): string =>
  `.news h3 {\n  margin: 0 0 8px;\n  font-size: 16px;\n}\n/* お知らせ欄の文字 */\n#news p {\n  margin: 0 0 6px;\n  color: #3d4766;\n}\n/* 重要なお知らせは赤く太く */\n${alertSelector} {\n  color: #c62828;\n  font-weight: 700;\n}\n`;

const CARD_HTML =
  '<div class="card"><p>登録が完了しました。</p><a data-id="normal" href="#">マイページへ</a><a data-id="danger" class="link-danger" href="#">登録を取り消す</a></div>';

const CARD_CSS = (baseSelector: string): string =>
  `.card p {\n  margin: 0 0 4px;\n}\n/* カードの中のリンク（共通の土台） */\n${baseSelector} {\n  display: block;\n  margin-top: 6px;\n  color: #2f5fd0;\n}\n/* 取り消しなど、注意が必要な操作のリンク */\n.link-danger {\n  color: #c62828;\n}\n`;

const NAV_HTML =
  '<nav id="sidebar" class="side"><a data-id="side" href="#">お知らせ</a><a data-id="side2" href="#">よくある質問</a></nav>' +
  '<nav class="menu"><a data-id="home" href="#">ホーム</a><a data-id="current" class="current" href="#">料金</a></nav>';

const NAV_CSS = (sharedSelector: string): string =>
  `nav {\n  margin-bottom: 8px;\n}\n/* サイドバーとメニューのリンク（まとめて指定） */\n${sharedSelector} {\n  margin-right: 12px;\n  color: #5c6680;\n}\n/* メニューの、いま開いているページ */\n.menu a.current {\n  color: #2f5fd0;\n  font-weight: 700;\n}\n`;

export const specificityTrack: Track = {
  id: "specificity",
  title: "詳細度（ID・クラス・:where()・:is()）",
  summary: "ID・クラス・要素の 3 つの数で詳細度を比べ、:where() で土台の詳細度を 0 にし、:is() がいちばん強い引数の詳細度になることを知って、!important なしで上書きする。",
  emoji: "🥇",
  lessons: [
    {
      id: "specificity-columns",
      title: "どちらが勝つか: 詳細度の比べ方",
      explanation:
        "<p>同じ要素の同じプロパティに、2 つのルールが別々の値を指定したとき、どちらが使われるかは<b>詳細度</b>で決まります。詳細度は「ID・クラス・要素」の 3 つの数で、<code>#news p</code> は ID 1 つと要素 1 つで <b>1-0-1</b>、<code>.alert</code> はクラス 1 つで <b>0-1-0</b> です（属性セレクタや <code>:hover</code> などの擬似クラスはクラスの列に、<code>::before</code> などの擬似要素は要素の列に数えます）。</p><p>比べるときは<b>左の列から</b>見て、数が多いほうが勝ちます。ID の数が違えば、クラスや要素がいくつあっても関係ありません。詳細度が同じときは、<b>後に書いたほう</b>が勝ちます。<code>!important</code> を付けると詳細度に関係なく勝ちますが、あとから上書きするのが難しくなるので、詳細度で解決しましょう。</p><p>CSS のカスケードの基本の仕組みです。</p>",
      mdnPath: "/ja/docs/Web/CSS/Guides/Cascade/Specificity",
      viz: { concept: "none" },
      challenge: {
        starterHTML: NEWS_HTML,
        starterCSS: NEWS_CSS(".alert"),
        task: "「重要なお知らせ」が太字にはなったのに、赤くなりません。!important を使わずに、重要なお知らせだけを赤にしよう（ほかのお知らせの色はそのまま）。",
        snapshot: { props: ["color"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "computedEquals",
                id: "alert",
                prop: "color",
                value: RED,
                message: "重要なお知らせが赤くなっていません（#news p の詳細度は 1-0-1、.alert は 0-1-0 です。ID の列が多い #news p の色が勝っています）",
              },
              {
                kind: "computedEquals",
                id: "normal",
                prop: "color",
                value: INK,
                message: "ほかのお知らせの色が変わっています（#news p の色は残しましょう）",
              },
              noImportant("!important を使わずに、セレクタの詳細度で勝たせましょう（!important を使うと、あとから上書きしにくくなります）"),
            ],
          },
        ],
        hints: ["詳細度は ID・クラス・要素の 3 つの数で、左から比べます。ID が 1 つあれば、クラスをいくつ重ねても勝てません", "#news .alert { … }（1-1-0）にすると、#news p（1-0-1）に勝ちます"],
        solution: NEWS_CSS("#news .alert"),
      },
    },
    {
      id: "where-zero",
      title: "上書きしやすい土台: :where() で詳細度を 0 に",
      explanation:
        "<p><code>:where()</code> は、かっこの中のセレクタのどれかに当てはまる要素を選びます。<b>中に何を書いても詳細度は 0-0-0</b> なのが特徴です。<code>:where(.card) a</code> は <code>.card a</code> と同じ要素を選びますが、詳細度は要素 1 つ分の <b>0-0-1</b> だけになります。</p><p>リセットやライブラリのように、あとから上書きされる前提の<b>土台のスタイル</b>を低い詳細度で書いておくと、<code>.link-danger</code> のようなクラス 1 つで素直に上書きできます。MDN も、ほかの人が使う CSS はできるだけ低い詳細度で書くことを勧めています。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/:where",
      viz: { concept: "none" },
      challenge: {
        starterHTML: CARD_HTML,
        starterCSS: CARD_CSS(".card a"),
        task: "「登録を取り消す」が赤くなりません。.link-danger のルールはそのままにして、土台のルール（.card a）を :where() で書き換え、詳細度を下げよう。",
        snapshot: { props: ["color"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "computedEquals",
                id: "danger",
                prop: "color",
                value: RED,
                message: "「登録を取り消す」が赤くなっていません（.card a の詳細度 0-1-1 が、.link-danger の 0-1-0 に勝っています）",
              },
              {
                kind: "computedEquals",
                id: "normal",
                prop: "color",
                value: BLUE,
                message: "「マイページへ」の色が変わっています（土台のリンクの色は残しましょう）",
              },
              noImportant("!important を使わずに、土台の詳細度を下げて解決しましょう"),
              {
                kind: "allOf",
                of: [
                  { kind: "sourceMatches", pattern: ":where\\(" },
                  { kind: "declarationMatches", selector: ".link-danger", prop: "color", pattern: "." },
                ],
                message: "土台のルール（.card a）を :where() で書き換えましょう（.link-danger のほうを強くすると、例外を足すたびにセレクタが長くなります）",
              },
            ],
          },
        ],
        hints: [":where() の中のセレクタは、詳細度に数えられません（0-0-0）", ":where(.card) a { … }（0-0-1）にすると、.link-danger（0-1-0）が勝ちます"],
        solution: CARD_CSS(":where(.card) a"),
      },
    },
    {
      id: "is-specificity",
      title: ":is() の詳細度は、中でいちばん強いもの",
      explanation:
        "<p><code>:is()</code> も、かっこの中のセレクタのどれかに当てはまる要素を選びます。ただし詳細度は、<b>かっこの中でいちばん強いセレクタ</b>の値になります。<code>:is(#sidebar, .menu) a</code> は、<code>.menu</code> の中のリンクを選ぶときも <code>#sidebar</code> の分の ID を持ち、<b>1-0-1</b> です。そのため <code>.menu a.current</code>（0-2-1）は負けてしまいます。</p><p>直し方は 2 つあります。詳細度が 0 になる <code>:where(#sidebar, .menu) a</code>（0-0-1）にするか、<code>#sidebar a, .menu a</code> とカンマで分けて書きます。分けて書けば、要素ごとに当てはまったセレクタの詳細度で比べられます（<code>.menu a</code> は 0-1-1）。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/:is",
      viz: { concept: "none" },
      challenge: {
        starterHTML: NAV_HTML,
        starterCSS: NAV_CSS(":is(#sidebar, .menu) a"),
        task: "メニューの「料金」（いま開いているページ）が、太字なのに青くなりません。!important を使わずに青くしよう（ほかのリンクは灰色のまま）。",
        snapshot: { props: ["color"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "computedEquals",
                id: "current",
                prop: "color",
                value: BLUE,
                message: "「料金」が青くなっていません（:is(#sidebar, .menu) a は、.menu のリンクにも #sidebar の分の詳細度 1-0-1 が付き、.menu a.current の 0-2-1 に勝っています）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "computedEquals", id: "home", prop: "color", value: GRAY },
                  { kind: "computedEquals", id: "side", prop: "color", value: GRAY },
                  { kind: "computedEquals", id: "side2", prop: "color", value: GRAY },
                ],
                message: "ほかのリンクの色が変わっています（サイドバーとメニューのリンクは灰色のまま残しましょう）",
              },
              noImportant("!important を使わずに、まとめた指定の詳細度を見直しましょう"),
            ],
          },
        ],
        hints: [":is(#sidebar, .menu) は、.menu の中を選ぶときも #sidebar の詳細度（1-0-0）を持ちます", ":where(#sidebar, .menu) a にするか、#sidebar a, .menu a と分けて書きます"],
        solution: NAV_CSS(":where(#sidebar, .menu) a"),
      },
    },
  ],
};
