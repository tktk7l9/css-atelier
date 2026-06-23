# CSS Atelier — 手を動かして学ぶ CSS

MDN の CSS ドキュメントを片手に、**解説を読んで → 実際に CSS を書いて → 自動採点**で学べるインタラクティブ学習アプリ。Flexbox / Grid はもちろん、`:has()` や container queries などモダンな機能まで。製図スタジオ風の明るい UI と、概念を立体で見せる 3D ビジュアライザ（Three.js）付き。

**▶ [Play Now](https://css-atelier.vercel.app/)**

## 特徴

- **ハイブリッド形式** — 各レッスンは「短い解説 → チャレンジ」。お題のレイアウトになるよう CSS を書くと自動で採点します（Flexbox Froggy / Grid Garden スタイル）。
- **3D 概念ビジュアライザ** — ボックスモデルを4層に分解、Flexbox の主軸/交差軸を矢印で、Grid のトラックを立体で表示。学習者の CSS をライブ反映します。
- **ライブプレビュー** — 書いた CSS は即座に隔離されたサンドボックスに反映。シンタックスハイライト付きエディタ。
- **15 トラック・33 レッスン** — セレクタ / ボックスモデル / 単位 / カスタムプロパティ / 色 / モダンセレクタ / ネスト / Flexbox / Grid / 論理プロパティ / アスペクト比 / メディアクエリ / コンテナクエリ / カスケードレイヤー / トランジション。
- **寛容な採点** — 多くの課題は「どう書いたか」ではなく「正しく表示されたか」（要素の位置・サイズ）で判定するため、複数の正解を許容します。
- **進捗の保存** — 完了状況は localStorage に保存。レッスンは URL ハッシュで共有可能。
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
  sandbox/           srcdoc iframe + constructable stylesheet（採点の I/O 境界）
  viz/               Three.js 概念ビジュアライザ（製図ブルー・bloom なし）
  ui/                DOM ヘルパー / エディタ / カタログ
```

## 技術スタック

Vanilla TypeScript · Vite · Three.js · Vitest（フレームワーク・ルーター・リンタなし、strict `tsc` のみ）。`engine` 層は 100% テスト、DOM / iframe / WebGL は presentation 層として対象外。

## セキュリティ

外部スタイルシートのみ・厳格な CSP（`vercel.json`、`unsafe-inline` / `unsafe-eval` なし）・`frame-ancestors 'none'`・HSTS。サンドボックス iframe は `allow-same-origin` のみ（スクリプト不可、CSS だけを注入）。
