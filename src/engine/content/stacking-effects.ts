import type { Track } from "./types.js";

// Side effects of scale and opacity on stacking and clicks, judged by hit
// tests (hitTarget): which element the pointer reaches where boxes overlap.
// Each lesson also reads a computed value that keeps the effect itself (the
// avatar stays enlarged, the sold-out item stays dimmed, the closed menu stays
// transparent), so removing the effect does not pass. The starters carry no
// transitions: the preview applies the CSS after the page has loaded, so a
// transition would leave computed values mid-way when they are read.

const TEAM_HTML =
  '<div data-id="team" class="team">' +
  '<span data-id="a1" class="avatar">YS<span class="dot"></span></span>' +
  '<span data-id="a2" class="avatar is-active">KM<span class="dot"></span></span>' +
  '<span data-id="a3" class="avatar">TO</span>' +
  '<span data-id="a4" class="avatar">RN</span>' +
  "</div>";

const TEAM_CSS = (extra: string): string =>
  `.team {\n  display: flex;\n  padding: 16px;\n}\n/* 少しずつ重ねたアバター */\n.avatar {\n  position: relative;\n  display: grid;\n  place-items: center;\n  width: 48px;\n  height: 48px;\n  margin-left: -12px;\n  border: 3px solid #fff;\n  border-radius: 50%;\n  background: #dbe4fb;\n  color: #18203a;\n  font-size: 14px;\n  font-weight: 700;\n}\n.avatar:first-child {\n  margin-left: 0;\n}\n/* オンラインの印 */\n.dot {\n  position: absolute;\n  right: -2px;\n  bottom: -2px;\n  width: 12px;\n  height: 12px;\n  border: 2px solid #fff;\n  border-radius: 50%;\n  background: #2f9d5b;\n}\n/* いま話している人を大きく */\n.is-active {\n  scale: 1.25;\n  background: #fff3c4;\n${extra}}\n`;

const SHOP_HTML =
  '<div class="list">' +
  '<article data-id="sold" class="item sold"><p data-id="name">春の福袋（売り切れ）</p><button type="button">入荷を知らせる</button><span data-id="tip" class="tip">再入荷したら、メールでお知らせします</span></article>' +
  '<article data-id="next" class="item"><p>夏の福袋</p><button type="button">カートに入れる</button></article>' +
  "</div>";

const SHOP_CSS = (extra: string): string =>
  `.list {\n  display: grid;\n  gap: 12px;\n  width: 280px;\n}\n.item {\n  position: relative;\n  padding: 12px;\n  border-radius: 12px;\n  background: #eef1f8;\n}\n.item p {\n  margin: 0 0 8px;\n}\n/* 売り切れの商品は薄く */\n.sold {\n  opacity: 0.55;\n}\n/* 売り切れの商品の吹き出し */\n.tip {\n  position: absolute;\n  z-index: 10;\n  top: calc(100% - 8px);\n  left: 12px;\n  padding: 6px 10px;\n  border-radius: 8px;\n  background: #18203a;\n  color: #fff;\n  font-size: 13px;\n}\n${extra}`;

const CLOSED_HTML =
  '<header class="bar"><span>Atelier</span><button class="toggle" type="button" aria-expanded="false">メニュー</button>' +
  '<nav data-id="menu" class="menu"><a href="#">ホーム</a><a href="#">講座の一覧</a><a href="#">お問い合わせ</a></nav></header>' +
  '<section class="card"><p>春の講座の受付を始めました。</p><button data-id="buy" class="buy" type="button">申し込む</button></section>';

