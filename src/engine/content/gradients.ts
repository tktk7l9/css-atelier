import type { Track } from "./types.js";

// Gradients change pixels, not boxes, so these lessons read the computed
// background-image. Browsers serialize the same gradient in several ways:
// Chrome expands a double-position stop ("#f5c400 0 12px") into two stops,
// the "0" shorthand stays 0px / 0deg, turns become degrees and a missing first
// position stays missing. The patterns accept all of these and still pin down
// what the picture needs (the angle, the stripe widths, the pie boundaries).

const COLOR = "rgba?\\([^)]+\\)";

/** Two different colours, 12px each, repeating every 24px. */
const STRIPES = `^repeating-linear-gradient\\(45deg, (${COLOR})(?: 0px)?(?:, \\1)? 12px, (?!\\1 )(${COLOR}) (?:0px|12px)(?:, \\2)? 24px\\)$`;

const BLUE = "rgb\\(47, 95, 208\\)";
const GREEN = "rgb\\(47, 157, 91\\)";
const OCHRE = "rgb\\(185, 121, 27\\)";

const TAPE_HTML = '<div data-id="tape" class="tape"></div><p class="note">ただいま工事中です</p>';

const TAPE_CSS = (background: string): string =>
  `.tape {\n  height: 40px;\n  border-radius: 6px;\n  background: ${background};\n}\n.note {\n  margin: 8px 0 0;\n  font-weight: 700;\n}\n`;

const PIE_HTML =
  '<div class="chart"><div data-id="pie" class="pie"></div><ul class="legend"><li class="a">住まい 50%</li><li class="b">食費 30%</li><li class="c">その他 20%</li></ul></div>';

const PIE_CSS = (background: string): string =>
  `.chart {\n  display: flex;\n  align-items: center;\n  gap: 24px;\n}\n.pie {\n  width: 160px;\n  height: 160px;\n  border-radius: 50%;\n  background: ${background};\n}\n.legend {\n  margin: 0;\n  padding: 0;\n  list-style: none;\n  line-height: 2;\n}\n.legend li::before {\n  content: "";\n  display: inline-block;\n  width: 12px;\n  height: 12px;\n  margin-right: 6px;\n  border-radius: 3px;\n  background: var(--c);\n}\n.a { --c: #2f5fd0; }\n.b { --c: #2f9d5b; }\n.c { --c: #b9791b; }\n`;

const BARS_HTML =
  '<div data-id="before" class="bar before">既定（sRGB）</div><div data-id="after" class="bar after">in oklch</div>';

const BARS_CSS = (after: string): string =>
  `.bar {\n  display: flex;\n  align-items: center;\n  height: 56px;\n  margin-bottom: 12px;\n  padding-left: 12px;\n  color: #fff;\n  font-weight: 700;\n  border-radius: 8px;\n}\n.before {\n  background: linear-gradient(to right, #2f5fd0, #f5c400);\n}\n.after {\n  background: ${after};\n}\n`;

