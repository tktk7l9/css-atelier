import type { Track } from "./types.js";

export const selectorsTrack: Track = {
  id: "selectors",
  title: "セレクタの基礎",
  summary: "要素をどう狙うか。クラス・子孫・擬似クラスの基本。",
  emoji: "🎯",
  lessons: [
    {
      id: "selectors-class",
      title: "クラスで狙う",
      explanation:
        "<p>クラスセレクタ <code>.name</code> は、その class を持つ要素だけにスタイルを当てます。</p>",
      mdnPath: "/ja/docs/Web/CSS/Class_selectors",
      viz: { concept: "none" },
      challenge: {
        starterHTML:
          '<p data-id="p1" class="note">この行を青くする</p>\n<p data-id="p2">この行はそのまま</p>',
        starterCSS: ".note {\n  \n}\n",
        task: ".note の文字色だけを青（blue）にしよう。",
        snapshot: { props: ["color"] },
        validators: [
          { kind: "declarationEquals", selector: ".note", prop: "color", value: "blue" },
          { kind: "computedMatches", id: "p1", prop: "color", pattern: "0[,\\s]+0[,\\s]+255" },
        ],
        hints: ["クラスセレクタは .note と書きます", "color: blue"],
        solution: ".note {\n  color: blue;\n}\n",
      },
    },
    {
      id: "selectors-descendant",
      title: "子孫セレクタで絞り込む",
      explanation:
        "<p><code>.card a</code> のように空白で区切ると、<code>.card</code> の<b>中にある</b> <code>a</code> だけを狙えます。外側のリンクには当たりません。</p>",
      mdnPath: "/ja/docs/Web/CSS/Descendant_combinator",
      viz: { concept: "none" },
      challenge: {
        starterHTML:
          '<div data-id="card" class="card"><a data-id="link" href="#">カード内のリンク</a></div>\n<a data-id="outside" href="#">カード外のリンク</a>',
        starterCSS: ".card a {\n  \n}\n",
        task: "カードの中のリンクだけ下線を消そう（外のリンクは下線を残す）。",
        snapshot: { props: ["text-decoration-line"] },
        validators: [
          { kind: "computedMatches", id: "link", prop: "text-decoration-line", pattern: "none" },
          { kind: "computedMatches", id: "outside", prop: "text-decoration-line", pattern: "underline" },
        ],
        hints: ["子孫セレクタ .card a を使います", "text-decoration: none"],
        solution: ".card a {\n  text-decoration: none;\n}\n",
      },
    },
    {
      id: "selectors-first-child",
      title: "擬似クラス: :first-child",
      explanation:
        "<p><code>:first-child</code> は、兄弟の中で<b>最初</b>の要素を狙う擬似クラスです。</p>",
      mdnPath: "/ja/docs/Web/CSS/:first-child",
      viz: { concept: "none" },
      challenge: {
        starterHTML:
          '<ul class="list"><li data-id="i1">最初の項目</li><li data-id="i2">2番目の項目</li></ul>',
        starterCSS: "li:first-child {\n  \n}\n",
        task: "リストの最初の項目だけを太字にしよう。",
        snapshot: { props: ["font-weight"] },
        validators: [
          { kind: "computedMatches", id: "i1", prop: "font-weight", pattern: "700|bold" },
          { kind: "computedMatches", id: "i2", prop: "font-weight", pattern: "400|normal" },
        ],
        hints: [":first-child で最初の項目を狙います", "font-weight: bold"],
        solution: "li:first-child {\n  font-weight: bold;\n}\n",
      },
    },
  ],
};
