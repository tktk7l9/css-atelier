import type { ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Tables are judged by where their cells land: collapsed borders make
// neighbouring cells touch (no border-spacing between them), a fixed layout
// gives the three columns the same width however long their text is, and a
// caption moved to the bottom starts below the last row.

const PRICES_HTML =
  '<table data-id="sheet" class="sheet"><thead><tr><th data-id="h1">品名</th><th data-id="h2">数</th><th data-id="h3">単価</th></tr></thead>' +
  '<tbody><tr><td data-id="a1">りんご</td><td data-id="a2">12</td><td data-id="a3">150 円</td></tr>' +
  '<tr><td data-id="b1">みかん</td><td data-id="b2">30</td><td data-id="b3">80 円</td></tr></tbody></table>';

const PRICES_CSS = (extra: string): string =>
  `.sheet {\n  font-size: 14px;\n${extra}}\n.sheet th,\n.sheet td {\n  width: 80px;\n  padding: 4px 8px;\n  border: 1px solid #9fb2e6;\n  text-align: left;\n}\n.sheet th {\n  background: #eef1f8;\n}\n`;

const SALES_ROWS =
  '<thead><tr><th data-id="h1">品名</th><th data-id="h2">説明</th><th data-id="h3">数</th></tr></thead>' +
  '<tbody><tr><td data-id="a1">りんご</td><td data-id="a2">青森県産のふじ。甘みが強く、日持ちします。</td><td data-id="a3">12</td></tr>' +
  '<tr><td data-id="b1">みかん</td><td data-id="b2">愛媛県産。</td><td data-id="b3">30</td></tr></tbody>';

const SALES_HTML = `<div data-id="wrap" class="wrap"><table data-id="sheet" class="sheet">${SALES_ROWS}</table></div>`;

const CELL_CSS =
  ".sheet th,\n.sheet td {\n  padding: 4px 8px;\n  border: 1px solid #9fb2e6;\n  text-align: left;\n  vertical-align: top;\n}\n.sheet th {\n  background: #eef1f8;\n}\n";

const SALES_CSS = (extra: string): string =>
  `.wrap {\n  max-width: 360px;\n}\n.sheet {\n  font-size: 14px;\n  border-collapse: collapse;\n${extra}}\n${CELL_CSS}`;

const CAPTIONED_HTML = `<div data-id="wrap" class="wrap"><table data-id="sheet" class="sheet"><caption data-id="cap">4 月の売れ筋（単位: 個）</caption>${SALES_ROWS}</table></div>`;

const CAPTIONED_CSS = (extra: string): string =>
  `.wrap {\n  max-width: 360px;\n}\n.sheet {\n  width: 100%;\n  table-layout: fixed;\n  font-size: 14px;\n  border-collapse: collapse;\n${extra}}\n.sheet caption {\n  padding: 4px 0;\n  font-weight: 700;\n  text-align: left;\n}\n${CELL_CSS}`;

/** `b` begins no more than 1px after `a` ends: the two cells touch. */
const touching = (a: string, b: string, axis: "x" | "y"): ValidatorSpec => ({
  kind: "offset",
  a,
  b,
  edgeA: axis === "x" ? "right" : "bottom",
  edgeB: axis === "x" ? "left" : "top",
  max: 1,
});

const sameWidth = (a: string, b: string): ValidatorSpec => ({ kind: "relativeSize", a, b, ratio: 1, dim: "w" });

export const tablesTrack: Track = {
  id: "tables",
  title: "表のレイアウト（table）",
  summary: "border-collapse で枠線を 1 本に、table-layout: fixed で列幅をそろえ、caption-side で表題を下に。",
  emoji: "📊",
  lessons: [
    {
      id: "table-collapse",
      title: "枠線を 1 本にまとめる: border-collapse",
      explanation:
        "<p>表のセルに <code>border</code> を付けると、既定ではセルごとに<b>独立した枠線</b>が描かれ、隣のセルとの間に <code>border-spacing</code>（既定 2px）のすき間が空きます。線が二重に見えるのはそのためです。</p><p><code>border-collapse: collapse</code> を表（table）に指定すると、隣り合うセルの枠線が<b>1 本に重ねられ</b>、すき間もなくなります。<code>border-spacing: 0</code> にするだけではセルが触れ合うだけで、線は 2 本のまま（2px の太さ）です。collapse では border-spacing と border-radius は効かなくなり、線の太さや種類が違うときは目立つほうの線が優先されます。</p><p>主要ブラウザすべてで古くから使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/border-collapse",
      viz: { concept: "none" },
      challenge: {
        starterHTML: PRICES_HTML,
        starterCSS: PRICES_CSS(""),
        task: "価格表のセルの枠線が二重になり、セルの間にすき間が空いています。隣り合う枠線を 1 本にまとめよう。",
        snapshot: { props: ["border-collapse"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [touching("h1", "h2", "x"), touching("h2", "h3", "x"), touching("h1", "a1", "y"), touching("a1", "b1", "y")],
                message: "隣り合うセルの間にすき間があり、枠線が離れて二重になっています",
              },
              {
                kind: "computedEquals",
                id: "sheet",
                prop: "border-collapse",
                value: "collapse",
                message: "border-spacing: 0 ではセルが触れるだけで線は二重のままです。border-collapse: collapse で、隣り合う枠線を 1 本にまとめましょう",
              },
            ],
          },
        ],
        hints: ["セルではなく、表（table）に指定します", ".sheet { border-collapse: collapse; }"],
        solution: PRICES_CSS("  border-collapse: collapse;\n"),
      },
    },
    {
      id: "table-fixed",
      title: "列幅をそろえる: table-layout: fixed",
      explanation:
        "<p>表の列幅は、既定（<code>table-layout: auto</code>）では<b>すべてのセルの中身を見てから</b>決まります。長い文のある列は広がり、短い列は縮むので、中身しだいで列幅が変わり、行が多いほど描画にも時間がかかります。</p><p><code>table-layout: fixed</code> は、<b>表の幅と最初の行</b>（列幅の指定があればそれ、なければ均等）だけで列幅を決めます。後の行にどんなに長い中身があっても列は動かず、描画も速くなります。ただし、<b>表の幅が決まっていないと効きません</b>。<code>width: 100%</code> のように表の幅を指定してください。長い単語が列からはみ出すときは <code>overflow-wrap: anywhere</code> を組み合わせます。</p><p>主要ブラウザすべてで古くから使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/table-layout",
      viz: { concept: "none" },
      challenge: {
        starterHTML: SALES_HTML,
        starterCSS: SALES_CSS(""),
        task: "売上表の「説明」の列が長い文のぶん広がり、「品名」と「数」の列が狭くなっています。表を枠（.wrap）の幅いっぱいにして、3 つの列の幅をそろえよう。",
        snapshot: { props: ["table-layout"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [sameWidth("h1", "h2"), sameWidth("h2", "h3")],
                message: "3 つの列の幅がそろっていません（auto では長い文のある列が広がります。table-layout: fixed は幅の決まった表にだけ効くので、width: 100% も必要です）",
              },
              {
                kind: "computedEquals",
                id: "sheet",
                prop: "table-layout",
                value: "fixed",
                message: "列ごとに width を書いてもそろいますが、table-layout: fixed を使いましょう（最初の行だけで列幅が決まり、長い中身があっても列が動かず、描画も速くなります）",
              },
            ],
          },
        ],
        hints: ["table-layout: fixed は、表の幅が決まっているときだけ効きます", ".sheet { width: 100%; table-layout: fixed; }"],
        solution: SALES_CSS("  width: 100%;\n  table-layout: fixed;\n"),
      },
    },
    {
      id: "table-caption",
      title: "表題を下に置く: caption-side",
      explanation:
        "<p>表の <code>&lt;caption&gt;</code> は表題で、既定では表の<b>上</b>に表示されます（<code>caption-side: top</code>）。出典や注記のように表の下に置きたいときは <code>caption-side: bottom</code> です。</p><p>caption-side は<b>継承される</b>ので、表（table）に指定すれば中の caption に効きますし、caption 自身に指定してもかまいません。<code>margin</code> や <code>transform</code> で動かすのと違い、表の高さに表題が含まれたまま、位置だけが入れ替わります。</p><p>主要ブラウザすべてで古くから使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/caption-side",
      viz: { concept: "none" },
      challenge: {
        starterHTML: CAPTIONED_HTML,
        starterCSS: CAPTIONED_CSS(""),
        task: "売上表の表題「4 月の売れ筋」が表の上にあります。注記として、表の下に置こう。",
        snapshot: { props: ["caption-side"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "order",
                ids: ["b1", "cap"],
                axis: "y",
                message: "表題（caption）が表の下にありません（上に出たままです）",
              },
              {
                kind: "computedEquals",
                id: "cap",
                prop: "caption-side",
                value: "bottom",
                message: "caption-side: bottom で表題を下側に置きましょう（表に指定しても、継承されて caption に効きます）",
              },
            ],
          },
        ],
        hints: ["caption-side は表にも caption にも指定できます（継承されます）", ".sheet { caption-side: bottom; }"],
        solution: CAPTIONED_CSS("  caption-side: bottom;\n"),
      },
    },
  ],
};
