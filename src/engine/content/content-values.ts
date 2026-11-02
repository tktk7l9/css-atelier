import type { Track } from "./types.js";

// The sandbox reads elements, and // generated text is not in the DOM, so attr() is judged by the CSS text, quotes by
// its computed value, and @counter-style by the computed list-style-type together
// with the at-rule in the CSS text.

const BADGE_HTML =
  '<ul class="tabs"><li>受信箱<span data-id="a" class="badge" data-count="3"></span></li>' +
  '<li>下書き<span data-id="b" class="badge" data-count="128"></span></li></ul>';

const BADGE_CSS =
  ".tabs {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.badge {\n  display: inline-block;\n  min-width: 8px;\n  margin-left: 8px;\n  padding: 0 6px;\n  border-radius: 8px;\n  background: #dbe4fb;\n  font-size: 12px;\n}\n";

const QUOTE_HTML = '<p class="text"><q data-id="outer">先生は<q data-id="inner">明日は休みだ</q>と言った</q></p>';

const QUOTE_CSS = ".text {\n  margin: 0;\n}\n";

const STEPS_HTML =
  '<ol data-id="steps" class="steps"><li data-id="s1">申し込む</li><li data-id="s2">確認のメールを開く</li><li data-id="s3">パスワードを決める</li></ol>';

const STEPS_CSS = ".steps {\n  margin: 0;\n  padding-left: 2em;\n}\n";

export const contentValuesTrack: Track = {
  id: "content-values",
  title: "content の値（attr()・quotes・@counter-style）",
  summary: "attr() で属性の値を表示し、quotes で <q> の括弧を日本語のかぎ括弧にし、@counter-style で ① ② ③ のような番号の形を自分で定義する。",
  emoji: "💬",
  lessons: [
    {
      id: "attr-content",
      title: "属性の値を表示する: attr()",
      explanation:
        "<p><code>attr(data-count)</code> は、要素の属性の値を取り出す関数です。<code>::after</code> の <code>content</code> に書くと、HTML の <code>data-count=\"3\"</code> の値がそのまま表示されます。擬似要素の場合は、元の要素の属性を読みます。</p><p>同じ見た目の部品に、値だけ HTML から渡せるので、件数のバッジやツールチップの文などに使えます。生成された内容はスクリーンリーダーに確実には伝わらないので、大事な情報は HTML の本文に書きます。</p><p><code>content</code> での <code>attr()</code> は主要ブラウザすべてで使えます（Baseline: 広く利用可能）。<code>content</code> 以外のプロパティで使う書き方は、まだ実験的な機能です。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/attr",
      viz: { concept: "none" },
      challenge: {
        starterHTML: BADGE_HTML,
        starterCSS: BADGE_CSS,
        task: "バッジが空っぽです。.badge::after の content に attr(data-count) を指定して、HTML の data-count の数を表示しよう。",
        snapshot: { props: [] },
        validators: [
          { kind: "sourceMatches", pattern: "\\.badge::after\\s*\\{[^}]*content\\s*:\\s*attr\\(\\s*data-count\\s*\\)", message: ".badge::after に content: attr(data-count) を書きましょう" },
        ],
        hints: ["属性の名前は引用符なしで書きます", ".badge::after { content: attr(data-count); }"],
        solution: BADGE_CSS + ".badge::after {\n  content: attr(data-count);\n}\n",
      },
    },
    {
      id: "quotes-property",
      title: "括弧を決める: quotes",
      explanation:
        "<p><code>&lt;q&gt;</code> の前後には、ブラウザが引用符を自動で付けます。実体は <code>content: open-quote</code> と <code>close-quote</code> で、どの文字にするかを <code>quotes</code> が決めます。</p><p><code>quotes: \"「\" \"」\" \"『\" \"』\"</code> のように、始めと終わりの組を<b>入れ子の深さの順に</b>並べます。1 組目が外側の <code>q</code>、2 組目がその中の <code>q</code> です。初期値の <code>auto</code> は言語に合った引用符を選びます（<code>lang</code> 属性を見ます）。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/quotes",
      viz: { concept: "none" },
      challenge: {
        starterHTML: QUOTE_HTML,
        starterCSS: QUOTE_CSS,
        task: ".text の quotes を指定して、外側の引用を「」に、内側の引用を『』にしよう。",
        snapshot: { props: ["quotes"] },
        validators: [
          { kind: "computedEquals", id: "inner", prop: "quotes", value: "\"「\" \"」\" \"『\" \"』\"", message: "括弧が「」と『』になっていません（.text に quotes: \"「\" \"」\" \"『\" \"』\" を指定します。組は外側から順に書きます）" },
        ],
        hints: ["quotes は継承されるので、段落に書けば中の q に届きます", ".text { quotes: \"「\" \"」\" \"『\" \"』\"; }"],
        solution: QUOTE_CSS + ".text {\n  quotes: \"「\" \"」\" \"『\" \"』\";\n}\n",
      },
    },
    {
      id: "counter-style",
      title: "番号の形を作る: @counter-style",
      explanation:
        "<p><code>@counter-style</code> は、リストの番号の形を自分で定義するアットルールです。<code>system</code> で数え方を、<code>symbols</code> で使う記号を、<code>suffix</code> で番号の後ろの文字を決めます。作った名前は <code>list-style</code> に書けます。</p><p><code>system: fixed</code> は、<code>symbols</code> の記号を順に 1 回ずつ使います。足りなくなると、<code>fallback</code> の形に切り替わります（書かなければ <code>decimal</code> です）。<code>system: cyclic</code> なら、記号を繰り返します。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能。Chrome 91・Firefox 33・Safari 17 から）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/At-rules/@counter-style",
      viz: { concept: "none" },
      challenge: {
        starterHTML: STEPS_HTML,
        starterCSS: STEPS_CSS,
        task: "@counter-style maru を作って（system: fixed、symbols: \"①\" \"②\" \"③\"、suffix: \" \"）、.steps の list-style を maru にしよう。",
        snapshot: { props: ["list-style-type"] },
        validators: [
          { kind: "computedEquals", id: "s1", prop: "list-style-type", value: "maru", message: ".steps に list-style: maru を指定しましょう" },
          {
            kind: "anyOf",
            of: [
              { kind: "sourceMatches", pattern: "@counter-style\\s+maru\\s*\\{[^}]*system\\s*:\\s*fixed[^}]*\\}|@counter-style\\s+maru\\s*\\{[^}]*symbols\\s*:\\s*\"①\"\\s*\"②\"\\s*\"③\"[^}]*\\}", message: "" },
              { kind: "computedEquals", id: "s1", prop: "list-style-type", value: "decimal", message: "" },
            ],
            message: "@counter-style maru { … } で、symbols: \"①\" \"②\" \"③\" を定義しましょう",
          },
        ],
        hints: ["名前は引用符なしで書きます", "@counter-style maru {\n  system: fixed;\n  symbols: \"①\" \"②\" \"③\";\n  suffix: \" \";\n}\n.steps { list-style: maru; }"],
        solution: STEPS_CSS + "@counter-style maru {\n  system: fixed;\n  symbols: \"①\" \"②\" \"③\";\n  suffix: \" \";\n}\n.steps {\n  list-style: maru;\n}\n",
      },
    },
  ],
};
