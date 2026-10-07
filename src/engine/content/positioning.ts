import type { Edge, ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Positioned boxes are judged by where they land: the ribbon in its own card's
// top-right corner, the cover over the whole card, the close button in the top
// corner at the end of the line. The boxes sit flush with the edges (all
// offsets are 0), so the edges line up exactly on any machine. Two lessons
// also want the property they teach (position: relative on the card, inset),
// since other tricks can move the boxes to the same places.

/** `id` sits flush with `containerId` along each of the given edges. */
const flush = (id: string, containerId: string, edges: readonly Edge[]): ValidatorSpec[] =>
  edges.map((edge): ValidatorSpec => ({ kind: "alignedEdge", ids: [id, containerId], edge }));

const CARDS_HTML =
  '<div class="cards">' +
  '<div data-id="card1" class="card"><span data-id="r1" class="ribbon">NEW</span><h3 class="name">ハーブティー</h3><p class="price">1,200 円</p></div>' +
  '<div data-id="card2" class="card"><span data-id="r2" class="ribbon">NEW</span><h3 class="name">はちみつ</h3><p class="price">980 円</p></div>' +
  "</div>";

const CARDS_CSS = (extra: string): string =>
  `.cards {\n  display: grid;\n  grid-template-columns: repeat(2, 180px);\n  gap: 16px;\n}\n.card {\n  padding: 16px;\n  border-radius: 8px;\n  background: #eef1f8;\n${extra}}\n.name {\n  margin: 0 0 4px;\n  font-size: 16px;\n}\n.price {\n  margin: 0;\n  color: #4a5578;\n}\n/* カードの右上の角に重ねる */\n.ribbon {\n  position: absolute;\n  top: 0;\n  right: 0;\n  padding: 2px 10px;\n  border-radius: 0 8px 0 8px;\n  color: #fff;\n  background: #d93636;\n  font-size: 12px;\n  font-weight: 700;\n  line-height: 20px;\n}\n`;

const ITEM_HTML =
  '<div data-id="item" class="item"><div class="photo"></div><h3 class="name">季節のジャム</h3><p class="price">1,500 円</p><div data-id="cover" class="cover">売り切れ</div></div>';

const ITEM_CSS = (place: string): string =>
  `.item {\n  position: relative;\n  width: 220px;\n  padding: 12px;\n  border-radius: 8px;\n  background: #eef1f8;\n}\n.photo {\n  height: 100px;\n  border-radius: 6px;\n  background: linear-gradient(135deg, #ffd27a, #ff8a65);\n}\n.name {\n  margin: 8px 0 2px;\n  font-size: 16px;\n}\n.price {\n  margin: 0;\n  color: #4a5578;\n}\n/* 売り切れの商品を、白い半透明の覆いで隠す */\n.cover {\n  position: absolute;\n${place}  display: grid;\n  place-items: center;\n  border-radius: 8px;\n  color: #d93636;\n  background: rgb(255 255 255 / 0.75);\n  font-size: 20px;\n  font-weight: 700;\n}\n`;

const NOTES_HTML =
  '<div data-id="ja" class="note" lang="ja" dir="ltr"><p>新着メッセージが 3 件あります</p><span data-id="close-ja" class="close">×</span></div>' +
  '<div data-id="ar" class="note" lang="ar" dir="rtl"><p>لديك ٣ رسائل جديدة</p><span data-id="close-ar" class="close">×</span></div>';

const NOTES_CSS = (place: string): string =>
  `.note {\n  position: relative;\n  width: 320px;\n  margin-bottom: 12px;\n  padding: 12px 40px;\n  border-radius: 8px;\n  background: #eef1f8;\n}\n.note p {\n  margin: 0;\n  line-height: 24px;\n}\n/* 閉じるボタンを、行の終わり側の上の角に置く */\n.close {\n  position: absolute;\n${place}  width: 32px;\n  height: 32px;\n  color: #4a5578;\n  font-size: 18px;\n  line-height: 32px;\n  text-align: center;\n}\n`;

export const positioningTrack: Track = {
  id: "positioning",
  title: "絶対配置（absolute・inset）",
  summary: "position: absolute と inset・論理的な inset で、要素を基準の箱の角や全体にぴたりと重ねる。",
  emoji: "📍",
  lessons: [
    {
      id: "position-relative",
      title: "基準の箱を決める: position: relative",
      explanation:
        "<p><code>position: absolute</code> の要素は、ふつうの並び（フロー）から外れ、<b>基準の箱（包含ブロック）</b>の端からの距離で置かれます。<code>top: 0; right: 0</code> なら、基準の箱の右上の角です。</p><p>基準の箱になるのは、<b>position が static 以外の、いちばん近い祖先</b>です。そうした祖先がないと、ページ全体（ここではプレビューの画面）が基準になり、どのカードのリボンも画面の右上の角へ飛んでいきます。カードに <code>position: relative</code> を指定すると、カード自身は動かないまま、中の絶対配置の要素の基準になります（<code>transform</code> や <code>filter</code> を指定した祖先も基準の箱になります）。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/position",
      viz: { concept: "none" },
      challenge: {
        starterHTML: CARDS_HTML,
        starterCSS: CARDS_CSS(""),
        task: "2 枚の商品カードに付けた「NEW」のリボン（.ribbon）が、どちらもプレビューの右上の角に飛んでいき、重なっています。それぞれのカードの右上の角に置こう。",
        snapshot: { props: ["position"] },
        validators: [
          // allOf reports only the first unmet step, so a fresh starter gets one message.
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [...flush("r1", "card1", ["top", "right"]), ...flush("r2", "card2", ["top", "right"])],
                message: "リボン（.ribbon）が、それぞれのカードの右上の角にありません（基準の箱が、カードではなくプレビューの画面になっています）",
              },
              {
                kind: "computedEquals",
                id: "card1",
                prop: "position",
                value: "relative",
                message: "カード（.card）に position: relative を指定して、リボンの基準の箱にしましょう",
              },
            ],
          },
        ],
        hints: ["position: absolute の基準になるのは、position が static 以外の、いちばん近い祖先です", ".card { position: relative; }"],
        solution: CARDS_CSS("  position: relative;\n"),
      },
    },
    {
      id: "position-inset",
      title: "四辺をまとめて指定する: inset",
      explanation:
        "<p>絶対配置の要素に <code>top</code> と <code>left</code> だけを書くと、幅と高さは<b>中身に合わせた大きさ</b>になります。反対側の <code>right</code> と <code>bottom</code> も決めると、要素は<b>両側の端まで引き伸ばされ</b>、基準の箱を覆います。</p><p><code>inset</code> は、<code>top</code>・<code>right</code>・<code>bottom</code>・<code>left</code> をまとめて書く略記です。<code>inset: 0</code> なら四辺すべてが 0 になり、基準の箱（ここでは <code>position: relative</code> のカード）全体を覆います。値の並べ方は <code>margin</code> と同じで、<code>inset: 8px 16px</code> なら上下が 8px、左右が 16px です。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能。Safari は 14.1 から）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/inset",
      viz: { concept: "none" },
      challenge: {
        starterHTML: ITEM_HTML,
        starterCSS: ITEM_CSS("  top: 0;\n  left: 0;\n"),
        task: "売り切れの商品カードを、白い半透明の覆い（.cover）で隠したいのですが、top: 0 と left: 0 だけなので、覆いが左上の文字の大きさしかありません。inset を使って、カード全体を覆おう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: flush("cover", "item", ["top", "right", "bottom", "left"]),
                message: "売り切れの覆い（.cover）が、カード全体を覆っていません（top と left だけでは中身の大きさになります。四辺すべてを 0 にしましょう）",
              },
              {
                kind: "sourceMatches",
                pattern: "\\binset\\s*:",
                message: "inset で、四辺をまとめて指定しましょう（top・right・bottom・left を 1 行で）",
              },
            ],
          },
        ],
        hints: ["上下左右の 4 辺をすべて 0 にすると、基準の箱いっぱいに広がります", ".cover { inset: 0; }"],
        solution: ITEM_CSS("  inset: 0;\n"),
      },
    },
    {
      id: "position-logical",
      title: "書字方向に合わせる: inset-inline-end",
      explanation:
        "<p><code>top</code>・<code>right</code>・<code>bottom</code>・<code>left</code> は、<b>画面の上下左右</b>を指す物理的なプロパティです。アラビア語やヘブライ語のように<b>右から左へ書く</b>言語（<code>dir=\"rtl\"</code>）では、行の始まりが右、終わりが左になるので、<code>right: 0</code> で置いた閉じるボタンは行の始まり側に来てしまいます。</p><p>論理的な <code>inset-inline-start</code>／<code>inset-inline-end</code>（行の始まり／終わり）と <code>inset-block-start</code>／<code>inset-block-end</code>（ブロックの始まり／終わり）を使うと、書字方向に合わせて置く側が入れ替わります。<code>inset-inline-end: 0</code> は、左から右へ書く日本語では右、右から左へ書く言語では左です（縦書きでは下）。物理的な <code>right: 0</code> が残っていると、右から左へ書く方では left と right の両方が決まり、幅が決まっている要素では right が使われるので、置き換えます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能。Chrome 87・Firefox 63・Safari 14.1 から）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/inset-inline-end",
      viz: { concept: "none" },
      challenge: {
        starterHTML: NOTES_HTML,
        starterCSS: NOTES_CSS("  top: 0;\n  right: 0;\n"),
        task: "下のお知らせはアラビア語で、右から左へ書きます。閉じるボタン（.close）は行の終わり側、つまり左上に置きたいのに、right: 0 なので右上にあります。書字方向に合わせて、どちらのお知らせでも行の終わり側の上の角に置こう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: flush("close-ja", "ja", ["top", "right"]),
                message: "日本語のお知らせで、閉じるボタンが右上の角にありません",
              },
              {
                kind: "allOf",
                of: flush("close-ar", "ar", ["top", "left"]),
                message: "右から左へ書くお知らせ（下）で、閉じるボタンが左上の角にありません（right: 0 が残っていると、こちらでも右に置かれます）",
              },
              { kind: "sourceMatches", pattern: "inset-inline", message: "inset-inline-end で、行の終わり側に置きましょう" },
            ],
          },
        ],
        hints: [
          "inset-inline-end は「行の終わり側」です。右から左へ書く言語では左になります",
          ".close { inset-block-start: 0; inset-inline-end: 0; }（top: 0 と right: 0 を置き換えます）",
        ],
        solution: NOTES_CSS("  inset-block-start: 0;\n  inset-inline-end: 0;\n"),
      },
    },
  ],
};
