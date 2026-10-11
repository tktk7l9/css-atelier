import type { ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Structural pseudo-classes are judged by which items end up styled, read as
// computed values: the striped rows' background, the last item's bottom
// border, the top three entries' background. Writing each position out
// (nth-child(2), nth-child(4) …) styles the same items today, so the last step
// looks for the formula the lesson teaches, which keeps working when items are
// added.

const STRIPE = "rgb(238, 241, 248)";
const GOLD = "rgb(255, 243, 196)";
const CLEAR = "rgba(0, 0, 0, 0)";

const TEAMS = [
  ["北", "21"],
  ["東", "18"],
  ["南", "15"],
  ["西", "12"],
  ["中央", "9"],
];

const TABLE_HTML =
  '<table data-id="table" class="table"><thead><tr><th>順位</th><th>チーム</th><th>勝点</th></tr></thead><tbody>' +
  TEAMS.map(([team, points], i) => `<tr data-id="r${i + 1}"><td>${i + 1}</td><td>${team}</td><td>${points}</td></tr>`).join("") +
  "</tbody></table>";

const TABLE_CSS = (extra: string): string =>
  `.table {\n  border-collapse: collapse;\n  font-size: 14px;\n}\n.table th,\n.table td {\n  padding: 4px 12px;\n  text-align: left;\n}\n.table thead th {\n  border-bottom: 2px solid #2f5fd0;\n}\n${extra}`;

const ITEMS = ["プロフィール", "通知", "プライバシー", "ログアウト"];

const LIST_HTML =
  '<ul data-id="list" class="list">' + ITEMS.map((t, i) => `<li data-id="i${i + 1}">${t}</li>`).join("") + "</ul>";

const LIST_CSS = (extra: string): string =>
  `.list {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.list li {\n  padding: 8px 12px;\n  border-bottom: 1px solid #9fb2e6;\n  font-size: 14px;\n}\n${extra}`;

const BOOKS = ["CSS のきほん", "はじめてのデザイン", "色の教科書", "文字と組版", "レイアウト入門", "アクセシビリティ"];

const RANKING_HTML =
  '<ol data-id="ranking" class="ranking">' + BOOKS.map((t, i) => `<li data-id="k${i + 1}">${t}</li>`).join("") + "</ol>";

const RANKING_CSS = (extra: string): string =>
  `.ranking {\n  margin: 0;\n  padding-left: 28px;\n  font-size: 14px;\n}\n.ranking li {\n  padding: 4px 8px;\n  border-radius: 6px;\n}\n${extra}`;

const computed = (id: string, prop: string, value: string): ValidatorSpec => ({ kind: "computedEquals", id, prop, value });
const all = (ids: readonly string[], prop: string, value: string): ValidatorSpec => ({
  kind: "allOf",
  of: ids.map((id) => computed(id, prop, value)),
});

export const structuralSelectorsTrack: Track = {
  id: "structural-selectors",
  title: "何番目かで選ぶ（:nth-child・:last-child）",
  summary: ":nth-child(even) で 1 行おき、:last-child で最後だけ、:nth-child(-n + 3) で最初の 3 つを、クラスを足さずに選ぶ。",
  emoji: "🔢",
  lessons: [
    {
      id: "nth-child-even",
      title: "1 行おきに色を付ける: :nth-child(even)",
      explanation:
        "<p><code>:nth-child()</code> は、兄弟の中で<b>何番目か</b>で要素を選ぶ擬似クラスです。番号は 1 から数えます。<code>even</code> は偶数番目（2・4・6…）、<code>odd</code> は奇数番目（1・3・5…）で、それぞれ <code>2n</code> と <code>2n + 1</code> と同じです。</p><p>表の本文の行（<code>tbody tr</code>）を <code>:nth-child(even)</code> で選んで背景を付けると、行を足しても減らしても、1 行おきの色分け（ゼブラ）が保たれます。見出しの行は <code>thead</code> の中にあり、兄弟が違うので数えられません。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/:nth-child",
      viz: { concept: "none" },
      challenge: {
        starterHTML: TABLE_HTML,
        starterCSS: TABLE_CSS(""),
        task: "順位表の行を目で追いやすくするため、本文の行を 1 行おきに色分けしよう（2・4 行目に背景 #eef1f8）。",
        snapshot: { props: ["background-color"] },
        validators: [
          {
            kind: "allOf",
            of: [
              { ...all(["r2", "r4"], "background-color", STRIPE), message: "2 行目と 4 行目に背景（#eef1f8）が付いていません" },
              {
                ...all(["r1", "r3", "r5"], "background-color", CLEAR),
                message: "1・3・5 行目にまで背景が付いています（even は偶数番目＝2・4…行目です）",
              },
              {
                kind: "sourceMatches",
                pattern: ":nth-(?:child|of-type)\\(\\s*(?:even|2n(?:\\s*\\+\\s*0)?)\\s*\\)",
                message: "行ごとに番号を書くのではなく :nth-child(even) で選びましょう（行が増えても 1 行おきのままになります）",
              },
            ],
          },
        ],
        hints: ["本文の行（.table tbody tr）のうち、偶数番目を選びます", ".table tbody tr:nth-child(even) { background: #eef1f8; }"],
        solution: TABLE_CSS(".table tbody tr:nth-child(even) {\n  background: #eef1f8;\n}\n"),
      },
    },
    {
      id: "last-child",
      title: "最後だけ線を消す: :last-child",
      explanation:
        "<p><code>:last-child</code> は、兄弟の中で<b>最後</b>の要素を選びます（最初は <code>:first-child</code>）。区切り線を各項目の下に付けると、最後の項目の線が外側の枠線と重なって二重に見えるので、<code>:last-child</code> で最後だけ線を消すのが定番です。</p><p>反対に <code>.list li:not(:last-child)</code> と書いて「最後以外」にだけ線を付けても同じ結果です。後ろから数える <code>:nth-last-child(2)</code>（後ろから 2 番目）もあります。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/:last-child",
      viz: { concept: "none" },
      challenge: {
        starterHTML: LIST_HTML,
        starterCSS: LIST_CSS(""),
        task: "設定メニューの最後の項目（ログアウト）の下線が、一覧の枠線と重なって二重に見えます。最後の項目だけ下線を消そう。",
        snapshot: { props: ["border-bottom-width"] },
        validators: [
          {
            kind: "allOf",
            of: [
              { ...computed("i4", "border-bottom-width", "0px"), message: "最後の項目（ログアウト）の下線が残っています" },
              {
                ...all(["i1", "i2", "i3"], "border-bottom-width", "1px"),
                message: "最後以外の項目の下線まで消えています（区切り線は残します）",
              },
              {
                kind: "sourceMatches",
                pattern: ":last-child|:last-of-type|:nth-last-child\\(\\s*1\\s*\\)",
                message: "4 番目と数えるのではなく :last-child で選びましょう（項目が増えても最後だけに効きます）",
              },
            ],
          },
        ],
        hints: ["一覧の項目のうち、最後のものだけを選ぶ擬似クラスを使います", ".list li:last-child { border-bottom: 0; }"],
        solution: LIST_CSS(".list li:last-child {\n  border-bottom: 0;\n}\n"),
      },
    },
    {
      id: "nth-child-first-three",
      title: "最初の 3 つだけ: :nth-child(-n + 3)",
      explanation:
        "<p><code>:nth-child()</code> には <code>An + B</code> の式を書けます。<code>n</code> に 0・1・2…を順に入れた結果の番目が選ばれます。<code>:nth-child(-n + 3)</code> は 3・2・1 番目（4 番目以降は 0 以下になるので選ばれない）、つまり<b>最初の 3 つ</b>です。</p><p>反対に <code>:nth-child(n + 4)</code> は 4 番目以降、<code>:nth-child(3n)</code> は 3 の倍数番目です。<code>:nth-child(n + 2):nth-child(-n + 4)</code> のように 2 つ重ねると、2〜4 番目のような範囲も選べます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Selectors/:nth-child",
      viz: { concept: "none" },
      challenge: {
        starterHTML: RANKING_HTML,
        starterCSS: RANKING_CSS(""),
        task: "本の人気ランキングで、上位 3 位までに背景 #fff3c4 を付けよう（4 位以下はそのまま）。",
        snapshot: { props: ["background-color"] },
        validators: [
          {
            kind: "allOf",
            of: [
              { ...all(["k1", "k2", "k3"], "background-color", GOLD), message: "上位 3 位に背景（#fff3c4）が付いていません" },
              {
                ...all(["k4", "k5", "k6"], "background-color", CLEAR),
                message: "4 位以下にまで背景が付いています（-n + 3 は 1・2・3 番目だけを選びます）",
              },
              {
                kind: "sourceMatches",
                pattern: ":nth-child\\(\\s*-?\\d*n",
                message: "1・2・3 と順に書くのではなく、:nth-child(-n + 3) で「最初の 3 つ」を選びましょう（順位の数が変わっても書き直しが要りません）",
              },
            ],
          },
        ],
        hints: ["n に 0・1・2…を入れたとき、3・2・1 になる式を考えます", ".ranking li:nth-child(-n + 3) { background: #fff3c4; }"],
        solution: RANKING_CSS(".ranking li:nth-child(-n + 3) {\n  background: #fff3c4;\n}\n"),
      },
    },
  ],
};
