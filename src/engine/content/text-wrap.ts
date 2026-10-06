import type { Track } from "./types.js";

// Where a line breaks depends on the installed fonts, so line positions are not
// a reliable signal across machines. Balance is checked via its computed
// longhand; `pretty` is not in Firefox, so that lesson reads the learner's CSS
// text instead and stays passable in every browser.

export const textWrapTrack: Track = {
  id: "text-wrap",
  title: "読みやすい改行",
  summary: "text-wrap: balance / pretty で、見出しと本文の折り返しを整える。",
  emoji: "📝",
  lessons: [
    {
      id: "text-wrap-balance",
      title: "見出しの行をそろえる: text-wrap: balance",
      explanation:
        "<p>ふつうの折り返しは、1 行目に入るだけ詰め込んでから次の行へ送ります。短い見出しだと「長い 1 行目 + 2〜3 文字だけの 2 行目」になりがちです。</p><p><code>text-wrap: balance</code> を指定すると、ブラウザが<b>各行の長さがなるべく均等になる</b>位置で折り返します。計算が重いので、見出しやキャプションのような数行の文に使います（長い文章では効きません）。</p><p>Baseline 2024（Chrome 114 / Firefox 121 / Safari 17.5 以降で利用可）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/text-wrap",
      viz: { concept: "none" },
      challenge: {
        starterHTML: '<h2 data-id="heading" class="heading">春から始める、はじめての家庭菜園ガイド</h2>',
        starterCSS:
          ".heading {\n  width: 260px;\n  margin: 0;\n  font-size: 22px;\n  line-height: 1.4;\n  border-left: 4px solid #2f5fd0;\n  padding-left: 8px;\n}\n",
        task: "見出しの 2 行の長さがそろうように、.heading の折り返しを balance にしよう。",
        snapshot: { props: ["text-wrap-style"] },
        validators: [
          { kind: "computedEquals", id: "heading", prop: "text-wrap-style", value: "balance", message: ".heading に text-wrap: balance を指定しましょう" },
        ],
        hints: ["text-wrap は折り返しの方法を決めるプロパティです", "text-wrap: balance;"],
        solution:
          ".heading {\n  width: 260px;\n  margin: 0;\n  font-size: 22px;\n  line-height: 1.4;\n  border-left: 4px solid #2f5fd0;\n  padding-left: 8px;\n  text-wrap: balance;\n}\n",
      },
    },
    {
      id: "text-wrap-pretty",
      title: "本文の最後の 1 語を救う: text-wrap: pretty",
      explanation:
        "<p>本文の段落では、最後の行に 1〜2 文字だけが取り残される「孤立した行」が起きがちです。<code>text-wrap: pretty</code> は段落の終わりのほうの折り返しを見直して、これを避けようとします。<code>balance</code> と違い長い文章にも使える前提の値です。</p><p><code>pretty</code> は Chrome 117 / Safari 26 以降で使えますが、Firefox は未対応です（2026 年 10 月時点・Baseline 未達）。未対応のブラウザではふつうの折り返しになるだけなので、本文全体に気軽に足せます。採点は書いた CSS で行うので、どのブラウザでもクリアできます。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/text-wrap-style",
      viz: { concept: "none" },
      challenge: {
        starterHTML:
          '<article class="post"><h2 data-id="title">今日の作業</h2><p data-id="body">苗を植える前に、土を深めに耕して元肥を混ぜておきます。水はけの悪い場所では畝を高くすると根腐れを防げます。</p></article>',
        starterCSS:
          ".post {\n  width: 260px;\n}\n.post h2 {\n  margin: 0 0 8px;\n  font-size: 20px;\n}\n.post p {\n  margin: 0;\n  line-height: 1.7;\n}\n",
        task: "本文の段落（.post p）の最後の行に文字が取り残されにくくなるよう、text-wrap を pretty にしよう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "sourceMatches",
            pattern: "text-wrap(?:-style)?\\s*:\\s*pretty",
            message: ".post p に text-wrap: pretty を指定しましょう",
          },
        ],
        hints: ["段落のルール .post p に足します", "text-wrap: pretty;"],
        solution:
          ".post {\n  width: 260px;\n}\n.post h2 {\n  margin: 0 0 8px;\n  font-size: 20px;\n}\n.post p {\n  margin: 0;\n  line-height: 1.7;\n  text-wrap: pretty;\n}\n",
      },
    },
  ],
};
