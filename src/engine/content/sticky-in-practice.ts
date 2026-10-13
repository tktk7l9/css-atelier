import type { Edge, ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Sticky boxes only move once their scroll container is scrolled, and the
// sandbox runs no script, so each preview opens at a fixed scroll position:
// the total lesson at the top (the default), where only a total stuck to the
// bottom edge is in view; the other two at the far end (column-reverse, as in
// the sticky track), where the season heading must sit right under the page
// header and the heading row must sit on the top edge. Checks are on box
// edges, so any CSS that sticks the boxes there passes.

const between = (a: string, b: string, edgeA: Edge, edgeB: Edge, px: number): ValidatorSpec => ({
  kind: "offset",
  a,
  b,
  edgeA,
  edgeB,
  min: px - 0.5,
  max: px + 0.5,
});

const START_AT_BOTTOM =
  "/* プレビューは、一番下までスクロールした位置から始まります\n   （.box の column-reverse はそのための仕掛けです。このままで OK） */\n";

const COLUMN_REVERSE_BOX =
  ".box {\n  display: flex;\n  flex-direction: column-reverse;\n  height: 240px;\n  overflow-y: auto;\n}\n";

const ORDER = ["春のコート", "夏のシャツ", "秋のニット", "冬のマフラー", "手袋", "帽子", "くつ下", "ベルト", "ストール", "かばん"];

const TOTAL_HTML =
  '<div data-id="box" class="box"><ul class="list">' +
  ORDER.map((t) => `<li>${t}</li>`).join("") +
  '</ul><p data-id="total" class="total">合計 ¥58,400</p></div>';

const TOTAL_CSS = (extra: string): string =>
  `.box {\n  height: 220px;\n  overflow-y: auto;\n  background: #f6f7fb;\n}\n.list {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n.list li {\n  padding: 8px 12px;\n  border-bottom: 1px solid #dde3f0;\n}\n/* スクロールしても下に残したい合計 */\n.total {\n${extra}  margin: 0;\n  padding: 10px 12px;\n  background: #2f5fd0;\n  color: #fff;\n  font-weight: 700;\n}\n`;

const SPRING = ["お花見の講座", "春の写真教室", "苗の植え方"];
const SUMMER = ["海辺の散歩", "夏の星座を見る", "うちわを作る", "朝顔を育てる", "かき氷の講座", "夏祭りの準備"];

const SEASONS_HTML =
  '<div data-id="box" class="box"><div class="page"><header data-id="header" class="header">講座一覧</header>' +
  `<section><h3 class="season">春</h3>${SPRING.map((t) => `<p>${t}</p>`).join("")}</section>` +
  `<section><h3 data-id="season" class="season">夏</h3>${SUMMER.map((t) => `<p>${t}</p>`).join("")}</section>` +
  "</div></div>";

const SEASONS_CSS = (top: string): string =>
  `${START_AT_BOTTOM}${COLUMN_REVERSE_BOX}/* ページの見出し（高さ 40px） */\n.header {\n  position: sticky;\n  top: 0;\n  height: 40px;\n  padding: 8px 12px;\n  background: #2f5fd0;\n  color: #fff;\n}\n/* 季節の見出し */\n.season {\n  position: sticky;\n  top: ${top};\n  margin: 0;\n  padding: 6px 12px;\n  background: #dbe4fb;\n  font-size: 15px;\n}\nsection p {\n  margin: 0;\n  padding: 8px 12px;\n  border-top: 1px solid #eef1f8;\n}\n`;

const NEWS = ["年末年始の営業について", "新しい講座を追加しました", "メンテナンスのお知らせ", "夏季休業のご案内", "料金改定のお知らせ", "アプリを更新しました", "店舗が移転します"];

const ROW_HTML =
  '<div data-id="box" class="box"><div class="page"><section>' +
  '<div data-id="row" class="title-row"><h3 data-id="head" class="head">お知らせ</h3><span data-id="more" class="more">一覧へ →</span></div>' +
  NEWS.map((t) => `<p>${t}</p>`).join("") +
  "</section></div></div>";

const ROW_CSS = (row: string): string =>
  `${START_AT_BOTTOM}${COLUMN_REVERSE_BOX}/* 見出しと「一覧へ」を横に並べる箱 */\n.title-row {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 6px 12px;\n  background: #dbe4fb;\n${row}}\n.head {\n  position: sticky;\n  top: 0;\n  margin: 0;\n  font-size: 16px;\n}\n.more {\n  font-size: 13px;\n  color: #234aa8;\n}\nsection p {\n  margin: 0;\n  padding: 8px 12px;\n  border-top: 1px solid #eef1f8;\n}\n`;

export const stickyInPracticeTrack: Track = {
  id: "sticky-in-practice",
  title: "スクロール追従の応用（下に貼り付ける・2 段の見出し・親の箱）",
  summary: "bottom: 0 で合計を下に貼り付け、top に上の見出しの高さを書いて 2 段に重ね、sticky が親の箱の中でしか動けないことを知って、横並びの箱ごと貼り付ける。",
  emoji: "🗒️",
  lessons: [
    {
      id: "sticky-bottom",
      title: "下に貼り付ける: position: sticky と bottom: 0",
      explanation:
        "<p><code>position: sticky</code> は、<code>top</code> だけでなく <code>bottom</code> でも使えます。<code>bottom: 0</code> にすると、スクロールする箱の<b>下端より下に行こうとしたとき</b>に、下端に貼り付きます。長い一覧の最後にある合計や「購入する」ボタンを、スクロールしなくても見えるようにできます。</p><p>一覧の最後までスクロールすると、合計は本来の位置（一覧のすぐ下）に戻ります。<code>top: 0</code> では、下にある要素は上に引き上げられません。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/bottom",
      viz: { concept: "none" },
      challenge: {
        starterHTML: TOTAL_HTML,
        starterCSS: TOTAL_CSS(""),
        task: "一覧の最後にある合計が、スクロールしないと見えません。合計を、スクロールする箱の下端に貼り付けよう。",
        snapshot: { props: ["position"] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "computedEquals", id: "total", prop: "position", value: "sticky" },
              { kind: "alignedEdge", ids: ["total", "box"], edge: "bottom", tol: 0.5 },
            ],
            message: "合計が、箱の下端に貼り付いていません（position: sticky と bottom: 0 で、下端より下に行こうとしたときに下端に貼り付きます。top: 0 では、下にある要素は引き上げられません）",
          },
        ],
        hints: ["sticky は bottom でも使えます", ".total { position: sticky; bottom: 0; }"],
        solution: TOTAL_CSS("  position: sticky;\n  bottom: 0;\n"),
      },
    },
    {
      id: "sticky-stacked",
      title: "2 段に重ねる: top に上の見出しの高さ",
      explanation:
        "<p>sticky の要素を 2 つ重ねて貼り付けるときは、下の段の <code>top</code> に、<b>上の段の高さ</b>を書きます。どちらも <code>top: 0</code> だと、同じ位置に貼り付いて重なり、あとから来た季節の見出しが、ページの見出しを隠してしまいます。</p><p>ページの見出しの高さは 40px なので、季節の見出しを <code>top: 40px</code> にすると、ページの見出しのすぐ下に並んで止まります。上の段の高さが変わるなら、高さをカスタムプロパティにして両方で使うと、ずれません。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/top",
      viz: { concept: "none" },
      challenge: {
        starterHTML: SEASONS_HTML,
        starterCSS: SEASONS_CSS("0"),
        task: "季節の見出し「夏」が、ページの見出し「講座一覧」に重なって隠しています。季節の見出しを、ページの見出しのすぐ下に貼り付けよう。",
        snapshot: { props: ["position"] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "computedEquals", id: "season", prop: "position", value: "sticky" },
              { kind: "alignedEdge", ids: ["header", "box"], edge: "top", tol: 0.5 },
              between("header", "season", "bottom", "top", 0),
            ],
            message: "季節の見出しが、ページの見出し（高さ 40px）のすぐ下に貼り付いていません（2 つとも top: 0 だと同じ位置で重なります。下の段は top に上の段の高さを書きます）",
          },
        ],
        hints: ["季節の見出しの top を、ページの見出しの高さにします", ".season { top: 40px; }"],
        solution: SEASONS_CSS("40px"),
      },
    },
    {
      id: "sticky-parent-box",
      title: "親の箱が小さいと止まらない: 横並びの箱ごと貼り付ける",
      explanation:
        "<p>sticky の要素が動けるのは、<b>親の箱（包含ブロック）の中</b>だけです。見出しと「一覧へ」を横に並べるために箱で包むと、見出しの親はその箱になり、箱は見出しと同じ高さしかないので、見出しは動けず、いっしょに流れていきます。</p><p>貼り付けたいのは見出しの行なので、包んだ箱（<code>.title-row</code>）のほうを sticky にします。箱の親は一覧全体なので、箱は一覧の中を動いて上端に止まり、見出しと「一覧へ」も横に並んだまま残ります。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/position",
      viz: { concept: "none" },
      challenge: {
        starterHTML: ROW_HTML,
        starterCSS: ROW_CSS(""),
        task: "見出し「お知らせ」に position: sticky を付けたのに、スクロールすると流れていきます。見出しと「一覧へ」の行を、横に並べたまま上端に貼り付けよう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "alignedEdge", ids: ["row", "box"], edge: "top", tol: 0.5 },
                  { kind: "insideContainer", id: "head", containerId: "row" },
                ],
                message: "見出しの行が、上端に貼り付いていません（sticky は親の箱の中でしか動けません。見出しの親の .title-row は見出しと同じ高さなので、動けずに流れていきます。.title-row のほうを sticky にします）",
              },
              {
                kind: "alignedEdge",
                ids: ["head", "more"],
                edge: "centery",
                tol: 2,
                message: "見出しと「一覧へ」が横に並んでいません（横に並べる箱はそのまま使います）",
              },
            ],
          },
        ],
        hints: ["見出しではなく、見出しを包んでいる箱を貼り付けます", ".title-row { position: sticky; top: 0; }"],
        solution: ROW_CSS("  position: sticky;\n  top: 0;\n"),
      },
    },
  ],
};
