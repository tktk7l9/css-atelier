import type { Track } from "./types.js";

// What a click reaches is judged by hit tests (hitTarget): the element the
// pointer reaches at a point, after stacking and pointer-events, exactly as a
// click would. Points are placed relative to boxes, including just outside
// the 16px icons (fractions below 0) to test the padding around them. Hit
// tests skip pointer-events: none, so the overlay lesson also reads the
// overlay's computed values to make sure it is still shown.

const SHINE_HTML =
  '<article data-id="card" class="card"><h3>夏の旅特集</h3><p>海の見える宿を 30 軒えらびました。</p><button data-id="more" class="more" type="button">特集を読む</button><span data-id="shine" class="shine"></span></article>';

const SHINE_CSS = (extra: string): string =>
  `.card {\n  position: relative;\n  width: 280px;\n  padding: 16px;\n  overflow: hidden;\n  border-radius: 12px;\n  background: #2f5fd0;\n  color: #fff;\n}\n.card h3 {\n  margin: 0 0 4px;\n}\n.card p {\n  margin: 0 0 12px;\n}\n.more {\n  padding: 8px 16px;\n  border: 0;\n  border-radius: 999px;\n  background: #fff;\n  color: #2f5fd0;\n  font: inherit;\n}\n/* カード全体に重ねた光の飾り */\n.shine {\n  position: absolute;\n  inset: 0;\n  background: linear-gradient(120deg, transparent 30%, rgb(255 255 255 / 0.3) 45%, transparent 60%);\n${extra}}\n`;

const LINK_HTML =
  '<article data-id="card" class="card"><div data-id="photo" class="photo"></div><h3 class="title"><a data-id="link" href="#">海の見える宿 30 選</a></h3><p data-id="desc">夏の旅特集。予約の取り方も紹介します。</p></article>' +
  '<p data-id="note" class="note">ほかの特集は、来週公開します。</p>';

const LINK_CSS = (card: string, extra: string): string =>
  `.card {\n${card}  width: 280px;\n  padding: 16px;\n  border: 1px solid #c5cde0;\n  border-radius: 12px;\n  background: #fff;\n}\n.photo {\n  height: 80px;\n  border-radius: 8px;\n  background: linear-gradient(#9fd3f5, #2f5fd0);\n}\n.title {\n  margin: 10px 0 4px;\n  font-size: 18px;\n}\n.card p {\n  margin: 0;\n}\n.note {\n  margin: 12px 0 0;\n}\n${extra}`;

const ICON = (n: number): string =>
  `<svg data-id="i${n}" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="currentColor"/></svg>`;

const TOOLS_HTML =
  '<div data-id="bar" class="tools">' +
  `<button data-id="b1" class="icon" type="button" aria-label="お気に入り">${ICON(1)}</button>` +
  `<button data-id="b2" class="icon" type="button" aria-label="共有">${ICON(2)}</button>` +
  `<button data-id="b3" class="icon" type="button" aria-label="印刷">${ICON(3)}</button>` +
  "</div>";

const TOOLS_CSS = (padding: string): string =>
  `.tools {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 12px;\n  border-radius: 8px;\n  background: #eef1f8;\n}\n/* アイコンだけのボタン */\n.icon {\n  display: grid;\n  place-items: center;\n  padding: ${padding};\n  border: 0;\n  border-radius: 8px;\n  background: transparent;\n  color: #2f5fd0;\n}\n.icon svg {\n  display: block;\n}\n`;

