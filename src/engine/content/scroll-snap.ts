import type { Track } from "./types.js";

// Snap positions only show while scrolling, which a static snapshot cannot
// replay, so these lessons check the computed snap properties. The previews
// are real scroll containers the learner can scroll to feel the effect.
const SLIDES_HTML =
  '<div data-id="track" class="track"><div data-id="s1" class="slide">1</div><div data-id="s2" class="slide">2</div><div data-id="s3" class="slide">3</div><div data-id="s4" class="slide">4</div></div>';

const SLIDES_BASE =
  ".track {\n  display: flex;\n  gap: 12px;\n  width: 260px;\n  overflow-x: auto;\n  padding: 8px 0;\n}\n.slide {\n  flex: 0 0 200px;\n  height: 120px;\n  display: grid;\n  place-items: center;\n  font-size: 32px;\n  color: #fff;\n  background: #2f5fd0;\n  border-radius: 10px;\n}\n";

const LIST_HTML =
  '<div data-id="list" class="list"><header class="bar">見出し（固定）</header><section class="item">1</section><section class="item">2</section><section class="item">3</section><section class="item">4</section></div>';

const LIST_CSS = (extra: string): string =>
  `.list {\n  height: 220px;\n  width: 240px;\n  overflow-y: auto;\n  scroll-snap-type: y mandatory;\n${extra}}\n.bar {\n  position: sticky;\n  top: 0;\n  height: 48px;\n  padding: 12px;\n  color: #fff;\n  background: #18203a;\n}\n.item {\n  scroll-snap-align: start;\n  height: 160px;\n  padding: 12px;\n  border-bottom: 1px solid #dbe4fb;\n  font-size: 24px;\n}\n`;

export const scrollSnapTrack: Track = {
  id: "scroll-snap",
  title: "スクロールスナップ",
  summary: "スクロールが止まる位置を、要素の端や中央にぴたりと合わせる。",
  emoji: "🧲",
  lessons: [
    {
      id: "snap-type-align",
      title: "カルーセルを止める: scroll-snap-type と scroll-snap-align",
      explanation:
        "<p>スクロールスナップは 2 か所に書きます。スクロールする<b>コンテナ</b>に <code>scroll-snap-type</code> で方向と強さを、<b>子要素</b>に <code>scroll-snap-align</code> で止まる位置（<code>start</code> / <code>center</code> / <code>end</code>）を指定します。</p><p><code>scroll-snap-type: x mandatory</code> なら横スクロールが必ずどれかの子にぴたりと止まり、<code>proximity</code> なら近くで止めたときだけ吸い付きます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Guides/Scroll_snap/Basic_concepts",
      viz: { concept: "none" },
      challenge: {
        starterHTML: SLIDES_HTML,
        starterCSS: SLIDES_BASE,
        task: "横スクロールのカルーセルが、必ずスライドの左端でぴたりと止まるようにしよう（.track に x mandatory、.slide に start）。プレビューを横にスクロールして確かめられます。",
        snapshot: { props: ["scroll-snap-type", "scroll-snap-align"] },
        validators: [
          { kind: "computedEquals", id: "track", prop: "scroll-snap-type", value: "x mandatory", message: ".track に scroll-snap-type: x mandatory を指定しましょう" },
          { kind: "computedMatches", id: "s1", prop: "scroll-snap-align", pattern: "^start( start)?$", message: ".slide に scroll-snap-align: start を指定しましょう" },
          { kind: "computedMatches", id: "s4", prop: "scroll-snap-align", pattern: "^start( start)?$", message: "すべての .slide に scroll-snap-align: start を指定しましょう" },
        ],
        hints: ["コンテナ側: scroll-snap-type: x mandatory;", "子要素側: scroll-snap-align: start;"],
        solution: SLIDES_BASE.replace("  padding: 8px 0;\n", "  padding: 8px 0;\n  scroll-snap-type: x mandatory;\n").replace(
          "  border-radius: 10px;\n",
          "  border-radius: 10px;\n  scroll-snap-align: start;\n",
        ),
      },
    },
    {
      id: "snap-padding",
      title: "固定ヘッダーの下に止める: scroll-padding",
      explanation:
        "<p>スナップ位置はコンテナの端が基準なので、<code>position: sticky</code> の見出しがあると、止まった項目の頭が<b>見出しの下に隠れて</b>しまいます。</p><p>コンテナに <code>scroll-padding-top: 48px</code> を指定すると、スナップの基準になる領域（スナップポート）が上から 48px 内側に縮み、項目は見出しのすぐ下で止まります。子要素の側で余白を取る <code>scroll-margin</code> もあります。Baseline: 広く利用可能。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/scroll-padding",
      viz: { concept: "none" },
      challenge: {
        starterHTML: LIST_HTML,
        starterCSS: LIST_CSS(""),
        task: "縦にスナップするリストで、各項目が高さ 48px の固定見出しの下に隠れず、そのすぐ下で止まるようにしよう（.list に scroll-padding-top）。",
        snapshot: { props: ["scroll-padding-top"] },
        validators: [
          { kind: "computedEquals", id: "list", prop: "scroll-padding-top", value: "48px", message: ".list の scroll-padding-top を見出しと同じ 48px にしましょう" },
        ],
        hints: ["余白はスクロールするコンテナ（.list）の側に指定します", "scroll-padding-top: 48px;"],
        solution: LIST_CSS("  scroll-padding-top: 48px;\n"),
      },
    },
  ],
};
