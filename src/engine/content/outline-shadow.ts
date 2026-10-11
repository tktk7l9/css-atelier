import { svgUri } from "./svg-uri.js";
import type { Track } from "./types.js";

// Decoration is judged where it shows. An outline takes no room, so the picked
// chip keeps the same height as the others (a thicker border makes it taller
// and pushes its neighbours); a layered shadow reads back as two comma-
// separated shadows, each offset downwards and blurred; corner radii read as
// the computed values (50% for the round avatar, and at least half of the
// 36px button's height in px for the pill, since a percentage on a wide box
// makes an ellipse, not a pill).

const CHIPS = ["すべて", "カメラ", "レンズ", "三脚"];

const CHIPS_HTML =
  '<div data-id="chips" class="chips">' +
  CHIPS.map((c, i) => `<button data-id="c${i + 1}" class="chip${i === 1 ? " selected" : ""}" type="button">${c}</button>`).join("") +
  "</div>";

const CHIPS_CSS = (selected: string): string =>
  `.chips {\n  display: flex;\n  align-items: flex-start;\n  gap: 8px;\n}\n.chip {\n  padding: 4px 12px;\n  border: 1px solid #9fb2e6;\n  border-radius: 999px;\n  background: #fff;\n  font: inherit;\n  font-size: 14px;\n}\n.selected {\n${selected}}\n`;

const CARD_HTML = '<article data-id="card" class="card"><h3>新着の作品</h3><p>今週の投稿から選びました。</p></article>';

const CARD_CSS = (shadow: string): string =>
  `.card {\n  width: 240px;\n  margin: 16px;\n  padding: 16px;\n  border-radius: 12px;\n  background: #fff;\n${shadow}}\n.card h3 {\n  margin: 0 0 4px;\n  font-size: 16px;\n}\n.card p {\n  margin: 0;\n  font-size: 14px;\n}\n`;

const FACE = svgUri(64, 64, "<rect width='64' height='64' fill='#dbe4fb'/><circle cx='32' cy='26' r='12' fill='#2f5fd0'/><path d='M10 64a22 22 0 0 1 44 0z' fill='#2f5fd0'/>");

const PROFILE_HTML =
  `<div class="profile"><img data-id="avatar" class="avatar" src="${FACE}" width="64" height="64" alt="山田さんの写真">` +
  '<button data-id="follow" class="follow" type="button">フォローする</button></div>';

const PROFILE_CSS = (avatar: string, button: string): string =>
  `.profile {\n  display: flex;\n  align-items: center;\n  gap: 16px;\n}\n.avatar {\n  display: block;\n${avatar}}\n.follow {\n  height: 36px;\n  padding: 0 20px;\n  border: 0;\n  background: #2f5fd0;\n  color: #fff;\n  font: inherit;\n${button}}\n`;

/** One computed shadow: a colour, then x, y, blur and spread in px. */
const SHADOW = "rgba?\\([^)]*\\) -?[\\d.]+px [\\d.]+px [\\d.]+px -?[\\d.]+px";