const CLOSED_CSS = (extra: string): string =>
  `.bar {\n  position: relative;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 8px 12px;\n  border-radius: 8px;\n  background: #18203a;\n  color: #fff;\n}\n.toggle {\n  padding: 4px 10px;\n  border: 1px solid #fff;\n  border-radius: 6px;\n  background: none;\n  color: inherit;\n  font: inherit;\n}\n/* 閉じているメニュー（開くと opacity: 1 でふわっと出す） */\n.menu {\n  position: absolute;\n  top: 100%;\n  right: 12px;\n  display: grid;\n  width: 150px;\n  padding: 4px;\n  border: 1px solid #c5cde0;\n  border-radius: 8px;\n  background: #fff;\n  opacity: 0;\n${extra}}\n.menu a {\n  padding: 6px 8px;\n  color: #18203a;\n  text-decoration: none;\n}\n.toggle[aria-expanded="true"] + .menu {\n  opacity: 1;\n}\n.card {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-top: 12px;\n  padding: 16px;\n  border-radius: 12px;\n  background: #eef1f8;\n}\n.card p {\n  margin: 0;\n}\n.buy {\n  padding: 8px 16px;\n  border: 0;\n  border-radius: 999px;\n  background: #2f5fd0;\n  color: #fff;\n  font: inherit;\n}\n`;

