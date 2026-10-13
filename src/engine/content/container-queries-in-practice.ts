import type { Track } from "./types.js";

// Container queries in practice are judged by computed values that only the
// intended container can produce: the headings' font sizes are 8% of their own
// card's 250px / 150px content box (clamped, and written with a container
// unit rather than one px value per card), the badge shows when the main
// column (not the card inside it) is wider than 400px, which a viewport media
// query cannot tell apart at 480px, and the collapsed sidebar is 160px wide
// while its query still applies. Keeping the card and the sidebar as
// containers is part of each check.

const UNITS_HTML =
  '<article class="card wide"><h3 data-id="t1">春の講座</h3><p>受付中です。</p></article>' +
  '<article class="card narrow"><h3 data-id="t2">夏の講座</h3><p>準備中です。</p></article>';

const UNITS_CSS = (size: string): string =>
  `/* カードはコンテナ */\n.card {\n  container-type: inline-size;\n  margin-bottom: 12px;\n  border-radius: 8px;\n  background: #dbe4fb;\n}\n.wide {\n  width: 250px;\n}\n.narrow {\n  width: 150px;\n}\n.card h3 {\n  margin: 0;\n  padding: 8px 12px 0;\n  font-size: ${size};\n}\n.card p {\n  margin: 0;\n  padding: 4px 12px 8px;\n  font-size: 14px;\n}\n`;

const NAME_HTML =
  '<div class="page"><nav class="side">目次</nav><main class="layout">' +
  '<article class="card"><h3 data-id="title">春の講座</h3><span data-id="badge" class="badge">受付中</span></article></main></div>';

const NAME_CSS = (layout: string, query: string): string =>
  `.page {\n  display: grid;\n  grid-template-columns: 80px 1fr;\n  gap: 12px;\n}\n.side {\n  padding: 8px;\n  background: #eef1f8;\n}\n/* 本文の列はコンテナ */\n.layout {\n  container-type: inline-size;\n${layout}}\n/* カードもコンテナ（見出しの大きさに使う） */\n.card {\n  container-type: inline-size;\n  width: 224px;\n  padding: 12px;\n  border-radius: 8px;\n  background: #dbe4fb;\n}\n.card h3 {\n  margin: 0 0 4px;\n  font-size: clamp(14px, 9cqi, 20px);\n}\n.badge {\n  display: none;\n  padding: 2px 8px;\n  border-radius: 999px;\n  background: #2f5fd0;\n  color: #fff;\n  font-size: 12px;\n}\n/* 本文の列が 400px より広いときだけ、バッジを出したい */\n@container ${query}(width > 400px) {\n  .badge {\n    display: inline-block;\n  }\n}\n`;

const SIDE_HTML =
  '<div class="row"><aside data-id="side" class="side"><div data-id="menu" class="menu">メニュー</div></aside>' +
  '<main class="main">春の講座の受付を始めました。</main></div>';

const SIDE_CSS = (extra: string): string =>
  `.row {\n  display: flex;\n  gap: 12px;\n}\n/* サイドバーをコンテナにした */\n.side {\n  container-type: inline-size;\n  padding: 8px;\n  border-radius: 8px;\n  background: #dbe4fb;\n${extra}}\n.main {\n  flex: 1;\n  padding: 8px;\n  background: #eef1f8;\n}\n/* サイドバーが 200px より狭いときは、文字を小さく */\n@container (width < 200px) {\n  .menu {\n    font-size: 14px;\n  }\n}\n`;

