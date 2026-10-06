import type { Track } from "./types.js";

// clip-path and mask-image leave the layout box untouched (the rect does not
// change), so these lessons read the computed values. The patterns accept the
// spellings browsers serialize differently: 0 / 0px / 0%, an explicit
// `at 50% 50%`, and transparent / rgba(…, 0).
const ZERO = "0(?:px|%)?";

const PHOTO_CSS =
  ".photo {\n  display: inline-grid;\n  place-items: center;\n  width: 200px;\n  height: 120px;\n  margin: 0 8px 8px 0;\n  color: #fff;\n  font-weight: 700;\n  background: linear-gradient(160deg, #ffd27a, #ff8a65 40%, #7b5cd6 75%, #2f5fd0);\n}\n.oval {\n  border-radius: 50%;\n}\n";

const TAG_CSS = (extra: string): string =>
  `.tag {\n  display: flex;\n  align-items: center;\n  width: 180px;\n  height: 48px;\n  padding-left: 16px;\n  color: #fff;\n  font-weight: 700;\n  background: #2f5fd0;\n${extra}}\n`;

const EXCERPT_CSS = (extra: string): string =>
  `.excerpt {\n  width: 260px;\n  height: 110px;\n  overflow: hidden;\n  line-height: 1.7;\n${extra}}\n.excerpt p {\n  margin: 0;\n}\n.more {\n  color: #2f5fd0;\n}\n`;