export const hitAreasTrack: Track = {
  id: "hit-areas",
  title: "押せる範囲（pointer-events・カード全体のリンク・44px）",
  summary: "pointer-events: none で飾りの下のボタンを押せるようにし、リンクの ::after をカード全体に広げ、padding で小さなアイコンのボタンを 44px 四方に広げる。",
  emoji: "👆",
  lessons: [
    {
      id: "pointer-events-none",
      title: "飾りの下のボタンを押せるように: pointer-events: none",
      explanation:
        "<p>カード全体に重ねた光の飾り（<code>position: absolute; inset: 0</code>）は、見た目には透けていても、<b>押したときの反応を受け止めて</b>しまいます。下にある「特集を読む」ボタンは見えているのに押せません。</p><p><code>pointer-events: none</code> を指定した要素は、マウスやタッチの<b>対象にならず</b>、押した反応はその下にある要素に届きます。見た目は変わりません。ただし Tab キーでのフォーカスは止められないので、操作する部品ではなく、飾りに使います。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/pointer-events",
      viz: { concept: "none" },
      challenge: {
        starterHTML: SHINE_HTML,
        starterCSS: SHINE_CSS(""),
        task: "光の飾りがカード全体に重なっていて、「特集を読む」ボタンが押せません。飾りの見た目はそのままで、ボタンを押せるようにしよう。",
        snapshot: { props: ["display", "visibility", "pointer-events"], hits: [{ at: "more", fx: 0.5, fy: 0.5 }] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "hitTarget",
                at: "more",
                top: "more",
                message: "「特集を読む」ボタンを押しても、ボタンが反応しません（上に重なった光の飾りが受け止めています。飾りのほうに pointer-events: none）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "computedMatches", id: "shine", prop: "display", pattern: "^(?!none$)" },
                  { kind: "computedEquals", id: "shine", prop: "visibility", value: "visible" },
                ],
                message: "光の飾りが見えなくなっています（見た目は残して、押した反応だけを下に通します）",
              },
              {
                kind: "computedEquals",
                id: "shine",
                prop: "pointer-events",
                value: "none",
                message: "ボタンを前に出すと、光がボタンにかからなくなります。飾りのほうに pointer-events: none を指定しましょう",
              },
            ],
          },
        ],
        hints: ["押した反応を、重なっている飾りの下へ通すプロパティがあります", ".shine { pointer-events: none; }"],
        solution: SHINE_CSS("  pointer-events: none;\n"),
      },
    },
    {
      id: "stretched-link",
      title: "カード全体をリンクに: ::after を inset: 0 で広げる",
      explanation:
        "<p>カードの見出しだけがリンクだと、写真や説明文を押しても何も起きません。リンクの <code>::after</code>（リンクの中に作られる最後の子）を <code>position: absolute</code> と <code>inset: 0</code> で<b>カード全体に広げる</b>と、カードのどこを押してもリンクが反応します。<code>content: \"\"</code> を書かないと ::after は作られません。HTML は変えないので、リンクは見出しの 1 つのままです。</p><p><code>position: absolute</code> の要素は、<b>position が static 以外のいちばん近い祖先</b>の padding の端を基準にします。カードに <code>position: relative</code> を付け忘れると、基準がページ全体になり、カードの外まで押せるようになってしまいます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Guides/Display/Containing_block",
      viz: { concept: "none" },
      challenge: {
        starterHTML: LINK_HTML,
        starterCSS: LINK_CSS("", ""),
        task: "見出しのリンクだけでなく、カードのどこを押しても記事へ進めるようにしよう（カードの外の文章は押せないまま）。",
        snapshot: {
          props: [],
          hits: [
            { at: "photo", fx: 0.5, fy: 0.5 },
            { at: "desc", fx: 0.5, fy: 0.5 },
            { at: "note", fx: 0.5, fy: 0.5 },
          ],
        },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "hitTarget", at: "photo", top: "link" },
                  { kind: "hitTarget", at: "desc", top: "link" },
                ],
                message: "写真や説明文を押しても、リンクが反応しません（リンクの ::after を position: absolute と inset: 0 でカード全体に広げます）",
              },
              {
                kind: "hitTarget",
                at: "note",
                top: "note",
                message: "カードの外の文章まで、リンクになっています（.card に position: relative を付けて、::after の基準をカードにします）",
              },
              {
                kind: "offset",
                a: "photo",
                b: "link",
                edgeA: "bottom",
                edgeB: "top",
                min: 0,
                message: "見出しのリンクの位置が変わっています（リンクそのものではなく、::after をカード全体に広げます）",
              },
            ],
          },
        ],
        hints: ["リンクに ::after を作り、カードを基準に上下左右 0 まで広げます", '.card { position: relative; } .card a::after { content: ""; position: absolute; inset: 0; }'],
        solution: LINK_CSS("  position: relative;\n", '/* リンクの ::after をカード全体に広げる */\n.card a::after {\n  content: "";\n  position: absolute;\n  inset: 0;\n}\n'),
      },
    },
    {
      id: "tap-target",
      title: "押せる範囲を広げる: padding で 44px 四方に",
      explanation:
        "<p>16px のアイコンだけのボタンは、押せる範囲も 16px 四方しかなく、指では押し損じやすくなります。WCAG の達成基準 2.5.5（AAA）は、押せる部品の範囲を<b>幅も高さも 44px 以上</b>にすることを求めています。</p><p>アイコンの大きさは変えずに、ボタンに <code>padding: 14px</code>（16 + 14 × 2 = 44）を付けると、見た目のアイコンはそのままで押せる範囲だけが広がります（<code>min-width</code> と <code>min-height</code> で 44px にしても同じです）。padding の部分もボタンの箱なので、アイコンの少し外を押してもボタンが反応します。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/padding",
      viz: { concept: "none" },
      challenge: {
        starterHTML: TOOLS_HTML,
        starterCSS: TOOLS_CSS("0"),
        task: "アイコンだけのボタンが 16px 四方しかなく、押しにくくなっています。アイコンは 16px のまま、ボタンを 44px 四方に広げよう。",
        snapshot: {
          props: [],
          hits: [
            { at: "i1", fx: -0.5, fy: 0.5 },
            { at: "i1", fx: 0.5, fy: -0.5 },
          ],
        },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "hitTarget", at: "i1", fx: -0.5, fy: 0.5, top: "b1" },
                  { kind: "hitTarget", at: "i1", fx: 0.5, fy: -0.5, top: "b1" },
                ],
                message: "アイコンのすぐ外を押しても、ボタンが反応しません（ボタンに padding: 14px を付けて、押せる範囲を広げます）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "offset", a: "b1", b: "b1", edgeA: "left", edgeB: "right", min: 43.5 },
                  { kind: "offset", a: "b1", b: "b1", edgeA: "top", edgeB: "bottom", min: 43.5 },
                ],
                message: "ボタンが 44px 四方になっていません（16px のアイコンに、上下左右 14px の padding）",
              },
              {
                kind: "sizeApprox",
                id: "i1",
                w: 16,
                h: 16,
                tol: 0.5,
                message: "アイコンの大きさが変わっています（アイコンは 16px のまま、ボタンのほうを広げます）",
              },
            ],
          },
        ],
        hints: ["アイコンとボタンの縁の間に、上下左右 14px の余白を入れます", ".icon { padding: 14px; }"],
        solution: TOOLS_CSS("14px"),
      },
    },
  ],
};