export const containerQueriesInPracticeTrack: Track = {
  id: "container-queries-in-practice",
  title: "コンテナクエリの応用（cqi・container-name・幅がつぶれる落とし穴）",
  summary: "cqi でカードの幅に合わせて文字を大きくし、container-name で入れ子の外側のコンテナを名指しし、コンテナにしてつぶれた幅を明示して直す。",
  emoji: "🥡",
  lessons: [
    {
      id: "cq-units",
      title: "カードの幅に合わせる: cqi 単位",
      explanation:
        "<p><code>1cqi</code> は、<b>いちばん近いコンテナの幅（インライン方向の大きさ）の 1%</b> です。<code>vw</code> が画面の幅を基準にするのに対し、<code>cqi</code> はカードそのものの幅を基準にするので、同じ部品を広い場所と狭い場所に置いても、それぞれの幅に合った大きさになります。</p><p><code>clamp(16px, 8cqi, 24px)</code> と書けば、カードの幅の 8% を、16px〜24px の範囲に収めた大きさです。近くにコンテナがないときは、画面（小さいビューポート）の大きさが基準になります。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Guides/Containment/Container_queries",
      viz: { concept: "none" },
      challenge: {
        starterHTML: UNITS_HTML,
        starterCSS: UNITS_CSS("clamp(16px, 4vw, 24px)"),
        task: "見出しの大きさが画面の幅で決まっていて、狭いカードでも同じ大きさです。見出しの文字の大きさを、それぞれのカードの幅の 8%（16px〜24px の範囲）にしよう。",
        snapshot: { props: ["font-size"] },
        validators: [
          {
            kind: "computedEquals",
            id: "t1",
            prop: "font-size",
            value: "20px",
            message: "広いカード（幅 250px）の見出しが 20px になっていません（8cqi は、カードの幅 250px の 8% です）",
          },
          {
            kind: "computedEquals",
            id: "t2",
            prop: "font-size",
            value: "16px",
            message: "狭いカード（幅 150px）の見出しが 16px になっていません（150px の 8% は 12px なので、clamp() の下限の 16px になります）",
          },
          {
            kind: "sourceMatches",
            pattern: "font-size\\s*:[^;}]*\\dcq[a-z]+\\b",
            message: "見出しの大きさに、cqi（コンテナの幅の 1%）を使いましょう（カードごとに px で決めると、カードの幅が変わったときに合わなくなります）",
          },
        ],
        hints: ["画面の幅の vw を、コンテナの幅の cqi に替えます", ".card h3 { font-size: clamp(16px, 8cqi, 24px); }"],
        solution: UNITS_CSS("clamp(16px, 8cqi, 24px)"),
      },
    },
    {
      id: "container-name",
      title: "外側のコンテナを名指しする: container-name",
      explanation:
        "<p>名前のない <code>@container (width &gt; 400px)</code> は、<b>いちばん近いコンテナ</b>の幅を調べます。コンテナが入れ子になっていると、本文の列の幅で切り替えたいのに、内側のカードの幅で判定されてしまいます。</p><p>外側の要素に <code>container-name: layout</code> で名前を付け、<code>@container layout (width &gt; 400px)</code> と書くと、名前の付いたコンテナの幅を調べます。<code>container: layout / inline-size</code> とまとめても書けます。カードは見出しの大きさ（<code>9cqi</code>）に使っているので、コンテナのままにします。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。プレビューは幅 560px（本文の列は 468px）で採点し、480px（本文の列は 388px）でも確かめます。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/container-name",
      viz: { concept: "none" },
      challenge: {
        viewport: 560,
        starterHTML: NAME_HTML,
        starterCSS: NAME_CSS("", ""),
        task: "本文の列（.layout）が 400px より広いときに「受付中」のバッジを出したいのに、表示されません。@container が本文の列の幅を調べるようにしよう（カードはコンテナのままにします）。",
        snapshot: { props: ["display", "font-size"] },
        validators: [
          {
            kind: "computedEquals",
            id: "title",
            prop: "font-size",
            value: "18px",
            message: "カードの見出しが 18px ではなくなりました（見出しの 9cqi はカードの幅を基準にしているので、.card はコンテナのままにします）",
          },
          {
            kind: "computedMatches",
            id: "badge",
            prop: "display",
            pattern: "^(?!none$)",
            message: "幅 560px（本文の列は 468px）で、バッジが表示されていません（名前のない @container は、いちばん近いコンテナ＝カード（幅 200px）を調べます。.layout に container-name を付け、@container のあとにその名前を書きます）",
          },
        ],
        states: [
          {
            viewport: 480,
            validators: [
              {
                kind: "computedEquals",
                id: "badge",
                prop: "display",
                value: "none",
                message: "幅 480px（本文の列は 388px）でも、バッジが表示されています（@media は画面の幅を調べます。本文の列の幅で切り替えるには、名前を付けた @container を使います）",
              },
            ],
          },
        ],
        hints: [".layout に container-name を付け、@container のあとにその名前を書きます", ".layout { container-name: layout; } @container layout (width > 400px) { … }"],
        solution: NAME_CSS("  container-name: layout;\n", "layout "),
      },
    },
    {
      id: "inline-size-zero",
      title: "コンテナにしたら幅がつぶれた: 幅を明示する",
      explanation:
        "<p><code>container-type: inline-size</code> を付けた要素は、<b>中身を見ずに幅を決める</b>ようになります（インラインサイズの封じ込め）。親の幅いっぱいに広がるブロック要素なら困りませんが、flex のアイテムのように<b>中身の幅から大きさが決まる要素</b>は、中身の幅が 0 として扱われ、幅がつぶれて中身がはみ出します。</p><p>コンテナの大きさは、親いっぱいに広がるなどの<b>まわりの状況か、明示した指定</b>で決まる必要があります。コンテナにする要素には、<code>width</code> や <code>flex-basis</code> で幅を決めておきます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/container-type",
      viz: { concept: "none" },
      challenge: {
        starterHTML: SIDE_HTML,
        starterCSS: SIDE_CSS(""),
        task: "サイドバーをコンテナにしたら、幅がつぶれて「メニュー」がはみ出しました。サイドバーをコンテナのまま、幅 160px にしよう。",
        snapshot: { props: ["font-size"] },
        validators: [
          {
            kind: "sizeApprox",
            id: "side",
            w: 160,
            tol: 1,
            message: "サイドバーの幅が 160px になっていません（container-type: inline-size にした要素は、中身から幅を決められません。幅を明示します）",
          },
          {
            kind: "computedEquals",
            id: "menu",
            prop: "font-size",
            value: "14px",
            message: "メニューの文字が 14px ではありません（サイドバーはコンテナのままにして、@container の指定が効くようにします）",
          },
        ],
        hints: ["中身から幅を決められないので、幅を指定します", ".side { width: 160px; }"],
        solution: SIDE_CSS("  width: 160px;\n"),
      },
    },
  ],
};