export const outlineShadowTrack: Track = {
  id: "outline-shadow",
  title: "枠線と影（outline・box-shadow・border-radius）",
  summary: "outline で大きさを変えずに選択を示し、box-shadow を重ねて自然に浮かせ、border-radius で丸い写真とピル形のボタンを作る。",
  emoji: "🪄",
  lessons: [
    {
      id: "outline-selected",
      title: "大きさを変えずに線を引く: outline",
      explanation:
        "<p>選んだ部品の枠線を <code>border</code> で太くすると、枠線は箱の大きさに含まれるので、<b>その部品だけ大きくなり、隣の部品が押されて動きます</b>。</p><p><code>outline</code> は枠線の<b>外側</b>に描かれる線で、<b>場所を取らず、レイアウトに一切影響しません</b>。<code>outline: 2px solid</code> で選択の線を描き、<code>outline-offset</code> で枠線との間をあけられます。角丸にも沿います。なお、<code>outline: none</code> でフォーカスの線を消すと、キーボードで操作する人がどこにいるか分からなくなるので、消したら必ず別の見た目で示しましょう。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/outline",
      viz: { concept: "none" },
      challenge: {
        starterHTML: CHIPS_HTML,
        starterCSS: CHIPS_CSS("  border: 3px solid #2f5fd0;\n"),
        task: "選んだチップ（カメラ）だけ枠線を 3px にしたら、そのチップが大きくなり、隣のチップが押されています。枠線は 1px のまま、外側に 2px の線を足して選択を示そう（大きさは変えない）。",
        snapshot: { props: ["border-top-width", "outline-style", "outline-width"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "allOf",
                of: [
                  { kind: "relativeSize", a: "c2", b: "c1", ratio: 1, dim: "h", tol: 0.5 },
                  { kind: "computedEquals", id: "c2", prop: "border-top-width", value: "1px" },
                ],
                message: "選んだチップが大きくなっています（border は箱の大きさに含まれるので、太くすると隣のチップが押されます）",
              },
              {
                kind: "allOf",
                of: [
                  { kind: "computedMatches", id: "c2", prop: "outline-style", pattern: "^(?!none$)" },
                  { kind: "computedMatches", id: "c2", prop: "outline-width", pattern: "^(?:[2-9]|\\d{2,})(?:\\.\\d+)?px$" },
                ],
                message: "選んだチップに outline で 2px 以上の線を引きましょう（box-shadow の輪でも大きさは変わりませんが、ここでは outline を使います）",
              },
            ],
          },
        ],
        hints: ["border を太くするのをやめ、場所を取らない outline で線を描きます", ".selected { outline: 2px solid #2f5fd0; }"],
        solution: CHIPS_CSS("  outline: 2px solid #2f5fd0;\n"),
      },
    },
    {
      id: "layered-shadow",
      title: "影を重ねて浮かせる: box-shadow",
      explanation:
        "<p><code>box-shadow: 0 8px 24px rgb(24 32 58 / 0.15)</code> は、横 0・下に 8px ずらし、24px ぼかした影です（4 つめの値で広げる・縮めることも、<code>inset</code> で内側の影にすることもできます）。影も <code>outline</code> と同じく<b>場所を取りません</b>。</p><p>影は<b>カンマで区切って何枚でも重ねられます</b>。カードの縁に沿う短く濃い影と、遠くまで広がる薄い影を重ねると、1 枚のときより自然に浮いて見えます。先に書いた影が上に描かれます。<code>border-radius</code> があれば、影も同じ角丸になります。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/box-shadow",
      viz: { concept: "none" },
      challenge: {
        starterHTML: CARD_HTML,
        starterCSS: CARD_CSS(""),
        task: "白いカードが背景に溶け込んでいます。カードの縁の短い影（例: 0 1px 2px）と、遠くまで広がる薄い影（例: 0 8px 24px）の 2 枚を重ねて、カードを浮かせよう（どちらも下向きにずらしてぼかす）。",
        snapshot: { props: ["box-shadow"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "computedMatches",
                id: "card",
                prop: "box-shadow",
                pattern: `^${SHADOW}`,
                message: "カードに影が付いていません（box-shadow）",
              },
              {
                kind: "computedMatches",
                id: "card",
                prop: "box-shadow",
                pattern: `^${SHADOW}, ${SHADOW}$`,
                message: "影が 1 枚です。カンマで区切って 2 枚重ねましょう（短く濃い影と、遠くまで広がる薄い影）",
              },
              {
                kind: "computedMatches",
                id: "card",
                prop: "box-shadow",
                pattern: "^rgba?\\([^)]*\\) -?[\\d.]+px (?!0px)[\\d.]+px (?!0px)[\\d.]+px -?[\\d.]+px, rgba?\\([^)]*\\) -?[\\d.]+px (?!0px)[\\d.]+px (?!0px)[\\d.]+px",
                message: "どちらの影も、下向きにずらして（2 つめの値）ぼかしましょう（3 つめの値）",
              },
            ],
          },
        ],
        hints: ["box-shadow はカンマで区切ると何枚でも重ねられます", ".card { box-shadow: 0 1px 2px rgb(24 32 58 / 0.2), 0 8px 24px rgb(24 32 58 / 0.15); }"],
        solution: CARD_CSS("  box-shadow:\n    0 1px 2px rgb(24 32 58 / 0.2),\n    0 8px 24px rgb(24 32 58 / 0.15);\n"),
      },
    },
    {
      id: "border-radius-shapes",
      title: "丸い写真とピル形: border-radius",
      explanation:
        "<p><code>border-radius</code> は角を丸めます。正方形に <code>border-radius: 50%</code> を付けると<b>円</b>になり、丸いプロフィール写真によく使います（<code>img</code> 要素にもそのまま使えます）。</p><p>横長のボタンに <code>50%</code> を付けると、幅と高さそれぞれの半分が半径になるので、両端が尖った<b>楕円</b>になってしまいます。両端が半円の<b>ピル形</b>にするには、高さの半分以上の<b>長さ</b>を指定します。ボタンの高さが変わってもピル形のままになるよう、<code>999px</code> のような大きな値を書くのが定番です。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/border-radius",
      viz: { concept: "none" },
      challenge: {
        starterHTML: PROFILE_HTML,
        starterCSS: PROFILE_CSS("", ""),
        task: "プロフィール写真（64px の正方形）を円に、「フォローする」ボタン（高さ 36px）を両端が半円のピル形にしよう。",
        snapshot: { props: ["border-top-left-radius"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "computedMatches",
                id: "avatar",
                prop: "border-top-left-radius",
                pattern: "^(?:50%|(?:3[2-9]|[4-9]\\d|\\d{3,})(?:\\.\\d+)?px)$",
                message: "写真が円になっていません（正方形に border-radius: 50%）",
              },
              {
                kind: "computedMatches",
                id: "follow",
                prop: "border-top-left-radius",
                pattern: "^(?:1[89]|[2-9]\\d|\\d{3,})(?:\\.\\d+)?px$",
                message: "ボタンがピル形になっていません（高さ 36px の半分の 18px 以上を px などの長さで。横長の箱に 50% だと楕円になります）",
              },
            ],
          },
        ],
        hints: ["写真は 50%、ボタンは高さの半分以上の長さ（999px など）です", ".avatar { border-radius: 50%; } .follow { border-radius: 999px; }"],
        solution: PROFILE_CSS("  border-radius: 50%;\n", "  border-radius: 999px;\n"),
      },
    },
  ],
};
