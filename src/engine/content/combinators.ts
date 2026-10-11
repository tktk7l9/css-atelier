import type { ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Combinators are judged by which elements end up styled: the menu's bar and
// background are not inherited, so nested items must read 0px / transparent on
// their own; the tight paragraphs are measured as gaps under each heading and
// between paragraphs; the faded steps read their computed opacity. The last
// step of each lesson looks for the combinator in the learner's CSS, so an
// override that undoes the styles, or a selector that counts positions,
// fails with a message that names the combinator to use.

const MENU_HTML =
  '<ul data-id="menu" class="menu"><li data-id="m1">ホーム</li>' +
  '<li data-id="m2">商品<ul class="sub"><li data-id="s1">新着</li><li data-id="s2">セール</li></ul></li>' +
  '<li data-id="m3">お問い合わせ</li></ul>';

const MENU_CSS = (selector: string): string =>
  `.menu,\n.sub {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.sub {\n  margin-left: 16px;\n}\n${selector} {\n  margin-top: 4px;\n  padding: 4px 8px;\n  border-left: 4px solid #2f5fd0;\n  background: #dbe4fb;\n}\n.sub li {\n  padding: 2px 0;\n}\n`;

const POST_HTML =
  '<article data-id="post" class="post"><h3 data-id="h1">準備</h3><p data-id="p1">道具を机に並べます。</p>' +
  '<p data-id="p2">はさみの刃が閉じているか確かめます。</p><h3 data-id="h2">作り方</h3>' +
  '<p data-id="p3">紙を半分に折ります。</p><p data-id="p4">折り目に沿って切ります。</p></article>';

const POST_CSS = (extra: string): string =>
  `.post h3 {\n  margin: 24px 0 0;\n  font-size: 16px;\n}\n.post h3:first-child {\n  margin-top: 0;\n}\n.post p {\n  margin: 16px 0 0;\n  font-size: 14px;\n  line-height: 1.6;\n}\n${extra}`;

const STEPS = ["カート", "お届け先", "お支払い", "確認", "完了"];

const STEPS_HTML =
  '<ol data-id="steps" class="steps">' +
  STEPS.map((s, i) => `<li data-id="st${i + 1}" class="step${i === 2 ? " current" : ""}">${s}</li>`).join("") +
  "</ol>";

const STEPS_CSS = (extra: string): string =>
  `.steps {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n  margin: 0;\n  padding: 4px;\n  list-style: none;\n}\n.step {\n  padding: 4px 10px;\n  border-radius: 999px;\n  background: #2f5fd0;\n  color: #fff;\n  font-size: 14px;\n}\n.current {\n  outline: 3px solid #f5c400;\n}\n${extra}`;

/** The space from `a`'s bottom to `b`'s top is `px`, give or take 2px. */
const below = (a: string, b: string, px: number): ValidatorSpec => ({
  kind: "offset",
  a,
  b,
  edgeA: "bottom",
  edgeB: "top",
  min: px - 2,
  max: px + 2,
});

const opacity = (id: string, value: string): ValidatorSpec => ({ kind: "computedEquals", id, prop: "opacity", value });

export const combinatorsTrack: Track = {
  id: "combinators",
  title: "結合子（> + ~）",
  summary: "> で直下の子、+ で直後の兄弟、~ で後ろのすべての兄弟を選び、HTML にクラスを足さずに狙いを絞る。",
  emoji: "🌳",
  lessons: [
    {
      id: "child-combinator",
      title: "直下の子だけ: 子結合子 >",
      explanation:
        "<p>セレクタの間の空白（子孫結合子）は、<b>子・孫・ひ孫…どこまででも</b>中にある要素を選びます。<code>.menu li</code> と書くと、メニューの中に入れ子になった下の段の <code>li</code> まで選ばれます。</p><p><b>子結合子</b> <code>&gt;</code> は、<b>すぐ内側（直下の子）</b>の要素だけを選びます。<code>.menu &gt; li</code> なら、<code>.menu</code> の直下にある上の段の項目だけで、孫の <code>li</code> には届きません。ただし、<code>color</code> や <code>font-weight</code> のように<b>継承されるプロパティ</b>は、選ばなかった孫にも親から受け継がれます。<code>border</code> や <code>background</code> は継承されません。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/Child_combinator",
      viz: { concept: "none" },
      challenge: {
        starterHTML: MENU_HTML,
        starterCSS: MENU_CSS(".menu li"),
        task: "メニューの上の段（ホーム・商品・お問い合わせ）にだけ、左の線と背景を付けたいのに、「商品」の中の「新着」「セール」にまで付いています。上の段の項目だけを選ぶように直そう。",
        snapshot: { props: ["border-left-width", "background-color"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "computedEquals", id: "m1", prop: "border-left-width", value: "4px" },
                  { kind: "computedEquals", id: "m3", prop: "border-left-width", value: "4px" },
                ],
                message: "上の段の項目（ホーム・お問い合わせ）に、左の線が付いていません",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "computedEquals", id: "s1", prop: "border-left-width", value: "0px" },
                  { kind: "computedEquals", id: "s2", prop: "border-left-width", value: "0px" },
                  { kind: "computedEquals", id: "s1", prop: "background-color", value: "rgba(0, 0, 0, 0)" },
                ],
                message: "入れ子の「新着」「セール」にも線や背景が付いています（.menu li は、孫の li まで選びます）",
              },
              {
                kind: "sourceMatches",
                pattern: "\\.menu\\s*>\\s*li",
                message: "入れ子の項目を上書きして消すのではなく、.menu > li で直下の子だけを選びましょう",
              },
            ],
          },
        ],
        hints: ["空白（子孫結合子）を、直下の子だけを選ぶ結合子に変えます", ".menu > li { … }"],
        solution: MENU_CSS(".menu > li"),
      },
    },
    {
      id: "next-sibling",
      title: "直後の兄弟だけ: 次兄弟結合子 +",
      explanation:
        "<p><b>次兄弟結合子</b> <code>+</code> は、同じ親を持ち、<b>すぐ前</b>に指定の要素がある要素だけを選びます。<code>h3 + p</code> は「見出しのすぐ次にある段落」で、2 つ目以降の段落は選びません。</p><p>見出しの直後だけ余白を詰める、ラベルの直後の入力欄だけ間を空ける、のように、<b>並び順に応じて</b>スタイルを変えたいときに、HTML にクラスを足さずに済みます。<code>:has(+ …)</code> と組み合わせると、逆に「次に○○がある要素」も選べます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/Next-sibling_combinator",
      viz: { concept: "none" },
      challenge: {
        starterHTML: POST_HTML,
        starterCSS: POST_CSS(""),
        task: "段落どうしの間は 16px のまま、見出しのすぐ後の段落だけ、上の余白を 4px に詰めよう（見出しと本文をひとかたまりに見せる）。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [below("h1", "p1", 4), below("h2", "p3", 4)],
                message: "見出しのすぐ後の段落が、見出しから離れたままです（上の余白を 4px に詰めます）",
              },
              {
                kind: "allOf",
                of: [below("p1", "p2", 16), below("p3", "p4", 16)],
                message: "段落どうしの間まで詰まっています（~ は後ろのすべての兄弟を選びます。+ なら直後の 1 つだけです）",
              },
              {
                kind: "sourceMatches",
                pattern: "h3\\s*\\+\\s*p",
                message: "見出しのすぐ次の段落を選ぶ h3 + p を使いましょう（段落を足しても、見出しの直後だけに効きます）",
              },
            ],
          },
        ],
        hints: ["「h3 のすぐ次にある p」を選ぶ結合子を使います", ".post h3 + p { margin-top: 4px; }"],
        solution: POST_CSS(".post h3 + p {\n  margin-top: 4px;\n}\n"),
      },
    },
    {
      id: "subsequent-sibling",
      title: "後ろのすべての兄弟: 後続兄弟結合子 ~",
      explanation:
        "<p><b>後続兄弟結合子</b> <code>~</code> は、同じ親を持ち、<b>前のどこかに</b>指定の要素がある要素を<b>すべて</b>選びます。<code>.current ~ .step</code> は「いまの段階より後ろにある段階すべて」です。<code>+</code> がすぐ次の 1 つだけなのに対して、<code>~</code> は間に何があっても選びます。</p><p>前の兄弟は選べない（<code>~</code> も <code>+</code> も後ろ向きだけ）ので、いまの段階より前を選びたいときは <code>.step:has(~ .current)</code> のように <code>:has()</code> と組み合わせます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/Subsequent-sibling_combinator",
      viz: { concept: "none" },
      challenge: {
        starterHTML: STEPS_HTML,
        starterCSS: STEPS_CSS(""),
        task: "購入の手順で、いま進んでいる「お支払い」（.current）より後ろの段階（確認・完了）を、opacity: 0.4 で薄くしよう。",
        snapshot: { props: ["opacity"] },
        validators: [
          {
            kind: "allOf",
            of: [
              { ...opacity("st4", "0.4"), message: "「確認」が薄くなっていません（opacity: 0.4）" },
              {
                ...opacity("st5", "0.4"),
                message: "「完了」が薄くなっていません（+ は直後の 1 つだけを選びます。後ろのすべての兄弟は ~ で選びます）",
              },
              {
                kind: "allOf",
                of: [opacity("st1", "1"), opacity("st2", "1"), opacity("st3", "1")],
                message: "「お支払い」とその前の段階は、薄くしません",
              },
              {
                kind: "sourceMatches",
                pattern: "~",
                message: "何番目かで選ぶのではなく、.current ~ .step で「いまの段階より後ろ」を選びましょう（いまの段階が変わっても書き直しが要りません）",
              },
            ],
          },
        ],
        hints: [".current より後ろにある .step をすべて選ぶ結合子を使います", ".current ~ .step { opacity: 0.4; }"],
        solution: STEPS_CSS(".current ~ .step {\n  opacity: 0.4;\n}\n"),
      },
    },
  ],
};