export const clipMaskTrack: Track = {
  id: "clip-mask",
  title: "クリップとマスク",
  summary: "clip-path と mask-image で、要素を好きなかたちに切り抜く・ぼかして消す。",
  emoji: "✂️",
  lessons: [
    {
      id: "clip-circle",
      title: "円で切り抜く: clip-path: circle()",
      explanation:
        "<p><code>clip-path</code> は、要素の<b>見せる範囲</b>をかたちで指定します。範囲の外は描かれませんが、レイアウト上の大きさはそのままです。<code>circle(半径 at 中心)</code> は円で切り抜きます。</p><p>半径を省略すると <code>closest-side</code>（中心からいちばん近い辺までの距離）になるので、<code>circle()</code> だけで<b>短い辺いっぱいの真円</b>になります。<code>border-radius: 50%</code> は横長の要素だと楕円になりますが、clip-path なら横長でも真円です。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/clip-path",
      viz: { concept: "none" },
      challenge: {
        starterHTML:
          '<div data-id="oval" class="photo oval">border-radius</div><div data-id="round" class="photo round">clip-path</div>',
        starterCSS: PHOTO_CSS + ".round {\n  \n}\n",
        task: "右の写真（.round）を clip-path の circle() で切り抜いて、高さいっぱいの真円にしよう。左の border-radius: 50% は、横長の要素だと楕円になります。",
        snapshot: { props: ["clip-path"] },
        validators: [
          // allOf reports only the first unmet step, so a fresh starter gets one message.
          {
            kind: "allOf",
            of: [
              { kind: "computedMatches", id: "round", prop: "clip-path", pattern: "^circle\\(", message: ".round に clip-path: circle() を指定しましょう" },
              {
                kind: "computedMatches",
                id: "round",
                prop: "clip-path",
                // circle() / circle(closest-side) / circle(60px), optionally at the centre.
                pattern: "^circle\\(\\s*(?:closest-side|60px)?\\s*(?:at\\s+(?:50%\\s+50%|center(?:\\s+center)?))?\\s*\\)$",
                message: "半径を省略して（closest-side）、短い辺いっぱいの円にしましょう（50% だと上下が切れます）",
              },
            ],
          },
        ],
        hints: [
          "clip-path: circle() と半径を省略すると、中心からいちばん近い辺までが半径（closest-side）になります",
          "clip-path: circle();",
        ],
        solution: PHOTO_CSS + ".round {\n  clip-path: circle();\n}\n",
      },
    },
    {
      id: "clip-polygon",
      title: "多角形で切り抜く: clip-path: polygon()",
      explanation:
        "<p><code>polygon()</code> は、頂点の座標を<b>「横 縦」の組</b>にしてカンマ区切りで並べ、それを結んだ多角形で切り抜きます。座標は要素の左上が <code>0 0</code>、右下が <code>100% 100%</code> です。</p><p><code>polygon(50% 0, 100% 100%, 0 100%)</code> なら、上の辺の中央・右下・左下を結んだ三角形。頂点を増やせば、矢印や吹き出しのように <code>border-radius</code> では作れないかたちも、画像なしで作れます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Values/basic-shape/polygon",
      viz: { concept: "none" },
      challenge: {
        starterHTML: '<div data-id="tag" class="tag">セール開催中</div>',
        starterCSS: TAG_CSS(""),
        task: "ラベル（.tag）を、右端がとがった矢印のかたちに切り抜こう。頂点は左上から時計回りに 0 0・85% 0・100% 50%・85% 100%・0 100% の 5 つです。",
        snapshot: { props: ["clip-path"] },
        validators: [
          {
            kind: "allOf",
            of: [
              { kind: "computedMatches", id: "tag", prop: "clip-path", pattern: "^polygon\\(", message: ".tag に clip-path: polygon(…) を指定しましょう" },
              {
                kind: "computedMatches",
                id: "tag",
                prop: "clip-path",
                pattern: `^polygon\\((?:nonzero,\\s*)?${ZERO}\\s+${ZERO},\\s*85%\\s+${ZERO},\\s*100%\\s+50%,\\s*85%\\s+100%,\\s*${ZERO}\\s+100%\\)$`,
                message: "頂点の座標と順番を見直しましょう（0 0, 85% 0, 100% 50%, 85% 100%, 0 100%）",
              },
            ],
          },
        ],
        hints: [
          "座標は「横 縦」の組をカンマで区切って並べます。左上が 0 0、右下が 100% 100% です",
          "clip-path: polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%);",
        ],
        solution: TAG_CSS("  clip-path: polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%);\n"),
      },
    },
    {
      id: "mask-fade",
      title: "ふわっと消す: mask-image",
      explanation:
        "<p><code>mask-image</code> は、画像やグラデーションを<b>マスク（型紙）</b>として重ね、マスクが<b>不透明なところだけ</b>要素を見せます。透明なところは消え、半透明なところは半分透けます。効くのはマスクの不透明度で、色は関係ありません。</p><p><code>mask-image: linear-gradient(black 60%, transparent)</code> なら、上から 60% まではそのまま見せて、下へ向かってふわっと消せます。長い文章の「続きを読む」の手前でよく使う表現です。clip-path がくっきり切り抜くのに対して、マスクはぼけた境目を作れます。</p><p>接頭辞なしの <code>mask-image</code> は Chrome 120 / Firefox 53 / Safari 15.4 以降で使えます（Baseline: 広く利用可能。2023 年 12 月に主要ブラウザがそろいました）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/mask-image",
      viz: { concept: "none" },
      challenge: {
        starterHTML:
          '<div data-id="excerpt" class="excerpt"><p>春の畑は、土を起こすところから始まります。冬のあいだに固くなった土を深く耕し、堆肥を混ぜて一週間ほど寝かせると、苗の根がよく張るふかふかの土になります。</p></div><a class="more" href="#">続きを読む</a>',
        starterCSS: EXCERPT_CSS(""),
        task: "抜粋（.excerpt）の下のほうが、だんだん透けて消えるようにしよう。mask-image に、上から 60% までは不透明（black）、下端で透明（transparent）になる linear-gradient を指定します。",
        snapshot: { props: ["mask-image"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "computedMatches",
                id: "excerpt",
                prop: "mask-image",
                pattern: "^linear-gradient\\(",
                message: ".excerpt に mask-image: linear-gradient(…) を指定しましょう",
              },
              {
                kind: "computedMatches",
                id: "excerpt",
                prop: "mask-image",
                // An opaque colour up to 60%, fully transparent at the bottom edge.
                pattern:
                  "^linear-gradient\\((?:to bottom,\\s*|180deg,\\s*)?rgba?\\(\\d+,\\s*\\d+,\\s*\\d+(?:,\\s*1)?\\)\\s+60%,\\s*(?:rgba\\(\\d+,\\s*\\d+,\\s*\\d+,\\s*0\\)|transparent)(?:\\s+100%)?\\)$",
                message: "上から 60% までは不透明な色（black）、下端は透明（transparent）にしましょう",
              },
            ],
          },
        ],
        hints: [
          "マスクは不透明なところだけ要素を見せます。色は何でもよく、効くのは不透明度です",
          "mask-image: linear-gradient(black 60%, transparent);",
        ],
        solution: EXCERPT_CSS("  mask-image: linear-gradient(black 60%, transparent);\n"),
      },
    },
  ],
};
