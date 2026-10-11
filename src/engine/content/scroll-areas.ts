import type { Track } from "./types.js";

// Scroll areas are judged by the heights that a scroll container keeps and by
// the overflow values themselves. A rect is not clipped by its scroll
// container, so the wide table reads the same width whether or not its
// wrapper scrolls; that lesson therefore checks the wrapper's computed
// overflow-x, and that the table kept its own width (squeezing the columns is
// a different answer). Heights do not depend on whether the scrollbar is an
// overlay or takes room, so the two vertical lessons measure heights only.

const NOTICES = ["新しいコメントがあります", "ファイルが共有されました", "予定が変更されました", "パスワードを更新しました", "週次レポートが届きました", "メンバーが追加されました", "下書きを保存しました", "ログインがありました"];

const PANEL_HTML =
  '<div data-id="panel" class="panel"><h3>通知</h3><ul data-id="list" class="list">' +
  NOTICES.map((n) => `<li>${n}</li>`).join("") +
  "</ul></div>";

const PANEL_CSS = (extra: string): string =>
  `.panel {\n  width: 260px;\n  padding: 8px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.panel h3 {\n  margin: 0 0 4px;\n  font-size: 14px;\n}\n.list {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n${extra}}\n.list li {\n  padding: 4px 8px;\n  border-bottom: 1px solid #dbe4fb;\n  font-size: 14px;\n  line-height: 24px;\n}\n`;

const ROWS = [
  ["10/1", "コピー用紙 A4", "5 箱", "2,400 円", "12,000 円"],
  ["10/3", "ボールペン 黒", "20 本", "110 円", "2,200 円"],
];

const TABLE_HTML =
  '<div data-id="card" class="card"><div data-id="wrap" class="table-wrap"><table data-id="table" class="table">' +
  "<thead><tr><th>日付</th><th>品名</th><th>数量</th><th>単価</th><th>小計</th></tr></thead><tbody>" +
  ROWS.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("") +
  "</tbody></table></div></div>";

const TABLE_CSS = (extra: string): string =>
  `.card {\n  width: 280px;\n  padding: 12px;\n  border: 1px solid #9fb2e6;\n  border-radius: 8px;\n}\n.table {\n  border-collapse: collapse;\n  font-size: 14px;\n}\n.table th,\n.table td {\n  padding: 4px 8px;\n  border-bottom: 1px solid #dbe4fb;\n  white-space: nowrap;\n  text-align: left;\n}\n${extra}`;

const INBOX_HTML =
  '<div data-id="panel" class="panel"><header class="head">受信箱</header><div data-id="main" class="main"><ul data-id="list" class="list">' +
  Array.from({ length: 10 }, (_, i) => `<li>お知らせ ${i + 1}</li>`).join("") +
  "</ul></div></div>";

const INBOX_CSS = (extra: string): string =>
  `.panel {\n  display: flex;\n  flex-direction: column;\n  height: 240px;\n  border: 1px solid #9fb2e6;\n}\n.head {\n  flex: none;\n  height: 48px;\n  padding: 12px;\n  background: #18203a;\n  color: #fff;\n}\n.main {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n${extra}}\n.list {\n  flex: 1;\n  margin: 0;\n  padding: 0 12px;\n  overflow-y: auto;\n  list-style: none;\n}\n.list li {\n  padding: 4px 0;\n  line-height: 24px;\n}\n`;

const SCROLLS = "^(?:auto|scroll)$";
const NOT_VISIBLE = "^(?:auto|scroll|hidden)$";

