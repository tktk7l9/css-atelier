import type { Track } from "./types.js";

// Structural selectors are judged by the computed look of each element: which
// visible rows are shaded, whether the lone photo spans the gallery (measured)
// and which paragraph got the lead style. Every lesson checks both the
// elements that should change and the ones that should not, so selecting by
// hand (a class or a fixed position) only passes when it matches exactly the
// same elements.

const SHADE = "rgb(238, 241, 248)";
const CLEAR = "rgba(0, 0, 0, 0)";

const ROWS_HTML =
  '<ul class="rows">' +
  '<li data-id="r1">月曜日　10:00〜18:00</li>' +
  '<li data-id="r2" hidden>火曜日　定休日</li>' +
  '<li data-id="r3">水曜日　10:00〜18:00</li>' +
  '<li data-id="r4">木曜日　10:00〜20:00</li>' +
  '<li data-id="r5" hidden>金曜日　臨時休業</li>' +
  '<li data-id="r6">土曜日　9:00〜17:00</li>' +
  "</ul>";

const ROWS_CSS = (selector: string): string =>
  `.rows {\n  width: 280px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.rows li {\n  padding: 6px 12px;\n}\n/* 1 行おきに色を付ける */\n${selector} {\n  background: #eef1f8;\n}\n`;

const GALLERY_HTML =
  '<div data-id="one" class="gallery"><div data-id="o1" class="tile">1</div></div>' +
  '<div data-id="three" class="gallery"><div data-id="t1" class="tile">1</div><div data-id="t2" class="tile">2</div><div data-id="t3" class="tile">3</div></div>';

const GALLERY_CSS = (extra: string): string =>
  `.gallery {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 8px;\n  width: 280px;\n  margin-bottom: 12px;\n}\n.tile {\n  display: grid;\n  place-items: center;\n  height: 56px;\n  border-radius: 8px;\n  background: #dbe4fb;\n  font-weight: 700;\n}\n${extra}`;

const ARTICLE_HTML =
  '<article class="article"><h2 data-id="title">春の講座のお知らせ</h2>' +
  '<p data-id="p1">今年も春の講座を開きます。</p><p data-id="p2">定員は各回 12 名です。</p><p data-id="p3">お申し込みは 3 月末までです。</p></article>';

const ARTICLE_CSS = (selector: string): string =>
  `.article {\n  width: 280px;\n}\n.article h2 {\n  margin: 0 0 8px;\n  font-size: 20px;\n}\n.article p {\n  margin: 0 0 6px;\n  font-size: 14px;\n}\n/* 最初の段落（リード）を大きく */\n${selector} {\n  font-size: 17px;\n  font-weight: 700;\n}\n`;

