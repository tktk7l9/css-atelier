import type { Track } from "./types.js";

// :has() selects an element by what comes after it or what it contains. The
// lessons check the effect on every instance in the preview: the matching one
// changes and its look-alike that does not match stays as it was, so a rule
// written without the condition fails. The source check asks for :has() itself,
// since a positional selector (`.post:first-child …`) can fake the same picture.

const POSTS_HTML =
  '<article class="post"><h2 data-id="title1" class="title">春の講座のお知らせ</h2><p class="lead">4 月から新しい講座が始まります</p><p class="body">申し込みは 3 月 1 日からです。</p></article>' +
  '<article class="post"><h2 data-id="title2" class="title">メンテナンスの予定</h2><p class="body">3 月 10 日の夜に、2 時間ほど止まります。</p></article>';

const POSTS_CSS = (extra: string): string =>
  `.post {\n  margin-bottom: 12px;\n  padding: 12px 16px;\n  border: 1px solid #dbe4fb;\n  border-radius: 8px;\n}\n.title {\n  margin: 0 0 16px;\n  font-size: 18px;\n  line-height: 28px;\n}\n.lead {\n  margin: 0 0 8px;\n  font-size: 14px;\n  color: #4a5578;\n}\n.body {\n  margin: 0;\n}\n${extra}`;

const tiles = (prefix: string, n: number): string =>
  Array.from({ length: n }, (_, i) => (i === 0 || i === 2 ? `<span data-id="${prefix}${i + 1}"></span>` : "<span></span>")).join("");

// Side by side, so both galleries fit in the preview even before the fix.
const GALLERIES_HTML =
  '<div class="pair">' +
  `<div><p class="label">写真 4 枚</p><div class="gallery">${tiles("a", 4)}</div></div>` +
  `<div><p class="label">写真 5 枚</p><div class="gallery">${tiles("b", 5)}</div></div>` +
  "</div>";

const GALLERIES_CSS = (extra: string): string =>
  `.pair {\n  display: flex;\n  align-items: start;\n  gap: 20px;\n}\n.label {\n  margin: 0 0 4px;\n  font-size: 13px;\n  color: #4a5578;\n}\n.gallery {\n  display: grid;\n  grid-template-columns: repeat(2, 1fr);\n  gap: 6px;\n  width: 220px;\n}\n.gallery > * {\n  aspect-ratio: 4 / 3;\n  border-radius: 6px;\n  background: linear-gradient(160deg, #ffd27a, #ff8a65 40%, #7b5cd6 75%, #2f5fd0);\n}\n${extra}`;

const RESULTS_HTML =
  '<section class="results"><h3 class="head">「CSS」の検索結果</h3><p data-id="none1" class="none">見つかりませんでした</p><ul class="list"><li>CSS の基本</li><li>CSS グリッド入門</li></ul></section>' +
  '<section class="results"><h3 class="head">「HTML6」の検索結果</h3><p data-id="none2" class="none">見つかりませんでした</p><ul class="list"></ul></section>';

const RESULTS_CSS = (extra: string): string =>
  `.results {\n  margin-bottom: 12px;\n  padding: 10px 14px;\n  border: 1px solid #dbe4fb;\n  border-radius: 8px;\n}\n.head {\n  margin: 0 0 6px;\n  font-size: 15px;\n}\n.list {\n  margin: 0;\n  padding-left: 1.2em;\n}\n/* 「見つかりませんでした」は、ふだんは隠しておく */\n.none {\n  display: none;\n  margin: 0;\n  color: #4a5578;\n}\n${extra}`;