export const scrollAreasTrack: Track = {
  id: "scroll-areas",
  title: "スクロールする領域（max-height・overflow-x・min-height: 0）",
  summary: "max-height と overflow で高さに上限を付けてスクロールさせ、広い表は横にスクロールさせ、flex の中では min-height: 0 で縮められるようにする。",
  emoji: "🧻",
  lessons: [
    {
      id: "max-height-scroll",
      title: "高さに上限を付けてスクロール: max-height と overflow-y",
      explanation:
        "<p>中身の多い一覧は、そのままだと縦に伸びてページを押し広げます。<code>max-height: 160px</code> で<b>高さの上限</b>を決め、<code>overflow-y: auto</code> を付けると、あふれた分は<b>一覧の中でスクロール</b>するようになります。</p><p><code>height</code> と違い <code>max-height</code> は上限なので、中身が少ないときは中身の高さのまま縮みます。<code>overflow-y: auto</code> は、あふれたときだけスクロールバーを出します（<code>scroll</code> は常に出す）。<code>hidden</code> にすると、あふれた分は切り取られて見えなくなり、スクロールもできません。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/max-height",
      viz: { concept: "none" },
      challenge: {
        starterHTML: PANEL_HTML,
        starterCSS: PANEL_CSS(""),
        task: "通知の一覧が長く、パネルが縦に伸びています。一覧（.list）の高さを 160px までにして、あふれた分は一覧の中でスクロールさせよう。",
        snapshot: { props: ["overflow-y", "max-height"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "sizeApprox",
                id: "list",
                h: 160,
                tol: 1,
                message: "一覧の高さが 160px になっていません（max-height で上限を決めます）",
              },
              {
                kind: "computedMatches",
                id: "list",
                prop: "overflow-y",
                pattern: NOT_VISIBLE,
                message: "高さは 160px ですが、あふれた通知が一覧の外にはみ出しています（overflow-y: auto で一覧の中をスクロールさせます）",
              },
              {
                kind: "computedMatches",
                id: "list",
                prop: "overflow-y",
                pattern: SCROLLS,
                message: "overflow-y: hidden では、あふれた通知が見えなくなり、スクロールもできません。auto にしましょう",
              },
              {
                kind: "computedEquals",
                id: "list",
                prop: "max-height",
                value: "160px",
                message: "height: 160px だと、通知が少ないときも 160px のままです。max-height で「最大 160px」にしましょう",
              },
            ],
          },
        ],
        hints: ["max-height で上限を決め、あふれたときだけスクロールバーを出す overflow-y の値を使います", ".list { max-height: 160px; overflow-y: auto; }"],
        solution: PANEL_CSS("  max-height: 160px;\n  overflow-y: auto;\n"),
      },
    },
    {
      id: "overflow-x-table",
      title: "広い表を横にスクロール: overflow-x: auto",
      explanation:
        "<p>列の多い表は、狭い画面では入れ物からはみ出し、ページ全体が横にずれてしまいます。表を <code>&lt;div class=\"table-wrap\"&gt;</code> のような入れ物で包み、入れ物に <code>overflow-x: auto</code> を付けると、<b>表の幅はそのまま</b>で、入れ物の中だけを横にスクロールできるようになります。</p><p>列を縮めて無理に収めると（<code>width: 100%</code> と <code>table-layout: fixed</code> など）、数字や品名が途中で折り返されたり切れたりします。<code>overflow-x: hidden</code> は右の列を切り取るだけで、スクロールもできません。<code>overflow-x</code> だけを <code>auto</code> にすると、<code>overflow-y</code> も <code>visible</code> から <code>auto</code> として扱われます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/overflow-x",
      viz: { concept: "none" },
      challenge: {
        starterHTML: TABLE_HTML,
        starterCSS: TABLE_CSS(""),
        task: "5 列の明細表が、幅 280px のカードの右からはみ出しています。表の列は縮めずに、表を包む .table-wrap の中で横にスクロールさせよう。",
        snapshot: { props: ["overflow-x"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "anyOf",
                of: [
                  { kind: "computedMatches", id: "wrap", prop: "overflow-x", pattern: NOT_VISIBLE },
                  { kind: "computedMatches", id: "card", prop: "overflow-x", pattern: NOT_VISIBLE },
                ],
                message: "表がカードの枠からはみ出したままです（表を包む .table-wrap を、横にスクロールする領域にします）",
              },
              {
                kind: "anyOf",
                of: [
                  { kind: "computedMatches", id: "wrap", prop: "overflow-x", pattern: SCROLLS },
                  { kind: "computedMatches", id: "card", prop: "overflow-x", pattern: SCROLLS },
                ],
                message: "overflow-x: hidden では右の列が切れて見えなくなり、スクロールもできません。auto にしましょう",
              },
              {
                kind: "offset",
                a: "wrap",
                b: "table",
                edgeA: "right",
                edgeB: "right",
                min: 20,
                message: "表の列が縮められています（列を折り返したり詰めたりせず、表の幅のままスクロールさせます）",
              },
            ],
          },
        ],
        hints: ["表ではなく、表を包む入れ物（.table-wrap）を横スクロールにします", ".table-wrap { overflow-x: auto; }"],
        solution: TABLE_CSS(".table-wrap {\n  overflow-x: auto;\n}\n"),
      },
    },
    {
      id: "flex-min-height",
      title: "flex の中でスクロールさせる: min-height: 0",
      explanation:
        "<p>flex のアイテムは、既定では<b>中身の最小の大きさより小さく縮みません</b>（<code>min-height: auto</code>）。縦に並べた flex の中にさらに flex を入れると、真ん中の箱が一覧の長さのまま伸び、<code>overflow-y: auto</code> を付けた一覧がスクロールせずに、パネルの外へはみ出してしまいます。</p><p>縮まない箱（ここでは <code>.main</code>）に <code>min-height: 0</code> を指定すると、中身より小さく縮めるようになり、残りの高さに収まった一覧の中でスクロールが始まります。横に並べた flex で同じことが起きたときは <code>min-width: 0</code> です。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/flex",
      viz: { concept: "none" },
      challenge: {
        starterHTML: INBOX_HTML,
        starterCSS: INBOX_CSS(""),
        task: "受信箱の一覧が、高さ 240px のパネルの下へはみ出しています（一覧には overflow-y: auto が付いているのに、スクロールしません）。一覧がパネルの中に収まり、中でスクロールするようにしよう。",
        snapshot: { props: ["min-height", "overflow-y"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "insideContainer", id: "main", containerId: "panel" },
                  { kind: "insideContainer", id: "list", containerId: "panel" },
                ],
                message: "一覧がパネル（240px）の下へはみ出しています（真ん中の .main が、中身より小さく縮めないためです）",
              },
              {
                kind: "anyOf",
                of: [
                  { kind: "computedEquals", id: "main", prop: "min-height", value: "0px" },
                  { kind: "computedMatches", id: "main", prop: "overflow-y", pattern: NOT_VISIBLE },
                ],
                message: "高さを固定するのではなく、.main に min-height: 0 を指定して縮められるようにしましょう（パネルの高さが変わっても合います）",
              },
            ],
          },
        ],
        hints: ["一覧ではなく、その外側の .main が縮まないのが原因です", ".main { min-height: 0; }"],
        solution: INBOX_CSS("  min-height: 0;\n"),
      },
    },
  ],
};
