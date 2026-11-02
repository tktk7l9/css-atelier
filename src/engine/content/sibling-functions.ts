import type { ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// sibling-index() and sibling-count() are judged by what they produce: the
// bars' widths, the animation delays read back from getComputedStyle, and where
// the dots of the two rings land around their centre.

const SUPPORT =
  "Baseline 2026（2026 年 8 月から主要ブラウザの最新版で利用可: Chrome 138 / Firefox 154 / Safari 26.2 以降）。古いブラウザでは宣言ごと無視されます。";

const STEPS = ["受付", "確認", "発送", "完了"];

const BARS_HTML =
  '<ol class="bars">' + STEPS.map((t, i) => `<li data-id="b${i + 1}">${t}</li>`).join("") + "</ol>";

const BARS_CSS =
  ".bars {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.bars li {\n  width: 100px;\n  margin-bottom: 6px;\n  padding: 4px 8px;\n  background: #dbe4fb;\n}\n";

const NEWS = ["新着のお知らせ", "メンテナンスの予定", "料金の改定", "利用規約の更新"];

const FADE_HTML =
  '<ul class="news">' + NEWS.map((t, i) => `<li data-id="n${i + 1}" class="item">${t}</li>`).join("") + "</ul>";

const FADE_CSS =
  "@keyframes fade-in {\n  from {\n    opacity: 0;\n  }\n}\n.news {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.item {\n  margin-bottom: 6px;\n  padding: 4px 8px;\n  background: #dbe4fb;\n  animation: fade-in 0.4s both;\n}\n";

const dots = (ring: string, n: number): string =>
  Array.from({ length: n }, (_, i) => `<span data-id="${ring}${i + 1}" class="dot"></span>`).join("");

const RING_HTML =
  `<div class="rings"><div data-id="r4" class="ring">${dots("a", 4)}</div>` +
  `<div data-id="r3" class="ring">${dots("b", 3)}</div></div>`;

const RING_CSS = (dot: string): string =>
  `.rings {\n  display: flex;\n  gap: 24px;\n}\n.ring {\n  position: relative;\n  width: 120px;\n  height: 120px;\n  border-radius: 50%;\n  background: #eef1f8;\n}\n.dot {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  width: 16px;\n  height: 16px;\n  margin: -8px;\n  border-radius: 50%;\n  background: #2f5fd0;\n${dot}}\n`;

/** The box of `dot` sits where a dot centred (dx, dy) from the middle of its 120px ring would. */
const placed = (ring: string, dot: string, dx: number, dy: number): ValidatorSpec[] => {
  const near = (edgeA: "left" | "top", edgeB: "left" | "top", d: number): ValidatorSpec => ({
    kind: "offset",
    a: ring,
    b: dot,
    edgeA,
    edgeB,
    // The bounding box of a rotated 16px square is up to about 22.6px wide.
    min: 60 + d - 14,
    max: 60 + d - 5,
  });
  return [near("left", "left", dx), near("top", "top", dy)];
};

export const siblingFunctionsTrack: Track = {
  id: "sibling-functions",
  title: "兄弟の番号を計算に使う（sibling-index()・sibling-count()）",
  summary: "sibling-index() で自分が何番目かを calc() に入れて幅や遅れを変え、sibling-count() で兄弟の数に合わせて円の上に等間隔に並べる。",
  emoji: "🪢",
  lessons: [
    {
      id: "sibling-index-width",
      title: "何番目かを数値で使う: sibling-index()",
      explanation:
        "<p><code>:nth-child()</code> は、何番目かで<b>要素を選ぶ</b>セレクタです。1 つずつ幅を変えたいと、項目の数だけルールを書くことになります。</p><p><code>sibling-index()</code> は、自分が兄弟の中で何番目かを<b>整数として返す関数</b>です。<code>:nth-child()</code> と同じく <b>1 から</b>数えます。整数なので <code>calc()</code> の中で使え、<code>width: calc(60px + sibling-index() * 40px)</code> の 1 行で、項目が増えても 1 段ずつ長くなります。<code>counter()</code> も番号を作れますが、返すのは文字列なので、計算には使えません。</p><p>" +
        SUPPORT +
        "</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/sibling-index",
      viz: { concept: "none" },
      challenge: {
        starterHTML: BARS_HTML,
        starterCSS: BARS_CSS,
        task: "4 本の帯の幅を、順に 100px・140px・180px・220px にして、階段のように 1 段ずつ長くしよう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "sizeApprox", id: "b1", w: 100, message: "" },
              { kind: "sizeApprox", id: "b2", w: 140, message: "" },
              { kind: "sizeApprox", id: "b3", w: 180, message: "" },
              { kind: "sizeApprox", id: "b4", w: 220, message: "" },
            ],
            message: "帯の幅が 100px・140px・180px・220px になっていません（sibling-index() は 1 から数えます。1 本目が 100px なので calc(60px + sibling-index() * 40px)）",
          },
        ],
        hints: ["sibling-index() は 1、2、3、4 を返します", ".bars li { width: calc(60px + sibling-index() * 40px); }"],
        solution: BARS_CSS.replace("width: 100px;", "width: calc(60px + sibling-index() * 40px);"),
      },
    },
    {
      id: "sibling-index-delay",
      title: "1 つずつ遅らせる: animation-delay と sibling-index()",
      explanation:
        "<p>一覧の項目を上から順に現れさせるには、項目ごとの <code>animation-delay</code> を少しずつずらします。<code>calc((sibling-index() - 1) * 100ms)</code> と書けば、1 番目が 0 秒、2 番目が 0.1 秒、3 番目が 0.2 秒です。1 番目を待たせないよう、<b>1 を引いて</b> 0 から始めます。</p><p><code>calc()</code> の中では、整数に時間を掛けると時間になります。項目が増えても、このルールを書き足す必要はありません。</p><p>" +
        SUPPORT +
        "</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/sibling-index",
      viz: { concept: "none" },
      challenge: {
        starterHTML: FADE_HTML,
        starterCSS: FADE_CSS,
        task: "お知らせが同時に現れています。.item に animation-delay を足して、1 番目は待たずに、2 番目以降を 0.1 秒ずつ遅らせよう（0・0.1・0.2・0.3 秒）。",
        snapshot: { props: ["animation-delay"] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "computedEquals", id: "n1", prop: "animation-delay", value: "0s", message: "" },
              { kind: "computedEquals", id: "n2", prop: "animation-delay", value: "0.1s", message: "" },
              { kind: "computedEquals", id: "n3", prop: "animation-delay", value: "0.2s", message: "" },
              { kind: "computedEquals", id: "n4", prop: "animation-delay", value: "0.3s", message: "" },
            ],
            message: "遅れが 0・0.1・0.2・0.3 秒になっていません（sibling-index() は 1 から数えるので、calc((sibling-index() - 1) * 100ms)）",
          },
        ],
        hints: ["1 番目の遅れを 0 にするには、sibling-index() から 1 を引きます", ".item { animation-delay: calc((sibling-index() - 1) * 100ms); }"],
        solution: FADE_CSS.replace("animation: fade-in 0.4s both;", "animation: fade-in 0.4s both;\n  animation-delay: calc((sibling-index() - 1) * 100ms);"),
      },
    },
    {
      id: "sibling-count-ring",
      title: "数に合わせて等分する: sibling-count()",
      explanation:
        "<p><code>sibling-count()</code> は、親の直下の子の数（自分も含む）を<b>整数で返す関数</b>です。<code>360deg / sibling-count()</code> と書くと、一周を子の数で等分した角度になります。そこに <code>sibling-index()</code> を掛ければ、子が何個あっても等間隔です。</p><p>真ん中に重ねた点を <code>transform: rotate(角度) translateY(-44px)</code> で動かします。点を回してから、回した向きの「上」へ進めるので、円の上に並びます。<code>:nth-child()</code> で角度を書くと、数が変わるたびに書き直しです。</p><p>" +
        SUPPORT +
        "</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/sibling-count",
      viz: { concept: "none" },
      challenge: {
        starterHTML: RING_HTML,
        starterCSS: RING_CSS(""),
        task: "点が 4 個の円と 3 個の円があります。1 つのルールで、どちらの点も中心から 44px 離して、円の上に等間隔に並べよう。最後の点は真上に来ます。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [...placed("r4", "a4", 0, -44), ...placed("r4", "a1", 44, 0), ...placed("r4", "a2", 0, 44), ...placed("r3", "b3", 0, -44), ...placed("r3", "b1", 38, 22)].map((s) => ({ ...s, message: "" })),
            message: "点が円の上に等間隔に並んでいません（.dot に transform: rotate(calc(360deg / sibling-count() * sibling-index())) translateY(-44px)）",
          },
        ],
        hints: ["一周を子の数で割ると 1 つぶんの角度です: 360deg / sibling-count()", "transform: rotate(calc(360deg / sibling-count() * sibling-index())) translateY(-44px);"],
        solution: RING_CSS("  transform: rotate(calc(360deg / sibling-count() * sibling-index())) translateY(-44px);\n"),
      },
    },
  ],
};
