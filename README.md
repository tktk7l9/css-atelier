# CSS Atelier — 手を動かして学ぶ CSS

MDN の CSS ドキュメントを片手に、**解説を読んで → 実際に CSS を書いて → 自動採点**で学べるインタラクティブ学習アプリ。Flexbox / Grid はもちろん、`:has()` や container queries などモダンな機能まで。製図スタジオ風の明るい UI と、概念を立体で見せる 3D ビジュアライザ（Three.js）付き。

**▶ [Play Now](https://css-atelier.saitotakuya0719.workers.dev/)**

## 特徴

- **ハイブリッド形式** — 各レッスンは「短い解説 → チャレンジ」。お題のレイアウトになるよう CSS を書くと自動で採点します（Flexbox Froggy / Grid Garden スタイル）。
- **3D 概念ビジュアライザ** — ボックスモデルを4層に分解、Flexbox の主軸/交差軸を矢印で、Grid のトラックを立体で表示。3D 変形では面の配置（flat で押しつぶされるか、preserve-3d で立体になるか）と、perspective の目の位置から画面への視線を表示。学習者の CSS をライブ反映します。
- **ライブプレビュー** — 書いた CSS は即座に隔離されたサンドボックスに反映。シンタックスハイライト付きエディタ。
- **78 トラック・221 レッスン** — セレクタ / 結合子（> + ~） / 何番目かで選ぶ（:nth-child・:last-child） / 何番目かの応用（of S・:only-child・:first-of-type） / ボックスモデル / 幅の決まり方（box-sizing・width: auto・max-width: 100%） / マージンの相殺（兄弟・親子・flex と gap） / 行の中の箱（inline-block・画像のすき間・line-height） / 単位 / 単位の使い分け（calc()・rem・dvh） / 継承とキーワード（inherit・currentColor・revert） / カスタムプロパティ / カスタムプロパティの応用（部品ごとの上書き・受け継ぎ・calc） / 色 / 色の合成と派生（color-mix・相対色・light-dark） / グラデーション（repeating-linear-gradient・conic-gradient・in oklch） / 背景画像の置き方（background-size: cover・no-repeat と位置・背景の重ね） / 枠線と影（outline・box-shadow・border-radius） / 読みやすい改行（text-wrap: balance・pretty） / 文字のはみ出し（text-overflow・-webkit-line-clamp・overflow-wrap） / 文字の組み方（text-indent・負の text-indent でぶら下げ・text-underline-offset） / 文字の飾り（text-shadow・傍点の text-emphasis・text-transform） / 空白と改行（pre-line・nowrap・tab-size） / モダンセレクタ / :has() の応用（後ろの要素・子の数・空の状態） / 詳細度（ID・クラス・要素の比べ方・:where()・:is()） / 生成コンテンツ（::before・::after・属性セレクタ・CSS カウンター） / リストの印（list-style: none・list-style-type の文字列・list-style-position） / ネスト / ネストの応用（&.is-active・入れ子の @media・.is-dark &） / スコープ付きスタイル（@scope） / Flexbox / Flexbox の応用（flex-wrap・flex-shrink: 0・margin-left: auto） / flex の伸び方と順番（flex の比・flex-basis・order） / Grid / グリッドでそろえる（place-items・place-self・place-content） / グリッドの応用（repeat(auto-fill, minmax())・grid-column: 1 / -1・minmax(0, 1fr)） / グリッドの配置（span・dense・同じマスに重ねる） / ページのグリッド（名前付きの線・auto-fit・下端のフッター） / カードの並び（ボタンを下端に・高さをそろえる・最後の行） / サブグリッド / 中身に合わせた幅（max-content・min-content・fit-content） / 段組み（columns・column-span・break-inside） / 表のレイアウト（border-collapse・table-layout: fixed・caption-side） / 論理プロパティ / 縦書き（writing-mode・text-orientation・縦中横） / 絶対配置（position: relative・inset・inset-inline-end） / 隠し方の使い分け（visibility・hidden 属性・visually-hidden） / 重なり順（z-index・重ね合わせコンテキスト・isolation） / 押せる範囲（pointer-events・カード全体のリンク・44px） / 重なりの落とし穴（scale・opacity の重ね合わせコンテキスト・opacity: 0 でも押せる） / 押しやすさの工夫（行全体のリンク・広げたリンクの上のボタン・インラインの上下の padding） / 回り込みと図形（float・shape-outside: circle()・shape-margin） / フロートを囲む・下げる（flow-root・clear・display: contents） / アスペクト比 / 画像の収め方（object-fit・object-position） / アンカーポジショニング / スクロールする領域（max-height・overflow-x・min-height: 0） / スクロール追従（position: sticky） / スクロールスナップ / メディアクエリ / コンテナクエリ / コンテナクエリの応用（cqi・container-name・幅がつぶれる落とし穴） / 機能クエリ（@supports not・selector()・or） / カスケードレイヤー / レイヤーの応用（レイヤーの外・順番の宣言・!important） / クリップとマスク（clip-path・mask-image） / フィルターと合成（filter・backdrop-filter・mix-blend-mode） / フォームの見た目（accent-color・appearance・:user-invalid） / フォームの状態で選ぶ（:disabled・:read-only・:default） / ARIA の状態で見た目を変える（aria-current・aria-expanded・aria-pressed） / トランジション / 変形の中心と組み合わせ（transform-origin・rotate と scale のプロパティ・translate: -50%） / 3D 変形（perspective・preserve-3d・backface-visibility） / キーフレームアニメーション（@keyframes・steps()・animation-fill-mode） / 出現と退場のアニメーション（@starting-style・allow-discrete） / 型付きカスタムプロパティ（@property） / CSS の数学関数（round()・mod()・sin()/cos()）。
- **MDN の現在の構成にリンク** — 各レッスンの「MDN でもっと学ぶ」は 2025 年に再編された `Reference/` `Guides/` 配下のページを直接指します。Baseline でない機能・新しめの機能は、レッスン内に対応ブラウザを明記しています。
- **二状態バリデーション** — メディア/コンテナクエリ等は複数のビューポート幅で採点し、「無条件に書いただけ」では通らないようにしています。
- **スクロールした状態も採点** — sticky のレッスンは、プレビューがスクロールの終わりから始まる（`column-reverse` / `row-reverse` の仕掛け）ので、スクリプトなしで「貼り付いたか」を位置で判定します。プレビューを動かして確かめても、結果は変わりません。
- **動きも採点** — キーフレームのレッスンは、同じアニメーションを決まった時刻で止めたコマ（負の `animation-delay` と `animation-play-state: paused`）を並べて見せるので、スクリプトなしで、動きの途中の位置を毎回同じ値で判定します。「動きを再生」にチェックを入れると、実際の動きも確かめられます。
- **寛容な採点** — 多くの課題は「どう書いたか」ではなく「正しく表示されたか」（要素の位置・サイズ）で判定するため、複数の正解を許容します。
- **進捗と下書きの保存** — 完了状況と書きかけの CSS（レッスンごと）は localStorage に保存。カタログの「続きから学ぶ」で最後に完了したレッスンの次へ（SHIG 12, 20）。完了済みのレッスンは見出し横に表示。レッスンは URL ハッシュで共有可能。
- **取り消せる操作** — 「リセット」「解答を見る」は確認なしで実行し、直後の「元に戻す」で書いた CSS に戻せます（SHIG 57, 54）。
- **結果はいまのコードのもの** — CSS を書き換えると前回の採点結果は消え、クリア後は「次のレッスン」だけが主ボタンになります。失敗時は「現在 0px」のように今の値を添えます（SHIG 25, 47, 55）。
- **アクセシビリティ / PWA** — `prefers-reduced-motion` 対応、オフライン動作、ライトテーマ。

## 仕組み（設計のキモ）

学習者の自由記述 CSS は、同一オリジンの `<iframe srcdoc>` に **constructable stylesheet**（`adoptedStyleSheets` + `replaceSync`）で注入します。これは厳格な CSP（`style-src 'self'`、`unsafe-inline` なし）でもブロックされないため、**セキュリティを緩めずに**任意の CSS をライブ適用できます。iframe なので `body`/`*`/`@media`/`@container` が実ビューポートに対し忠実に動き、同一オリジンなので `getComputedStyle` / `getBoundingClientRect` を読んで採点できます。重なり順や押せる範囲は、レッスンが指定した点で `elementFromPoint` を呼び、いちばん手前の要素（押したときに反応する要素）を記録して採点します。

採点ロジックは純粋関数（`src/engine/`）。サンドボックスが読み取った **Snapshot**（プレーンデータ）を検証器に渡すだけなので、Node 上で 100% テストできます。

最初に読み込むのはカタログ（トラック名・レッスン名）だけです。各トラックの解説・お題・採点はトラックごとのチャンクに分かれ（`src/engine/content/index.ts` の `import()`）、開いたレッスンのトラックだけを読み込みます。読み込みが終わるまで今の画面を表示したままにするので、空の画面は挟みません。サービスワーカーはインストール時にレッスン実行部と全トラックのチャンクを先にキャッシュするので、オンラインで開いたことのないレッスンもオフラインで開けます。トラックのモジュールが初回ロードに混ざるとビルドが失敗します（`vite.config.ts`）。

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
  main.ts            軽量ブートストラップ（カタログ + ルーティング、app.ts とトラックを遅延 import）
  app.ts             レッスン実行（エディタ↔サンドボックス↔採点↔3D。Three.js を含む遅延チャンク）
  sw.js              サービスワーカーのひな形（ビルドで先読みするチャンクの一覧を埋めて /sw.js に出力）
  engine/            純ロジック（100% カバレッジゲート）
    content/         トラック・レッスン・チャレンジ（純データ）+ 不変条件テスト。index.ts はカタログとトラックごとの遅延 import
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
