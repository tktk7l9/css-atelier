import type { Track } from "./types.js";

// These media features describe the learner's own device, so a computed value
// would differ from machine to machine. The lessons read the CSS text instead:
// which rules sit inside which @media block.

const CARD_HTML = '<a data-id="card" class="card" href="#">料金プランを見る</a>';

const CARD_CSS =
  ".card {\n  display: block;\n  padding: 16px;\n  border-radius: 8px;\n  background: #dbe4fb;\n  color: #18203a;\n}\n";

const PULSE_HTML = '<div data-id="spot" class="spot">新着</div>';

const PULSE_CSS =
  "@keyframes pulse {\n  50% {\n    scale: 1.2;\n  }\n}\n.spot {\n  width: 80px;\n  padding: 8px;\n  border-radius: 8px;\n  background: #f5c400;\n  text-align: center;\n  animation: pulse 1s infinite;\n}\n";

const JUMP_HTML =
  '<p><a href="#a">料金へ</a></p><section data-id="a" id="a" class="block">料金</section>';

const JUMP_CSS = "html {\n  scroll-padding-top: 16px;\n}\n.block {\n  margin-top: 400px;\n  padding: 16px;\n  background: #eef1f8;\n}\n";

export const userPreferencesTrack: Track = {
  id: "user-preferences",
  title: "利用者の環境に合わせる（prefers-reduced-motion・hover・scroll-behavior）",
  summary: "動きを減らす設定を prefers-reduced-motion で尊重し、ホバーできない端末に効果が残らないよう @media (hover: hover) で囲み、スムーズスクロールも設定に合わせる。",
  emoji: "🌙",
  lessons: [
    {
      id: "prefers-reduced-motion",
      title: "動きを減らす設定を尊重する: prefers-reduced-motion",
      explanation:
        "<p>端末には、不要な動きを減らす設定があります。大きく動く拡大やパンは、前庭障害のある人に不快な症状を引き起こすことがあります。この設定は <code>@media (prefers-reduced-motion: reduce)</code> で調べられます。</p><p>動きが目的でないアニメーションは、この中で止めるか、控えめなものに替えます。逆に、<code>@media (prefers-reduced-motion: no-preference)</code> の中にアニメーションを書くと、設定がある人には最初から動きません。どちらの書き方でも構いません。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。自動のチェックは、書いた CSS で判定します（この端末の設定には左右されません）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion",
      viz: { concept: "none" },
      challenge: {
        starterHTML: PULSE_HTML,
        starterCSS: PULSE_CSS,
        task: "「新着」がずっと拡大と縮小を繰り返しています。動きを減らす設定の人には止まるよう、@media (prefers-reduced-motion: reduce) の中で .spot の animation を none にしよう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "sourceMatches",
            pattern:
              "@media\\s*\\(\\s*prefers-reduced-motion(\\s*:\\s*reduce)?\\s*\\)\\s*\\{\\s*\\.spot\\s*\\{[^}]*animation(-name)?\\s*:\\s*none|@media\\s*\\(\\s*prefers-reduced-motion\\s*:\\s*no-preference\\s*\\)\\s*\\{\\s*\\.spot\\s*\\{[^}]*animation\\s*:\\s*pulse",
            message: "動きを減らす設定で止まりません（@media (prefers-reduced-motion: reduce) の中に .spot { animation: none; } を書きます）",
          },
        ],
        hints: ["条件は @media (prefers-reduced-motion: reduce) です", "@media (prefers-reduced-motion: reduce) {\n  .spot {\n    animation: none;\n  }\n}"],
        solution: PULSE_CSS + "@media (prefers-reduced-motion: reduce) {\n  .spot {\n    animation: none;\n  }\n}\n",
      },
    },
    {
      id: "hover-media-feature",
      title: "ホバーできる端末だけ: @media (hover: hover)",
      explanation:
        "<p>タッチ操作が主な端末は、ホバーがしにくく、長押しなどでホバーをまねることがあります。<code>hover</code> のメディア特性は、<b>主な入力手段</b>がホバーしやすいかを調べます。値は、できる <code>hover</code> と、できないかしにくい <code>none</code> です。</p><p><code>:hover</code> のルールを <code>@media (hover: hover)</code> で囲むと、マウスなどの端末でだけ効きます。押せることはホバーの効果がなくても分かるように作っておきます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。自動のチェックは、書いた CSS で判定します。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/At-rules/@media/hover",
      viz: { concept: "none" },
      challenge: {
        starterHTML: CARD_HTML,
        starterCSS: CARD_CSS + ".card:hover {\n  background: #2f5fd0;\n  color: #fff;\n}\n",
        task: ".card:hover のルールを @media (hover: hover) で囲んで、ホバーできる端末でだけ効くようにしよう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "sourceMatches",
            pattern: "^(?![\\s\\S]*\\}\\s*\\.card:hover)[\\s\\S]*@media\\s*\\(\\s*hover(\\s*:\\s*hover)?\\s*\\)\\s*\\{\\s*\\.card:hover\\s*\\{",
            message: ".card:hover のルールを、@media (hover: hover) { … } の中へ移しましょう（外に残っていると、タッチの端末でも効きます）",
          },
        ],
        hints: ["ルールを新しく足すのではなく、今のルールを囲みます", "@media (hover: hover) {\n  .card:hover {\n    background: #2f5fd0;\n    color: #fff;\n  }\n}"],
        solution: CARD_CSS + "@media (hover: hover) {\n  .card:hover {\n    background: #2f5fd0;\n    color: #fff;\n  }\n}\n",
      },
    },
    {
      id: "scroll-behavior",
      title: "なめらかなスクロールも設定に合わせる: scroll-behavior",
      explanation:
        "<p><code>scroll-behavior: smooth</code> を <code>html</code> に指定すると、ページ内リンクなどで移動するときのスクロールがなめらかになります。効くのはリンクや API でのスクロールで、利用者が自分で動かすスクロールには効きません。<code>body</code> に書いてもページ全体には伝わりません。</p><p>ページ全体が動くのは大きな動きなので、動きを減らす設定の人には向きません。<code>@media (prefers-reduced-motion: no-preference)</code> の中に書いておけば、設定のない人にだけ効きます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能。Chrome 61・Firefox 36・Safari 15.4 から）。自動のチェックは、書いた CSS で判定します。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/scroll-behavior",
      viz: { concept: "none" },
      challenge: {
        starterHTML: JUMP_HTML,
        starterCSS: JUMP_CSS,
        task: "@media (prefers-reduced-motion: no-preference) の中で、html に scroll-behavior: smooth を指定しよう。",
        snapshot: { props: [] },
        validators: [
          {
            kind: "sourceMatches",
            pattern: "@media\\s*\\(\\s*prefers-reduced-motion\\s*:\\s*no-preference\\s*\\)\\s*\\{\\s*(html|:root)\\s*\\{[^}]*scroll-behavior\\s*:\\s*smooth",
            message: "@media (prefers-reduced-motion: no-preference) の中で、html に scroll-behavior: smooth を書きましょう",
          },
        ],
        hints: ["body ではなく html に書きます", "@media (prefers-reduced-motion: no-preference) {\n  html {\n    scroll-behavior: smooth;\n  }\n}"],
        solution: JUMP_CSS + "@media (prefers-reduced-motion: no-preference) {\n  html {\n    scroll-behavior: smooth;\n  }\n}\n",
      },
    },
  ],
};