export const hasPatternsTrack: Track = {
  id: "has-patterns",
  title: ":has() の応用",
  summary: ":has() で、後ろに続く要素・子の数・中身がないことに応じて、HTML を変えずにスタイルを切り替える。",
  emoji: "🔗",
  lessons: [
    {
      id: "has-sibling",
      title: "後ろの要素で選ぶ: :has(+ …)",
      explanation:
        "<p>CSS のセレクタは、ふつう<b>前から後ろへ</b>しかたどれません。<code>.title + .lead</code> は見出しの直後のリード文を選びますが、「直後にリード文が続く見出し」のほうは選べませんでした。<code>:has()</code> の中に <code>+</code>（直後の兄弟）を書くと、それができます。<code>.title:has(+ .lead)</code> は、<b>直後に .lead が続く</b> .title を選びます。</p><p>見出しの直後にリード文があるときだけ見出しの下の余白を詰める、といった調整を、HTML にクラスを足さずに書けます。<code>~</code>（後ろの兄弟のどれか）も同じように使えます。主要ブラウザすべてで使えます（Baseline: 広く利用可能。2023 年 12 月に主要ブラウザがそろいました）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/:has",
      viz: { concept: "none" },
      challenge: {
        starterHTML: POSTS_HTML,
        starterCSS: POSTS_CSS(""),
        task: "直後にリード文（.lead）が続く見出し（.title）だけ、下の余白を 16px から 4px に詰めて、リード文とひとまとまりに見せよう。リード文のない 2 つ目の記事の見出しは 16px のままです。",
        snapshot: { props: ["margin-bottom"] },
        validators: [
          // allOf reports only the first unmet step, so a fresh starter gets one message.
          {
            kind: "allOf",
            of: [
              {
                kind: "computedEquals",
                id: "title1",
                prop: "margin-bottom",
                value: "4px",
                message: "リード文が続く見出し（1 つ目の記事）の下の余白が 4px になっていません",
              },
              {
                kind: "computedEquals",
                id: "title2",
                prop: "margin-bottom",
                value: "16px",
                message: "リード文のない見出し（2 つ目の記事）の余白は 16px のままにしましょう",
              },
              {
                kind: "sourceMatches",
                pattern: ":has\\(\\s*[+~]",
                message: ":has(+ .lead) で「直後に .lead が続く見出し」を選びましょう",
              },
            ],
          },
        ],
        hints: [":has() の中に + を書くと、直後にその兄弟があるかを調べられます", ".title:has(+ .lead) { margin-bottom: 4px; }"],
        solution: POSTS_CSS(".title:has(+ .lead) {\n  margin-bottom: 4px;\n}\n"),
      },
    },
    {
      id: "has-quantity",
      title: "数に応じて切り替える: :has(> :nth-child(n))",
      explanation:
        "<p><code>:has()</code> の中で <code>:nth-child()</code> を使うと、<b>子の数</b>で親のスタイルを切り替えられます。<code>.gallery:has(> :nth-child(5))</code> は「5 番目の子がある」、つまり<b>子が 5 つ以上ある</b> .gallery を選びます。</p><p>写真が多いときだけ列を増やして小さく並べる、項目が少ないときは大きく見せる、といった切り替えを、件数を数えるスクリプトなしで書けます。ちょうどの数を狙うなら <code>:last-child</code> と組み合わせます（<code>:has(> :nth-child(5):last-child)</code> なら、ちょうど 5 つ）。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/:nth-child",
      viz: { concept: "none" },
      challenge: {
        starterHTML: GALLERIES_HTML,
        starterCSS: GALLERIES_CSS(""),
        task: "写真が 5 枚以上あるギャラリー（.gallery）だけ、3 列に並べよう。4 枚以下のギャラリーは 2 列のままです。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "alignedEdge",
                ids: ["b1", "b3"],
                edge: "top",
                message: "5 枚のギャラリーが 3 列になっていません（3 枚目の写真が 1 段目に並びます）",
              },
              {
                kind: "order",
                ids: ["a1", "a3"],
                axis: "y",
                message: "4 枚のギャラリーまで 3 列になっています。5 枚以上のときだけにしましょう",
              },
              {
                kind: "sourceMatches",
                pattern: ":has\\([^{]*nth-",
                message: ":has() と :nth-child() で、子の数を数えましょう",
              },
            ],
          },
        ],
        hints: [
          "「5 番目の子がある」は、子が 5 つ以上あるのと同じです",
          ".gallery:has(> :nth-child(5)) { grid-template-columns: repeat(3, 1fr); }",
        ],
        solution: GALLERIES_CSS(".gallery:has(> :nth-child(5)) {\n  grid-template-columns: repeat(3, 1fr);\n}\n"),
      },
    },
    {
      id: "has-empty",
      title: "ないときだけ表示する: :not(:has())",
      explanation:
        "<p><code>:not()</code> で <code>:has()</code> を包むと、<b>「中に〜がない」</b>要素を選べます。<code>.results:not(:has(li))</code> は、中に li が 1 つもない .results です。検索結果が 0 件のときだけ「見つかりませんでした」を出す、カートが空のときだけ案内を出す、といった<b>空の状態</b>の表示に使えます。</p><p>似た <code>:empty</code> は、子をまったく持たない要素にしか当てはまりません。見出しなど別の中身がある箱で「li だけがない」を調べるには <code>:has()</code> を使います。なお <code>:has()</code> の中に <code>:has()</code> は書けませんが、<code>:not()</code> の中に <code>:has()</code> は書けます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/:not",
      viz: { concept: "none" },
      challenge: {
        starterHTML: RESULTS_HTML,
        starterCSS: RESULTS_CSS(""),
        task: "検索結果が 1 件もない欄（.results の中に li がない）だけ、「見つかりませんでした」（.none）を表示しよう。結果がある欄では隠したままです。",
        snapshot: { props: ["display"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "computedEquals",
                id: "none2",
                prop: "display",
                value: "block",
                message: "結果が 0 件の欄に「見つかりませんでした」が表示されていません",
              },
              {
                kind: "computedEquals",
                id: "none1",
                prop: "display",
                value: "none",
                message: "結果がある欄にまで「見つかりませんでした」が表示されています",
              },
              {
                kind: "sourceMatches",
                pattern: ":has\\(",
                message: ":has() で「li がないこと」を調べましょう（:not(:has(li))）",
              },
            ],
          },
        ],
        hints: ["「li を含む」が :has(li) なので、「li を含まない」はそれを :not() で包みます", ".results:not(:has(li)) .none { display: block; }"],
        solution: RESULTS_CSS(".results:not(:has(li)) .none {\n  display: block;\n}\n"),
      },
    },
  ],
};