export const nthPatternsTrack: Track = {
  id: "nth-patterns",
  title: "何番目かの応用（of S・:only-child・:first-of-type）",
  summary: ":nth-child(even of :not([hidden])) で表示している行だけを 1 行おきに塗り、:only-child で 1 枚だけのときに全幅にし、:first-of-type で見出しのあとの最初の段落を選ぶ。",
  emoji: "🔁",
  lessons: [
    {
      id: "nth-child-of",
      title: "表示している行だけ数える: :nth-child(even of …)",
      explanation:
        "<p><code>:nth-child(even)</code> は、<code>hidden</code> で隠した行も含めて何番目かを数えます。途中の行を隠すと、色の付いた行や付いていない行が続いてしまい、1 行おきに見えなくなります。</p><p><code>:nth-child(even of :not([hidden]))</code> のように <code>of</code> のあとにセレクタを書くと、<b>そのセレクタに合う兄弟だけ</b>を数えて何番目かを決めます。表示している行だけを数えるので、隠した行があっても 1 行おきのままです（MDN の、しま模様の表の例と同じです）。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/:nth-child",
      viz: { concept: "none" },
      challenge: {
        starterHTML: ROWS_HTML,
        starterCSS: ROWS_CSS(".rows li:nth-child(even)"),
        task: "営業時間の表で、隠した行（hidden）があるため、色の付いた行が続いています。表示している行だけを数えて、2 行目・4 行目に色が付くようにしよう。",
        snapshot: { props: ["background-color"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "computedEquals", id: "r3", prop: "background-color", value: SHADE },
                  { kind: "computedEquals", id: "r6", prop: "background-color", value: SHADE },
                  { kind: "computedEquals", id: "r1", prop: "background-color", value: CLEAR },
                  { kind: "computedEquals", id: "r4", prop: "background-color", value: CLEAR },
                ],
                message: "表示している行が 1 行おきに塗られていません（:nth-child(even) は隠した行も数えます。:nth-child(even of :not([hidden]))）",
              },
            ],
          },
        ],
        hints: [":nth-child() の中に of を書くと、数える兄弟を絞れます", ".rows li:nth-child(even of :not([hidden])) { … }"],
        solution: ROWS_CSS(".rows li:nth-child(even of :not([hidden]))"),
      },
    },
    {
      id: "only-child",
      title: "1 つだけのときは広く: :only-child",
      explanation:
        "<p><code>:only-child</code> は、<b>兄弟がいない（親の中に自分 1 つだけの）</b>要素を選びます。<code>:first-child:last-child</code> と同じ要素を選びますが、詳細度はそれより低くなります。</p><p>2 列のギャラリーで、写真が 1 枚しかないと、右の列が空いて片寄って見えます。<code>.tile:only-child { grid-column: 1 / -1; }</code> とすると、1 枚だけのときにだけ 2 列ぶんに広げられ、何枚あるかを HTML のクラスで伝える必要がありません。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/:only-child",
      viz: { concept: "none" },
      challenge: {
        starterHTML: GALLERY_HTML,
        starterCSS: GALLERY_CSS(""),
        task: "2 列のギャラリーで、写真が 1 枚しかない上のギャラリーは右が空いています。写真が 1 枚だけのときだけ、2 列ぶんの幅に広げよう（3 枚のギャラリーはそのまま）。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "sizeApprox",
                id: "o1",
                w: 280,
                tol: 0.5,
                message: "1 枚だけの写真が、2 列ぶんの幅（280px）になっていません（兄弟のいない要素は :only-child で選べます）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "sizeApprox", id: "t1", w: 136, tol: 0.5 },
                  { kind: "sizeApprox", id: "t3", w: 136, tol: 0.5 },
                ],
                message: "3 枚のギャラリーの写真まで広がっています（1 枚だけのときに限ります）",
              },
            ],
          },
        ],
        hints: ["兄弟がいない要素を選ぶ擬似クラスで、grid-column を 1 / -1 にします", ".tile:only-child { grid-column: 1 / -1; }"],
        solution: GALLERY_CSS("/* 1 枚だけのときは 2 列ぶんに */\n.tile:only-child {\n  grid-column: 1 / -1;\n}\n"),
      },
    },
    {
      id: "first-of-type",
      title: "見出しのあとの最初の段落: p:first-of-type",
      explanation:
        "<p>最初の段落を目立たせようと <code>p:first-child</code> と書いても、記事の最初の子は見出し（<code>h2</code>）なので、どの段落にも当てはまりません。<code>:first-child</code> は、要素の種類に関係なく、兄弟の中で最初かどうかを見るからです。</p><p><code>p:first-of-type</code> は、<b>同じ種類（要素名）の兄弟の中で最初</b>のものを選びます。見出しが前にあっても、最初の <code>p</code> を選べます。同じように <code>:last-of-type</code> や <code>:nth-of-type()</code> もあります。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/:first-of-type",
      viz: { concept: "none" },
      challenge: {
        starterHTML: ARTICLE_HTML,
        starterCSS: ARTICLE_CSS(".article p:first-child"),
        task: "最初の段落（リード）を大きく太くしたいのに、p:first-child がどの段落にも当たっていません。見出しのあとの最初の段落だけを選び直そう。",
        snapshot: { props: ["font-size", "font-weight"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "computedEquals", id: "p1", prop: "font-size", value: "17px" },
                  { kind: "computedEquals", id: "p1", prop: "font-weight", value: "700" },
                ],
                message: "最初の段落が大きく太くなっていません（記事の最初の子は見出しなので、p:first-child は当たりません。p:first-of-type）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "computedEquals", id: "p2", prop: "font-size", value: "14px" },
                  { kind: "computedEquals", id: "p3", prop: "font-size", value: "14px" },
                  { kind: "computedEquals", id: "title", prop: "font-size", value: "20px" },
                ],
                message: "最初の段落のほかまで大きくなっています（最初の段落だけを選びます）",
              },
            ],
          },
        ],
        hints: ["要素の種類ごとに最初かどうかを見る擬似クラスがあります", ".article p:first-of-type { … }"],
        solution: ARTICLE_CSS(".article p:first-of-type"),
      },
    },
  ],
};