export const gradientsTrack: Track = {
  id: "gradients",
  title: "グラデーション",
  summary: "repeating-linear-gradient・conic-gradient・in oklch で、しま模様や円グラフ、色の移り変わりを画像なしで。",
  emoji: "🌅",
  lessons: [
    {
      id: "gradient-stripes",
      title: "しま模様: repeating-linear-gradient()",
      explanation:
        "<p><code>repeating-linear-gradient()</code> は、色の並びを<b>くり返す</b>グラデーションです。最後の色の位置（ここでは 24px）が 1 周期になり、そこから同じ並びがくり返されます。</p><p>色のあとに位置を<b>2 つ続けて</b>書くと（<code>#f5c400 0 12px</code>）、その区間をその色で塗りつぶせます。次の色を同じ位置（12px）から始めれば境目がぼけず、くっきりしたしま模様になります。最初の <code>45deg</code> はグラデーションが進む向きで、<code>0deg</code> が下から上、<code>90deg</code> が左から右。しまの線は、その向きに直角に入ります。</p><p>画像を使わないので、画像の読み込みを制限しているページでも使えます。主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/gradient/repeating-linear-gradient",
      viz: { concept: "none" },
      challenge: {
        starterHTML: TAPE_HTML,
        starterCSS: TAPE_CSS("#f5c400"),
        task: "工事中の帯（.tape）を、黄色（#f5c400）と紺（#18203a）が 12px ずつ交互に並ぶ、45deg の斜めのしま模様にしよう。",
        snapshot: { props: ["background-image"] },
        validators: [
          // allOf reports only the first unmet step, so a fresh starter gets one message.
          {
            kind: "allOf",
            of: [
              { kind: "computedMatches", id: "tape", prop: "background-image", pattern: "^repeating-linear-gradient\\(", message: ".tape の background を repeating-linear-gradient(…) にしましょう" },
              { kind: "computedMatches", id: "tape", prop: "background-image", pattern: "^repeating-linear-gradient\\(45deg,", message: "しまの向きを 45deg にしましょう" },
              {
                kind: "computedMatches",
                id: "tape",
                prop: "background-image",
                pattern: STRIPES,
                message: "1 色めを 0〜12px、2 色めを 12〜24px にして、違う 2 色を 24px ごとにくり返しましょう",
              },
            ],
          },
        ],
        hints: ["位置を 2 つ続けると、その区間を 1 色で塗れます（#f5c400 0 12px）", "background: repeating-linear-gradient(45deg, #f5c400 0 12px, #18203a 12px 24px);"],
        solution: TAPE_CSS("repeating-linear-gradient(45deg, #f5c400 0 12px, #18203a 12px 24px)"),
      },
    },
    {
      id: "gradient-conic",
      title: "円グラフ: conic-gradient()",
      explanation:
        "<p><code>conic-gradient()</code> は、中心のまわりを<b>ぐるりと回りながら</b>色が変わるグラデーションです。真上から時計回りに進み、位置は角度（<code>180deg</code>）でも割合（<code>50%</code> = 半周）でも書けます。</p><p>色ごとに<b>始まりと終わりの 2 つの位置</b>を書くと、境目のくっきりした扇形になります。<code>#2f5fd0 0% 50%, #2f9d5b 50% 80%, …</code> のように、前の色が終わった位置から次の色を始めれば、そのまま円グラフです。<code>border-radius: 50%</code> で円く切り抜きます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能。Firefox は 83 から）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/gradient/conic-gradient",
      viz: { concept: "none" },
      challenge: {
        starterHTML: PIE_HTML,
        starterCSS: PIE_CSS("#eef1f8"),
        task: "凡例に合わせて円グラフ（.pie）を描こう。真上から時計回りに、青（#2f5fd0）を 50%、緑（#2f9d5b）を 30%、黄土色（#b9791b）を残りの 20% にします。",
        snapshot: { props: ["background-image"] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "computedMatches", id: "pie", prop: "background-image", pattern: "^conic-gradient\\(", message: ".pie の background を conic-gradient(…) にしましょう" },
              {
                kind: "computedMatches",
                id: "pie",
                prop: "background-image",
                pattern: `^conic-gradient\\(${BLUE}[ ,]`,
                message: "真上から青（#2f5fd0）で始めましょう（from で回転させないでおきます）",
              },
              {
                kind: "computedMatches",
                id: "pie",
                prop: "background-image",
                pattern: `${BLUE}(?: \\S+)? (?:50%|180deg), ${GREEN}`,
                message: "青から緑へは 50%（半周）で切り替えましょう",
              },
              {
                kind: "computedMatches",
                id: "pie",
                prop: "background-image",
                pattern: `${GREEN}(?: \\S+)? (?:80%|288deg), ${OCHRE}(?: \\S+){0,2}(?:, ${OCHRE}(?: \\S+)?)?\\)$`,
                message: "緑から黄土色へは 80% で切り替え、最後まで黄土色にしましょう",
              },
            ],
          },
        ],
        hints: ["色ごとに始まりと終わりの位置を書きます（#2f5fd0 0% 50%）", "background: conic-gradient(#2f5fd0 0% 50%, #2f9d5b 50% 80%, #b9791b 80% 100%);"],
        solution: PIE_CSS("conic-gradient(#2f5fd0 0% 50%, #2f9d5b 50% 80%, #b9791b 80% 100%)"),
      },
    },
    {
      id: "gradient-oklch",
      title: "途中の色をくすませない: in oklch",
      explanation:
        "<p>グラデーションの途中の色は、16 進数や <code>rgb()</code> で書いた色どうしなら、既定では <b>sRGB</b> の赤・緑・青の数値をそのまま混ぜて作られます。青と黄色のように色相の離れた 2 色だと、途中が<b>灰色っぽくくすみます</b>（数値の平均が灰色に近いため）。</p><p><code>linear-gradient(to right in oklch, …)</code> のように <code>in 色空間</code> を書くと、その色空間で混ぜます。<code>oklch</code> は明るさ・鮮やかさ・色相で色を表すので、色相が回りながら移り、途中も鮮やかなまま（ここでは緑を通って）変わります。色相の回り方は <code>in oklch longer hue</code> のように指定でき、既定は近い向き（<code>shorter hue</code>）です。</p><p>Baseline 2024（Chrome 111 / Safari 16.2 / Firefox 127 以降で利用可）。対応していないブラウザでは値ごと無効になって背景が消えるので、必要なら in のないグラデーションを 1 行前に書いておきます。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/color-interpolation-method",
      viz: { concept: "none" },
      challenge: {
        starterHTML: BARS_HTML,
        starterCSS: BARS_CSS("linear-gradient(to right, #2f5fd0, #f5c400)"),
        task: "下の帯（.after）のグラデーションを oklch で混ぜて、途中がくすまないようにしよう。上の帯（.before）は比べるために既定のままにします。",
        snapshot: { props: ["background-image"] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "computedMatches", id: "after", prop: "background-image", pattern: "\\bin oklch\\b", message: "下の帯（.after）のグラデーションに in oklch を足しましょう" },
              {
                kind: "computedMatches",
                id: "after",
                prop: "background-image",
                // The direction and the interpolation method may come in either order.
                pattern: `^linear-gradient\\((?:(?:to right|90deg) in oklch(?: shorter hue)?|in oklch(?: shorter hue)? (?:to right|90deg)), ${BLUE}, rgb\\(245, 196, 0\\)\\)$`,
                message: "向き（to right）と 2 色（#2f5fd0 → #f5c400）はそのままにして、in oklch だけを足しましょう（longer hue だと虹色に回ります）",
              },
            ],
          },
          {
            kind: "computedEquals",
            id: "before",
            prop: "background-image",
            value: "linear-gradient(to right, rgb(47, 95, 208), rgb(245, 196, 0))",
            message: "比べられるように、上の帯（.before）は既定（sRGB）のままにしておきましょう",
          },
        ],
        hints: ["向きのあとに続けて「in 色空間」を書きます", "background: linear-gradient(to right in oklch, #2f5fd0, #f5c400);"],
        solution: BARS_CSS("linear-gradient(to right in oklch, #2f5fd0, #f5c400)"),
      },
    },
  ],
};
