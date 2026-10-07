# CSS Atelier — 手を動かして学ぶ CSS

MDN の CSS ドキュメントを片手に、**解説を読んで → 実際に CSS を書いて → 自動採点**で学べるインタラクティブ学習アプリ。Flexbox / Grid はもちろん、`:has()` や container queries などモダンな機能まで。製図スタジオ風の明るい UI と、概念を立体で見せる 3D ビジュアライザ（Three.js）付き。

**▶ [Play Now](https://css-atelier.saitotakuya0719.workers.dev/)**

## 特徴

- **ハイブリッド形式** — 各レッスンは「短い解説 → チャレンジ」。お題のレイアウトになるよう CSS を書くと自動で採点します（Flexbox Froggy / Grid Garden スタイル）。
- **3D 概念ビジュアライザ** — ボックスモデルを4層に分解、Flexbox の主軸/交差軸を矢印で、Grid のトラックを立体で表示。3D 変形では面の配置（flat で押しつぶされるか、preserve-3d で立体になるか）と、perspective の目の位置から画面への視線を表示。学習者の CSS をライブ反映します。
- **ライブプレビュー** — 書いた CSS は即座に隔離されたサンドボックスに反映。シンタックスハイライト付きエディタ。
- **39 トラック・104 レッスン** — セレクタ / ボックスモデル / 単位 / カスタムプロパティ / 色 / 色の合成と派生（color-mix・相対色・light-dark） / グラデーション（repeating-linear-gradient・conic-gradient・in oklch） / 読みやすい改行（text-wrap: balance・pretty） / 文字のはみ出し（text-overflow・-webkit-line-clamp・overflow-wrap） / モダンセレクタ / :has() の応用（後ろの要素・子の数・空の状態） / ネスト / スコープ付きスタイル（@scope） / Flexbox / Grid / グリッドでそろえる（place-items・place-self・place-content） / サブグリッド / 中身に合わせた幅（max-content・min-content・fit-content） / 論理プロパティ / 縦書き（writing-mode・text-orientation・縦中横） / 絶対配置（position: relative・inset・inset-inline-end） / アスペクト比 / 画像の収め方（object-fit・object-position） / アンカーポジショニング / スクロール追従（position: sticky） / スクロールスナップ / メディアクエリ / コンテナクエリ / 機能クエリ（@supports not・selector()・or） / カスケードレイヤー / クリップとマスク（clip-path・mask-image） / フィルターと合成（filter・backdrop-filter・mix-blend-mode） / フォームの見た目（accent-color・appearance・:user-invalid） / トランジション / 変形の中心と組み合わせ（transform-origin・rotate と scale のプロパティ・translate: -50%） / 3D 変形（perspective・preserve-3d・backface-visibility） / 出現と退場のアニメーション（@starting-style・allow-discrete） / 型付きカスタムプロパティ（@property） / CSS の数学関数（round()・mod()・sin()/cos()）。
- **MDN の現在の構成にリンク** — 各レッスンの「MDN でもっと学ぶ」は 2025 年に再編された `Reference/` `Guides/` 配下のページを直接指します。Baseline でない機能・新しめの機能は、レッスン内に対応ブラウザを明記しています。
- **二状態バリデーション** — メディア/コンテナクエリ等は複数のビューポート幅で採点し、「無条件に書いただけ」では通らないようにしています。
- **スクロールした状態も採点** — sticky のレッスンは、プレビューがスクロールの終わりから始まる（`column-reverse` / `row-reverse` の仕掛け）ので、スクリプトなしで「貼り付いたか」を位置で判定します。プレビューを動かして確かめても、結果は変わりません。
- **寛容な採点** — 多くの課題は「どう書いたか」ではなく「正しく表示されたか」（要素の位置・サイズ）で判定するため、複数の正解を許容します。
- **進捗と下書きの保存** — 完了状況と書きかけの CSS（レッスンごと）は localStorage に保存。カタログの「続きから学ぶ」で最後に完了したレッスンの次へ（SHIG 12, 20）。完了済みのレッスンは見出し横に表示。レッスンは URL ハッシュで共有可能。
- **取り消せる操作** — 「リセット」「解答を見る」は確認なしで実行し、直後の「元に戻す」で書いた CSS に戻せます（SHIG 57, 54）。
- **結果はいまのコードのもの** — CSS を書き換えると前回の採点結果は消え、クリア後は「次のレッスン」だけが主ボタンになります。失敗時は「現在 0px」のように今の値を添えます（SHIG 25, 47, 55）。
- **アクセシビリティ / PWA** — `prefers-reduced-motion` 対応、オフライン動作、ライトテーマ。

## 仕組み（設計のキモ）

学習者の自由記述 CSS は、同一オリジンの `<iframe srcdoc>` に **constructable stylesheet**（`adoptedStyleSheets` + `replaceSync`）で注入します。これは厳格な CSP（`style-src 'self'`、`unsafe-inline` なし）でもブロックされないため、**セキュリティを緩めずに**任意の CSS をライブ適用できます。iframe なので `body`/`*`/`@media`/`@container` が実ビューポートに対し忠実に動き、同一オリジンなので `getComputedStyle` / `getBoundingClientRect` を読んで採点できます。

採点ロジックは純粋関数（`src/engine/`）。サンドボックスが読み取った **Snapshot**（プレーンデータ）を検証器に渡すだけなので、Node 上で 100% テストできます。

## 起動

```bash
npm install
npm run dev      # http://localhost:5173
```

## 開発

```bash
npm run typecheck   # strict TypeScript
npm run test        # Vitest
npm run coverage    # src/engine を 100% ゲート
npm run build       # tsc --noEmit && vite build
```

### 構成

```
src/
  main.ts            軽量ブートストラップ（カタログ + ルーティング、app.ts を遅延 import）
  app.ts             レッスン実行（エディタ↔サンドボックス↔採点↔3D。Three.js を含む遅延チャンク）
  engine/            純ロジック（100% カバレッジゲート）
    content/         トラック・レッスン・チャレンジ（純データ）+ 不変条件テスト
    validate/        Snapshot 型 / 検証プリミティブ / CSS パーサ / 実行
    editor/          シンタックスハイライト用トークナイザ
    viz-map.ts       Snapshot → 3D シグナルの純変換
    progress.ts      進捗の永続化（ストア注入）
    drafts.ts        レッスンごとの下書き CSS（ストア注入）
    navigation.ts    現在地・続きから・表示ラベル
  sandbox/           srcdoc iframe + constructable stylesheet（採点の I/O 境界）
  viz/               Three.js 概念ビジュアライザ（製図ブルー・bloom なし）
  ui/                DOM ヘルパー / エディタ / カタログ
```

## 技術スタック

Vanilla TypeScript · Vite · Three.js · Vitest（フレームワーク・ルーター・リンタなし、strict `tsc` のみ）。`engine` 層は 100% テスト、DOM / iframe / WebGL は presentation 層として対象外。

## セキュリティ

外部スタイルシートのみ・厳格な CSP（`public/_headers`、`unsafe-inline` / `unsafe-eval` なし）・`frame-ancestors 'none'`・HSTS。サンドボックス iframe は `allow-same-origin` のみ（スクリプト不可、CSS だけを注入）。プレビュー内のリンクのクリックやフォームの送信は、親が iframe の document で既定の動作を止めるので、iframe がレッスンから離れてアプリ自身を読み込もうとする（`frame-ancestors 'none'` で拒否される）ことはありません。

## ホスティング

本番は **Cloudflare Workers (static assets)**: https://css-atelier.saitotakuya0719.workers.dev

2026-08-11、Vercel 無料枠の超過でアカウントが停止（全プロジェクトが
`402 DEPLOYMENT_DISABLED`）したため移行した。ビルド成果物は純粋な静的
ファイルなので Worker スクリプトは無く、`wrangler.jsonc` の `assets` だけで
配信している。セキュリティヘッダーは `public/_headers`（Vercel 時代の
`vercel.json` から移植したもの。`vercel.json` 自体はその後削除済み）。
`npm run deploy` で build + wrangler deploy。
