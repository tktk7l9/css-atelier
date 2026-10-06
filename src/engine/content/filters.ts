import type { Track } from "./types.js";

// Filters and blending change pixels, not boxes, so these lessons read the
// computed values. The stand-in "photo" is a gradient with stripes: the
// stripes make a blur or a blend easy to see in the preview, and a gradient
// needs no image request under the strict CSP.
const PHOTO_BG =
  "repeating-linear-gradient(45deg, rgb(255 255 255 / 0.35) 0 8px, transparent 8px 16px), linear-gradient(160deg, #ffd27a, #ff8a65 40%, #7b5cd6 75%, #2f5fd0)";

const GALLERY_CSS = (locked: string): string =>
  `.gallery {\n  display: flex;\n  gap: 12px;\n}\n.photo {\n  display: grid;\n  place-items: end start;\n  width: 140px;\n  height: 100px;\n  padding: 6px 8px;\n  color: #fff;\n  font-weight: 700;\n  background: ${PHOTO_BG};\n}\n.locked {\n${locked}}\n`;

const CAPTION_CSS = (extra: string): string =>
  `.photo {\n  position: relative;\n  width: 260px;\n  height: 160px;\n  background: ${PHOTO_BG};\n}\n.caption {\n  position: absolute;\n  inset: auto 12px 12px;\n  margin: 0;\n  padding: 8px 12px;\n  border-radius: 8px;\n  font-weight: 700;\n  background: rgb(255 255 255 / 0.4);\n${extra}}\n`;

const TINT_CSS = (extra: string): string =>
  `.card {\n  position: relative;\n  width: 260px;\n  height: 160px;\n}\n.photo,\n.tint {\n  position: absolute;\n  inset: 0;\n}\n.photo {\n  background: ${PHOTO_BG};\n}\n.tint {\n  background: #2f5fd0;\n${extra}}\n`;

export const filtersTrack: Track = {
  id: "filters",
  title: "フィルターと合成",
  summary: "filter・backdrop-filter・mix-blend-mode で、写真加工のような効果を CSS だけで。",
  emoji: "🎛️",
  lessons: [
    {
      id: "filter-functions",
      title: "白黒にしてぼかす: filter",
      explanation:
        "<p><code>filter</code> は、要素の見た目に<b>写真加工のような効果</b>をかけます。<code>grayscale(1)</code> で白黒、<code>blur(4px)</code> でぼかし、<code>brightness()</code> や <code>contrast()</code> で明るさやコントラストを変えられます。中の文字や子要素ごとかかります。</p><p>関数は<b>空白で区切って並べる</b>と、左から順にかかります。<code>filter: grayscale(1) blur(4px)</code> なら、白黒にしてからぼかします。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/filter",
      viz: { concept: "none" },
      challenge: {
        starterHTML:
          '<div class="gallery"><div data-id="open" class="photo">公開中</div><div data-id="locked" class="photo locked">会員限定</div></div>',
        starterCSS: GALLERY_CSS("  \n"),
        task: "会員限定の写真（.locked）だけを、白黒（grayscale(1)）にしてから 4px ぼかそう。公開中の写真はそのままにします。",
        snapshot: { props: ["filter"] },
        validators: [
          { kind: "computedMatches", id: "locked", prop: "filter", pattern: "grayscale\\((?:1|100%)\\)", message: ".locked を grayscale(1) で白黒にしましょう" },
          { kind: "computedMatches", id: "locked", prop: "filter", pattern: "blur\\(4px\\)", message: ".locked を blur(4px) でぼかしましょう" },
          { kind: "computedEquals", id: "open", prop: "filter", value: "none", message: "公開中の写真にはフィルターをかけないでおきましょう" },
        ],
        hints: ["filter には関数を空白で区切って並べられます。左から順にかかります", "filter: grayscale(1) blur(4px);"],
        solution: GALLERY_CSS("  filter: grayscale(1) blur(4px);\n"),
      },
    },
    {
      id: "filter-backdrop",
      title: "すりガラス: backdrop-filter",
      explanation:
        "<p><code>backdrop-filter</code> は、要素そのものではなく<b>要素の後ろに見えているもの</b>にフィルターをかけます。写真の上のキャプションやヘッダーを、<b>すりガラス</b>越しに見ているようにできます。<code>filter: blur()</code> だと文字までぼけてしまうところです。</p><p>後ろが見えないと効果も見えないので、背景は <code>rgb(255 255 255 / 0.4)</code> のように<b>半透明</b>にしておきます。Baseline 2024（Chrome 76 / Firefox 103 / Safari 18 以降で利用可。Safari 17 以前は <code>-webkit-backdrop-filter</code> が必要でした）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/backdrop-filter",
      viz: { concept: "none" },
      challenge: {
        starterHTML: '<div class="photo"><p data-id="caption" class="caption">夕暮れの丘で</p></div>',
        starterCSS: CAPTION_CSS(""),
        task: "キャプション（.caption）の後ろに見えている写真を 8px ぼかして、すりガラスのようにしよう。キャプションの文字はぼかしません。",
        snapshot: { props: ["backdrop-filter", "filter"] },
        validators: [
          { kind: "computedMatches", id: "caption", prop: "backdrop-filter", pattern: "blur\\(8px\\)", message: ".caption に backdrop-filter: blur(8px) を指定しましょう" },
          { kind: "computedEquals", id: "caption", prop: "filter", value: "none", message: "filter だと文字までぼけます。後ろだけをぼかす backdrop-filter を使いましょう" },
        ],
        hints: ["ぼかしたいのは要素自身ではなく後ろなので、filter ではなく backdrop-filter です", "backdrop-filter: blur(8px);"],
        solution: CAPTION_CSS("  backdrop-filter: blur(8px);\n"),
      },
    },
    {
      id: "blend-multiply",
      title: "色を重ねて混ぜる: mix-blend-mode",
      explanation:
        "<p><code>mix-blend-mode</code> は、要素の色を<b>下に重なっているもの</b>とどう混ぜるかを決めます。画像編集ソフトの「描画モード」と同じで、<code>multiply</code>（乗算）は重ねるほど暗く、<code>screen</code>（スクリーン）は明るく、<code>overlay</code> はコントラストを強めます。</p><p>写真の上に色の板を重ねて <code>multiply</code> にすると、写真の明暗を残したまま色をつけられます（ダブルトーン風）。混ぜる相手を親の中だけに閉じ込めたいときは、親に <code>isolation: isolate</code> を指定します。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/mix-blend-mode",
      viz: { concept: "none" },
      challenge: {
        starterHTML: '<div class="card"><div class="photo"></div><div data-id="tint" class="tint"></div></div>',
        starterCSS: TINT_CSS(""),
        task: "写真の上に重ねた青い板（.tint）を乗算（multiply）で混ぜて、写真の模様が透けて見えるようにしよう。",
        snapshot: { props: ["mix-blend-mode"] },
        validators: [
          { kind: "computedEquals", id: "tint", prop: "mix-blend-mode", value: "multiply", message: ".tint に mix-blend-mode: multiply を指定しましょう" },
        ],
        hints: ["重ねた要素と下の色の混ぜ方を決めるのは mix-blend-mode です", "mix-blend-mode: multiply;"],
        solution: TINT_CSS("  mix-blend-mode: multiply;\n"),
      },
    },
  ],
};
