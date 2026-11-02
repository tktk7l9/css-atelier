import type { Track } from "./types.js";

// Whether a scrollbar takes up room depends on the learner's platform (classic
// or overlay), and a scroll chain needs a real gesture, so these lessons read the
// computed values rather than the geometry.

const ITEMS = Array.from({ length: 12 }, (_, i) => `<li>項目 ${i + 1}</li>`).join("");

const LIST_HTML = `<ul data-id="list" class="list">${ITEMS}</ul>`;

const LIST_CSS =
  ".list {\n  height: 180px;\n  margin: 0;\n  padding: 8px;\n  overflow-y: auto;\n  border: 1px solid #c5cde0;\n  list-style: none;\n}\n";

const SHORT_HTML =
  '<div class="panes"><ul data-id="short" class="list"><li>項目 1</li><li>項目 2</li></ul>' +
  `<ul data-id="long" class="list">${ITEMS}</ul></div>`;

const SHORT_CSS = ".panes {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 12px;\n}\n" + LIST_CSS;

export const scrollPolishTrack: Track = {
  id: "scroll-polish",
  title: "スクロールの仕上げ（overscroll-behavior・scrollbar-gutter・scrollbar-color）",
  summary: "overscroll-behavior で端まで来たスクロールが背後へ伝わるのを止め、scrollbar-gutter でスクロールバーの場所を空けておき、scrollbar-width と scrollbar-color で太さと色を決める。",
  emoji: "🛝",
  lessons: [
    {
      id: "overscroll-behavior",
      title: "背後のページを動かさない: overscroll-behavior",
      explanation:
        "<p>ダイアログの中の一覧を最後までスクロールすると、そのまま<b>背後のページが動き出す</b>ことがあります。これをスクロールチェーンと呼びます。</p><p><code>overscroll-behavior: contain</code> をスクロールする箱に指定すると、端に着いたスクロールは外へ伝わりません（端で弾む効果は残ることがあります）。<code>none</code> は弾む効果も止めます。初期値は <code>auto</code> で、効くのはスクロールする箱だけです。</p><p>Chrome 63・Firefox 59・Safari 16 から使えます。ただし、スクロールできる中身がない箱には、Safari では効きません（Chrome 144・Firefox 150 からは効きます）。そのため MDN の Baseline には入っていません。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/overscroll-behavior",
      viz: { concept: "none" },
      challenge: {
        starterHTML: LIST_HTML,
        starterCSS: LIST_CSS,
        task: "一覧の端まで来たスクロールが背後のページへ伝わらないよう、.list に overscroll-behavior: contain を指定しよう。",
        snapshot: { props: ["overscroll-behavior-y"] },
        validators: [
          { kind: "computedMatches", id: "list", prop: "overscroll-behavior-y", pattern: "^(contain|none)$", message: ".list に overscroll-behavior: contain を指定しましょう（初期値の auto では、スクロールが外へ伝わります）" },
        ],
        hints: ["スクロールする箱そのものに書きます", ".list { overscroll-behavior: contain; }"],
        solution: LIST_CSS + ".list {\n  overscroll-behavior: contain;\n}\n",
      },
    },
    {
      id: "scrollbar-gutter",
      title: "バーの場所を空けておく: scrollbar-gutter",
      explanation:
        "<p>幅を取るスクロールバーの環境では、中身が増えてバーが出た瞬間に<b>中身の幅が縮み</b>、文字の位置がずれます。並んだ箱で、片方だけバーが出ると幅がそろいません。</p><p><code>scrollbar-gutter: stable</code> を指定すると、バーが出ていなくても<b>場所を空けておきます</b>（<code>overflow</code> が auto・scroll・hidden の箱で効きます）。両側を空けて中央をそろえる <code>stable both-edges</code> もあります。中身の上に重なるスクロールバーの環境では、もともと場所を取らないので変わりません。</p><p>Baseline 2024（2024 年 12 月から主要ブラウザの最新版で利用可: Chrome 94 / Firefox 97 / Safari 18.2 以降）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/scrollbar-gutter",
      viz: { concept: "none" },
      challenge: {
        starterHTML: SHORT_HTML,
        starterCSS: SHORT_CSS,
        task: "項目の多い一覧にだけスクロールバーが出ると、2 つの一覧で中身の幅が変わります。.list に scrollbar-gutter: stable を指定して、バーの場所を空けておこう。",
        snapshot: { props: ["scrollbar-gutter"] },
        validators: [
          { kind: "computedMatches", id: "short", prop: "scrollbar-gutter", pattern: "^stable", message: ".list に scrollbar-gutter: stable を指定しましょう（短い一覧にも、バーの場所を空けます）" },
        ],
        hints: ["両方の一覧に効くよう .list に書きます", ".list { scrollbar-gutter: stable; }"],
        solution: SHORT_CSS + ".list {\n  scrollbar-gutter: stable;\n}\n",
      },
    },
    {
      id: "scrollbar-color",
      title: "細く、色を合わせる: scrollbar-width と scrollbar-color",
      explanation:
        "<p><code>scrollbar-width: thin</code> はバーを細くします。値は <code>auto</code>・<code>thin</code>・<code>none</code> で、<code>none</code> はバーを隠すので、スクロールできることが分からなくなります（MDN も避けるよう勧めています）。</p><p><code>scrollbar-color: #2f5fd0 #eef1f8</code> は、1 つ目がつまみ、2 つ目が溝の色です。<code>scrollbar-width</code> は継承されませんが、<code>scrollbar-color</code> は継承されます。どちらかが auto 以外だと、非標準の <code>::-webkit-scrollbar</code> の指定は無視されます。</p><p><code>scrollbar-width</code> は Baseline 2024（Chrome 121 / Firefox 64 / Safari 18.2 以降）、<code>scrollbar-color</code> は Baseline 2025（2025 年 12 月から。Chrome 121 / Firefox 64 / Safari 26.2 以降）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/scrollbar-color",
      viz: { concept: "none" },
      challenge: {
        starterHTML: LIST_HTML,
        starterCSS: LIST_CSS,
        task: ".list のスクロールバーを細くして（scrollbar-width: thin）、つまみを #2f5fd0、溝を #eef1f8 にしよう。",
        snapshot: { props: ["scrollbar-width", "scrollbar-color"] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "computedEquals", id: "list", prop: "scrollbar-width", value: "thin", message: "" },
              { kind: "computedEquals", id: "list", prop: "scrollbar-color", value: "rgb(47, 95, 208) rgb(238, 241, 248)", message: "" },
            ],
            message: ".list に scrollbar-width: thin と scrollbar-color: #2f5fd0 #eef1f8 を指定しましょう（色は、つまみ、溝の順です）",
          },
        ],
        hints: ["色は、つまみ、溝の順に 2 つ書きます", ".list {\n  scrollbar-width: thin;\n  scrollbar-color: #2f5fd0 #eef1f8;\n}"],
        solution: LIST_CSS + ".list {\n  scrollbar-width: thin;\n  scrollbar-color: #2f5fd0 #eef1f8;\n}\n",
      },
    },
  ],
};
