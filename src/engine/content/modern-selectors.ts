import type { Track } from "./types.js";

export const modernSelectorsTrack: Track = {
  id: "modern-selectors",
  title: "モダンセレクタ",
  summary: ":has() と :is() — 親を狙う / まとめて狙う新しい武器。",
  emoji: "✨",
  lessons: [
    {
      id: "modern-has",
      title: "親を狙う: :has()",
      explanation:
        "<p><code>:has()</code> は<b>「中に〜を含む」</b>要素を狙える、待望の“親セレクタ”です。<code>.card:has(.badge)</code> は <code>.badge</code> を含むカードだけにマッチします。</p>",
      mdnPath: "/ja/docs/Web/CSS/:has",
      viz: { concept: "none" },
      challenge: {
        starterHTML:
          '<div data-id="c1" class="card"><span class="badge">★</span> バッジ付き</div>\n<div data-id="c2" class="card">バッジなし</div>',
        starterCSS: ".card {\n  padding: 8px;\n  margin-bottom: 6px;\n}\n",
        task: "中に .badge を持つカードだけ、2px のボーダーを付けよう。",
        snapshot: { props: ["border-top-width"] },
        validators: [
          { kind: "sourceMatches", pattern: ":has\\(" },
          { kind: "computedEquals", id: "c1", prop: "border-top-width", value: "2px" },
          { kind: "computedEquals", id: "c2", prop: "border-top-width", value: "0px" },
        ],
        hints: [".card:has(.badge) というセレクタを使います", "border: 2px solid #335"],
        solution:
          ".card {\n  padding: 8px;\n  margin-bottom: 6px;\n}\n.card:has(.badge) {\n  border: 2px solid #335;\n}\n",
      },
    },
    {
      id: "modern-is",
      title: "まとめて狙う: :is()",
      explanation:
        "<p><code>:is(h2, h3)</code> は複数のセレクタを1つにまとめます。繰り返しが減り、読みやすくなります。</p>",
      mdnPath: "/ja/docs/Web/CSS/:is",
      viz: { concept: "none" },
      challenge: {
        starterHTML:
          '<h2 data-id="h2">見出し2</h2>\n<h3 data-id="h3">見出し3</h3>\n<p data-id="p">本文はそのまま</p>',
        starterCSS: "/* :is() で h2 と h3 をまとめて狙おう */\n",
        task: ":is() を使い、h2 と h3 の文字色をまとめて #2f5fd0 にしよう（本文 p は変えない）。",
        snapshot: { props: ["color"] },
        validators: [
          { kind: "sourceMatches", pattern: ":is\\(" },
          { kind: "computedMatches", id: "h2", prop: "color", pattern: "47[,\\s]+95[,\\s]+208" },
          { kind: "computedMatches", id: "h3", prop: "color", pattern: "47[,\\s]+95[,\\s]+208" },
        ],
        hints: [":is(h2, h3) { … } の形にします", "color: #2f5fd0"],
        solution: ":is(h2, h3) {\n  color: #2f5fd0;\n}\n",
      },
    },
  ],
};