export const stackingEffectsTrack: Track = {
  id: "stacking-effects",
  title: "重なりの落とし穴（scale・opacity）",
  summary: "scale で大きくしても重なり順は変わらないことを知り、opacity が作る重ね合わせコンテキストから吹き出しを出し、opacity: 0 で隠したメニューが押せてしまうのを止める。",
  emoji: "🎭",
  lessons: [
    {
      id: "scale-stacking",
      title: "大きくしても後ろに隠れる: scale と z-index",
      explanation:
        "<p><code>scale</code> や <code>transform</code> で要素を大きくしても、<b>重なり順は変わりません</b>。position を指定した要素どうしは、z-index がなければ HTML で後ろにあるものほど上に描かれるので、拡大したアバターの右側は、次のアバターの下に隠れたままです。</p><p>手前に出すには、拡大した要素に <code>z-index</code> を指定します（ここでは position: relative がすでにあります）。なお、transform や scale を指定した要素は、それだけで重ね合わせコンテキストを作ります。重なり順は、押したときにどの要素が反応するかも決めます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/scale",
      viz: { concept: "none" },
      challenge: {
        starterHTML: TEAM_HTML,
        starterCSS: TEAM_CSS(""),
        task: "いま話している人（KM）のアバターを scale で大きくしたのに、右側が次のアバターの下に隠れています。大きさはそのままで、KM のアバターをいちばん手前に出そう。",
        snapshot: { props: ["scale"], hits: [{ at: "a2", fx: 0.9, fy: 0.5 }] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "hitTarget",
                at: "a2",
                fx: 0.9,
                fy: 0.5,
                top: "a2",
                message: "KM のアバターの右側が、次のアバターの下に隠れています（大きくしても重なり順は変わりません。KM のアバターに z-index を）",
              },
              {
                kind: "computedEquals",
                id: "a2",
                prop: "scale",
                value: "1.25",
                message: "KM のアバターの大きさが変わっています（scale: 1.25 は残して、重なり順だけを変えます）",
              },
            ],
          },
        ],
        hints: ["拡大した要素も、重なり順は HTML の順のままです。z-index で手前に出します", ".is-active { z-index: 1; }"],
        solution: TEAM_CSS("  z-index: 1;\n"),
      },
    },
    {
      id: "opacity-stacking",
      title: "半透明の箱に閉じ込められる: opacity",
      explanation:
        "<p><code>opacity</code> を 1 未満にした要素は、<b>重ね合わせコンテキストを作ります</b>。中の吹き出しに <code>z-index: 10</code> を付けても、その数は箱の中でしか比べられず、箱ごと、あとに続く商品（position: relative）の下に描かれます。</p><p>直し方は 2 つあります。箱の opacity をやめて、中の文字やボタンを薄くすれば、箱は重ね合わせコンテキストを作らず、吹き出しの z-index が外とも比べられます（吹き出しも薄くなりません）。または、薄い箱ごと <code>z-index</code> で手前に出します。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/opacity",
      viz: { concept: "none" },
      challenge: {
        starterHTML: SHOP_HTML,
        starterCSS: SHOP_CSS(""),
        task: "売り切れの商品の吹き出し（z-index: 10）が、下の「夏の福袋」に隠れています。売り切れの商品は薄いまま、吹き出しを手前に出そう。",
        snapshot: { props: ["opacity"], hits: [{ at: "tip", fx: 0.5, fy: 0.7 }] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "hitTarget",
                at: "tip",
                fx: 0.5,
                fy: 0.7,
                top: "tip",
                message: "吹き出しが、下の商品の下に隠れています（opacity: 0.55 の箱が重ね合わせコンテキストを作るので、吹き出しの z-index: 10 は箱の中でしか比べられません）",
              },
              {
                kind: "anyOf",
                of: [
                  { kind: "computedMatches", id: "sold", prop: "opacity", pattern: "^0?\\.[1-6]\\d*$" },
                  { kind: "computedMatches", id: "name", prop: "opacity", pattern: "^0?\\.[1-6]\\d*$" },
                ],
                message: "売り切れの商品が薄くなくなっています（箱か、中の文字を opacity で薄くしたままにします）",
              },
            ],
          },
        ],
        hints: ["opacity が 1 未満の箱の中の z-index は、箱の外と比べられません", ".sold { opacity: 1; } .sold p, .sold button { opacity: 0.55; }（箱ではなく中を薄くする）"],
        solution: SHOP_CSS("/* 箱ではなく、中の文字とボタンを薄く */\n.sold {\n  opacity: 1;\n}\n.sold p,\n.sold button {\n  opacity: 0.55;\n}\n"),
      },
    },
    {
      id: "opacity-zero-click",
      title: "見えないのに押せる: opacity: 0 と visibility",
      explanation:
        "<p>閉じたメニューを <code>opacity: 0</code> で消すと、見えなくなっても要素はその場に残り、<b>押せて、Tab キーのフォーカスも受けます</b>。下にある「申し込む」ボタンを押すと、透明なメニューが反応してしまいます。MDN は、こうした要素を押せないようにし、タブ移動からも外すよう勧めています。</p><p>閉じているあいだは <code>visibility: hidden</code> も指定すると、要素は描かれず、フォーカスを受けず、読み上げからも外れます。opacity は 0 のまま残るので、開くときにふわっと出す transition も使えます（visibility も transition で切り替えられます）。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/visibility",
      viz: { concept: "none" },
      challenge: {
        starterHTML: CLOSED_HTML,
        starterCSS: CLOSED_CSS(""),
        task: "閉じているメニュー（opacity: 0）が「申し込む」ボタンの上に重なっていて、ボタンが押せません。opacity: 0 は残したまま、閉じているメニューが押されないようにしよう。",
        snapshot: { props: ["opacity"], hits: [{ at: "buy", fx: 0.5, fy: 0.5 }] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "hitTarget",
                at: "buy",
                top: "buy",
                message: "「申し込む」ボタンを押すと、透明なメニューが反応してしまいます（opacity: 0 の要素も押せます。閉じたメニューに visibility: hidden を）",
              },
              {
                kind: "computedEquals",
                id: "menu",
                prop: "opacity",
                value: "0",
                message: "閉じたメニューの opacity が 0 ではなくなっています（opacity: 0 は残して、押されないようにだけします）",
              },
            ],
          },
        ],
        hints: ["描かず、フォーカスもさせないプロパティを、閉じたメニューに足します", ".menu { visibility: hidden; } .toggle[aria-expanded=\"true\"] + .menu { visibility: visible; }"],
        solution: CLOSED_CSS("  visibility: hidden;\n").replace(
          '.toggle[aria-expanded="true"] + .menu {\n  opacity: 1;\n}\n',
          '.toggle[aria-expanded="true"] + .menu {\n  opacity: 1;\n  visibility: visible;\n}\n',
        ),
      },
    },
  ],
};
