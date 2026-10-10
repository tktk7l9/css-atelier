import type { Lesson, LessonMeta, Track, TrackId, TrackMeta } from "./types.js";

/**
 * Catalogue order, roughly basics → modern → layout → responsive → polish.
 * Gradients follow the colour tracks (in oklch builds on oklch()), writing
 * modes follow logical properties, and sticky comes before scroll snap (whose
 * scroll-padding lesson uses a sticky header) and after grid (its sidebar
 * lesson is a grid item). Text overflow follows text wrapping, the :has()
 * patterns follow the :has() basics in modern selectors, object-fit follows
 * aspect ratio, and feature queries join the other conditional rules after
 * container queries. Grid alignment follows grid; intrinsic sizes come after
 * subgrid (their label column is a grid track); absolute positioning follows
 * logical properties and writing modes (its last lesson uses the logical
 * insets) and precedes anchor positioning and sticky, which build on it. The
 * 2D transform track sits between transitions and 3D transforms, and comes
 * after positioning (its needle and labels are absolutely positioned). The
 * math functions come last: their lessons build on custom properties,
 * transitions and transforms from earlier tracks. Multi-column and table
 * layout follow the intrinsic sizes (the remaining layout modes), and the
 * float / shape track follows absolute positioning: both take a box out of
 * the normal flow.
 *
 * This catalogue (titles, summaries, emoji and lesson titles) is all the first
 * screen needs, so it is the only content in the initial bundle. Each track's
 * lessons load with its module (see LOADERS); content.test.ts checks that the
 * two agree.
 */
export const TRACKS: readonly TrackMeta[] = [
  {
    id: "selectors",
    title: "セレクタの基礎",
    summary: "要素をどう狙うか。クラス・子孫・擬似クラスの基本。",
    emoji: "🎯",
    lessons: [
      { id: "selectors-class", title: "クラスで狙う" },
      { id: "selectors-descendant", title: "子孫セレクタで絞り込む" },
      { id: "selectors-first-child", title: "擬似クラス: :first-child" },
    ],
  },
  {
    id: "box-model",
    title: "ボックスモデル",
    summary: "content・padding・border・margin の4層を理解する。",
    emoji: "📦",
    lessons: [
      { id: "box-model-padding", title: "内側の余白: padding" },
      { id: "box-model-border", title: "枠線: border" },
      { id: "box-model-margin-auto", title: "外側の余白で中央寄せ: margin auto" },
    ],
  },
  {
    id: "units",
    title: "単位と関数値",
    summary: "% ・ clamp() ・ min() — 柔軟なサイズ指定。",
    emoji: "📐",
    lessons: [
      { id: "units-percent", title: "親に対する割合: %" },
      { id: "units-clamp", title: "下限・推奨・上限: clamp()" },
      { id: "units-min", title: "小さい方を採用: min()" },
    ],
  },
  {
    id: "custom-props",
    title: "カスタムプロパティ",
    summary: "CSS 変数で値を一元管理し、var() で再利用する。",
    emoji: "🎨",
    lessons: [
      { id: "custom-props-define", title: "変数を定義して使う: --x と var()" },
      { id: "custom-props-fallback", title: "フォールバック付き var()" },
    ],
  },
  {
    id: "color",
    title: "色の指定",
    summary: "hsl() と oklch() — 直感的・知覚均等なモダンカラー。",
    emoji: "🌈",
    lessons: [
      { id: "color-hsl", title: "色相・彩度・明度: hsl()" },
      { id: "color-oklch", title: "知覚均等な色: oklch()" },
    ],
  },
  {
    id: "color-functions",
    title: "色の合成と派生",
    summary: "color-mix()・相対色・light-dark() — 1 つの色から配色を組み立てる。",
    emoji: "🧪",
    lessons: [
      { id: "color-mix", title: "色を混ぜる: color-mix()" },
      { id: "color-relative", title: "元の色から派生させる: 相対色構文" },
      { id: "color-light-dark", title: "明暗テーマを 1 行で: light-dark()" },
    ],
  },
  {
    id: "gradients",
    title: "グラデーション",
    summary: "repeating-linear-gradient・conic-gradient・in oklch で、しま模様や円グラフ、色の移り変わりを画像なしで。",
    emoji: "🌅",
    lessons: [
      { id: "gradient-stripes", title: "しま模様: repeating-linear-gradient()" },
      { id: "gradient-conic", title: "円グラフ: conic-gradient()" },
      { id: "gradient-oklch", title: "途中の色をくすませない: in oklch" },
    ],
  },
  {
    id: "text-wrap",
    title: "読みやすい改行",
    summary: "text-wrap: balance / pretty で、見出しと本文の折り返しを整える。",
    emoji: "📝",
    lessons: [
      { id: "text-wrap-balance", title: "見出しの行をそろえる: text-wrap: balance" },
      { id: "text-wrap-pretty", title: "本文の最後の 1 語を救う: text-wrap: pretty" },
    ],
  },
  {
    id: "text-overflow",
    title: "文字のはみ出し",
    summary: "text-overflow・-webkit-line-clamp・overflow-wrap で、長いタイトルや文章、URL を枠に収める。",
    emoji: "📰",
    lessons: [
      { id: "overflow-ellipsis", title: "1 行で省略する: text-overflow: ellipsis" },
      { id: "overflow-line-clamp", title: "3 行で省略する: -webkit-line-clamp" },
      { id: "overflow-wrap-anywhere", title: "長い URL を折り返す: overflow-wrap: anywhere" },
    ],
  },
  {
    id: "modern-selectors",
    title: "モダンセレクタ",
    summary: ":has() と :is() — 親を狙う / まとめて狙う新しい武器。",
    emoji: "✨",
    lessons: [
      { id: "modern-has", title: "親を狙う: :has()" },
      { id: "modern-is", title: "まとめて狙う: :is()" },
    ],
  },
  {
    id: "has-patterns",
    title: ":has() の応用",
    summary: ":has() で、後ろに続く要素・子の数・中身がないことに応じて、HTML を変えずにスタイルを切り替える。",
    emoji: "🔗",
    lessons: [
      { id: "has-sibling", title: "後ろの要素で選ぶ: :has(+ …)" },
      { id: "has-quantity", title: "数に応じて切り替える: :has(> :nth-child(n))" },
      { id: "has-empty", title: "ないときだけ表示する: :not(:has())" },
    ],
  },
  {
    id: "nesting",
    title: "ネスト",
    summary: "& を使って入れ子でルールを書く（プリプロセッサ不要）。",
    emoji: "🪆",
    lessons: [
      { id: "nesting-amp", title: "入れ子で書く: & とネスト" },
    ],
  },
  {
    id: "scope",
    title: "スコープ付きスタイル",
    summary: "@scope で、スタイルが届く範囲を DOM の部分木に区切る。",
    emoji: "🔭",
    lessons: [
      { id: "scope-root", title: "範囲を決める: @scope (ルート)" },
      { id: "scope-donut", title: "穴のあいた範囲: @scope (…) to (…)" },
      { id: "scope-proximity", title: "近いほうが勝つ: スコープの近さ" },
    ],
  },
  {
    id: "flexbox",
    title: "Flexbox",
    summary: "1次元レイアウトの定番。主軸と交差軸で要素をそろえる。",
    emoji: "🪡",
    lessons: [
      { id: "flexbox-justify-center", title: "主軸でそろえる: justify-content" },
      { id: "flexbox-align-center", title: "交差軸でそろえる: align-items" },
      { id: "flexbox-place-center", title: "完全中央: justify-content × align-items" },
      { id: "flexbox-row", title: "横一列に並べる: display: flex" },
      { id: "flexbox-grow", title: "余白を埋める: flex: 1" },
      { id: "flexbox-gap", title: "間隔を空ける: gap" },
    ],
  },
  {
    id: "grid",
    title: "Grid",
    summary: "2次元レイアウト。行と列のトラックで自在に配置する。",
    emoji: "🧱",
    lessons: [
      { id: "grid-three-columns", title: "列を作る: grid-template-columns" },
      { id: "grid-fr-ratio", title: "比率で分ける: fr 単位" },
      { id: "grid-gap", title: "すき間を空ける: gap" },
      { id: "grid-areas", title: "領域で組む: grid-template-areas" },
    ],
  },
  {
    id: "grid-alignment",
    title: "グリッドでそろえる",
    summary: "place-items・place-self・place-content で、セルの中の位置と、トラック全体の位置をそろえる。",
    emoji: "🔲",
    lessons: [
      { id: "grid-place-items", title: "セルの中央に置く: place-items" },
      { id: "grid-place-self", title: "1 つだけ別の位置に: place-self" },
      { id: "grid-place-content", title: "トラック全体を動かす: place-content" },
    ],
  },
  {
    id: "subgrid",
    title: "サブグリッド",
    summary: "入れ子のグリッドを親のトラックにそろえる subgrid。",
    emoji: "🧩",
    lessons: [
      { id: "subgrid-columns", title: "親の列にそろえる: grid-template-columns: subgrid" },
      { id: "subgrid-rows", title: "カードの中身をそろえる: grid-template-rows: subgrid" },
    ],
  },
  {
    id: "intrinsic-sizing",
    title: "中身に合わせた幅",
    summary: "max-content・min-content・fit-content で、要素の幅を中身の長さから決める。",
    emoji: "📏",
    lessons: [
      { id: "size-max-content", title: "折り返さない幅: max-content" },
      { id: "size-min-content", title: "いちばん狭い幅: min-content" },
      { id: "size-fit-content", title: "はみ出さずに中身の幅に: fit-content" },
    ],
  },
  {
    id: "multicol",
    title: "段組み（multi-column）",
    summary: "columns で中身を段に流し、column-gap・column-span・break-inside で段の間隔・またぎ・途切れを整える。",
    emoji: "🗞️",
    lessons: [
      { id: "multicol-columns", title: "段組みにする: columns" },
      { id: "multicol-span", title: "段をまたぐ見出し: column-span" },
      { id: "multicol-break", title: "途中で段を変えない: break-inside" },
    ],
  },
  {
    id: "tables",
    title: "表のレイアウト（table）",
    summary: "border-collapse で枠線を 1 本に、table-layout: fixed で列幅をそろえ、caption-side で表題を下に。",
    emoji: "📊",
    lessons: [
      { id: "table-collapse", title: "枠線を 1 本にまとめる: border-collapse" },
      { id: "table-fixed", title: "列幅をそろえる: table-layout: fixed" },
      { id: "table-caption", title: "表題を下に置く: caption-side" },
    ],
  },
  {
    id: "logical-props",
    title: "論理プロパティ",
    summary: "left/right ではなく inline/block で、書字方向に強いCSS。",
    emoji: "🧭",
    lessons: [
      { id: "logical-padding", title: "block と inline: padding-block / padding-inline" },
      { id: "logical-margin-auto", title: "margin-inline: auto で中央寄せ" },
    ],
  },
  {
    id: "writing-modes",
    title: "縦書き",
    summary: "writing-mode・text-orientation・text-combine-upright で、日本語の縦組みを CSS で。",
    emoji: "📜",
    lessons: [
      { id: "writing-vertical", title: "縦書きにする: writing-mode: vertical-rl" },
      { id: "writing-orientation", title: "略語を立てる: text-orientation" },
      { id: "writing-tcy", title: "縦中横: text-combine-upright" },
    ],
  },
  {
    id: "positioning",
    title: "絶対配置（absolute・inset）",
    summary: "position: absolute と inset・論理的な inset で、要素を基準の箱の角や全体にぴたりと重ねる。",
    emoji: "📍",
    lessons: [
      { id: "position-relative", title: "基準の箱を決める: position: relative" },
      { id: "position-inset", title: "四辺をまとめて指定する: inset" },
      { id: "position-logical", title: "書字方向に合わせる: inset-inline-end" },
    ],
  },
  {
    id: "shapes",
    title: "回り込みと図形（float・shape-outside）",
    summary: "float で文章を写真の横に流し、shape-outside で円に沿わせ、shape-margin で余白を取る。",
    emoji: "🫧",
    lessons: [
      { id: "float-left", title: "文章を回り込ませる: float" },
      { id: "shape-circle", title: "丸い写真に沿わせる: shape-outside: circle()" },
      { id: "shape-margin", title: "図形の外側に余白を取る: shape-margin" },
    ],
  },
  {
    id: "aspect-ratio",
    title: "アスペクト比",
    summary: "aspect-ratio で幅から高さを自動計算する。",
    emoji: "🖼️",
    lessons: [
      { id: "aspect-ratio-16-9", title: "16:9 を保つ: aspect-ratio" },
      { id: "aspect-ratio-square", title: "正方形を保つ: aspect-ratio: 1" },
    ],
  },
  {
    id: "object-fit",
    title: "画像の収め方",
    summary: "object-fit と object-position で、縦横比の違う写真やロゴを、ゆがめずに枠へ収める。",
    emoji: "🏞️",
    lessons: [
      { id: "fit-cover", title: "ゆがめずに切り抜く: object-fit: cover" },
      { id: "fit-position", title: "見せる位置を選ぶ: object-position" },
      { id: "fit-contain", title: "切らずに全体を収める: object-fit: contain" },
    ],
  },
  {
    id: "anchor-positioning",
    title: "アンカーポジショニング",
    summary: "要素を別の要素に結びつけて配置する。ツールチップやメニューが CSS だけで。",
    emoji: "⚓",
    lessons: [
      { id: "anchor-position-area", title: "アンカーに結びつける: anchor-name と position-area" },
      { id: "anchor-function", title: "辺を合わせる: anchor() 関数" },
      { id: "anchor-try-fallbacks", title: "はみ出したら反転: position-try-fallbacks" },
    ],
  },
  {
    id: "sticky",
    title: "スクロール追従（sticky）",
    summary: "position: sticky で、見出しや表の列をスクロールしても画面の端に残す。",
    emoji: "📌",
    lessons: [
      { id: "sticky-header", title: "見出しを上に残す: position: sticky" },
      { id: "sticky-column", title: "表の 1 列目を残す: left: 0" },
      { id: "sticky-sidebar", title: "グリッドの中で追従させる: align-self" },
    ],
  },
  {
    id: "scroll-snap",
    title: "スクロールスナップ",
    summary: "スクロールが止まる位置を、要素の端や中央にぴたりと合わせる。",
    emoji: "🧲",
    lessons: [
      { id: "snap-type-align", title: "カルーセルを止める: scroll-snap-type と scroll-snap-align" },
      { id: "snap-padding", title: "固定ヘッダーの下に止める: scroll-padding" },
    ],
  },
  {
    id: "media-queries",
    title: "メディアクエリ",
    summary: "画面幅に応じてスタイルを切り替える、レスポンシブの基本。",
    emoji: "📱",
    lessons: [
      { id: "media-max-width", title: "狭い画面で切り替える: @media (max-width)" },
      { id: "media-min-width", title: "広い画面で切り替える: @media (min-width)" },
    ],
  },
  {
    id: "container-queries",
    title: "コンテナクエリ",
    summary: "画面ではなく“親の幅”で切り替える、真の部品レスポンシブ。",
    emoji: "🪟",
    lessons: [
      { id: "cq-container-type", title: "コンテナにする: container-type" },
      { id: "cq-query", title: "親の幅で切り替える: @container" },
    ],
  },
  {
    id: "supports",
    title: "機能クエリ（@supports）",
    summary: "@supports で、ブラウザが対応しているかどうかに応じて CSS を切り替え、古いブラウザ向けの指定を分けておく。",
    emoji: "🛡️",
    lessons: [
      { id: "supports-not", title: "古いブラウザ向けの指定を分ける: @supports not" },
      { id: "supports-selector", title: "セレクタの対応を調べる: selector()" },
      { id: "supports-or", title: "接頭辞つきも合わせて調べる: not と or" },
    ],
  },
  {
    id: "layers",
    title: "カスケードレイヤー",
    summary: "@layer で優先順位を明示的に管理する。",
    emoji: "🗂️",
    lessons: [
      { id: "layers-order", title: "優先順位を決める: @layer" },
    ],
  },
  {
    id: "clip-mask",
    title: "クリップとマスク",
    summary: "clip-path と mask-image で、要素を好きなかたちに切り抜く・ぼかして消す。",
    emoji: "✂️",
    lessons: [
      { id: "clip-circle", title: "円で切り抜く: clip-path: circle()" },
      { id: "clip-polygon", title: "多角形で切り抜く: clip-path: polygon()" },
      { id: "mask-fade", title: "ふわっと消す: mask-image" },
    ],
  },
  {
    id: "filters",
    title: "フィルターと合成",
    summary: "filter・backdrop-filter・mix-blend-mode で、写真加工のような効果を CSS だけで。",
    emoji: "🎛️",
    lessons: [
      { id: "filter-functions", title: "白黒にしてぼかす: filter" },
      { id: "filter-backdrop", title: "すりガラス: backdrop-filter" },
      { id: "blend-multiply", title: "色を重ねて混ぜる: mix-blend-mode" },
    ],
  },
  {
    id: "forms",
    title: "フォームの見た目",
    summary: "accent-color・appearance・:user-invalid で、フォーム部品をブランドに合わせて使いやすく。",
    emoji: "☑️",
    lessons: [
      { id: "form-accent-color", title: "部品の色をそろえる: accent-color" },
      { id: "form-appearance", title: "チェックボックスを描き直す: appearance: none" },
      { id: "form-user-invalid", title: "触ってから知らせる: :user-invalid" },
    ],
  },
  {
    id: "transitions",
    title: "トランジション & 変形",
    summary: "transition で滑らかに、transform で拡大・回転。",
    emoji: "🎞️",
    lessons: [
      { id: "transition-duration", title: "滑らかに変化させる: transition" },
      { id: "transform-scale", title: "拡大する: transform: scale()" },
    ],
  },
  {
    id: "transforms-2d",
    title: "変形の中心と組み合わせ",
    summary: "transform-origin と、rotate・scale・translate のプロパティで、回転の中心や変形の組み合わせを思いどおりに。",
    emoji: "🎡",
    lessons: [
      { id: "transform-origin", title: "回転の中心を決める: transform-origin" },
      { id: "transform-individual", title: "回転と拡大を別々に: rotate と scale" },
      { id: "transform-translate-percent", title: "自分の大きさの分だけ戻す: translate: -50%" },
    ],
  },
  {
    id: "transforms-3d",
    title: "3D 変形",
    summary: "perspective・preserve-3d・backface-visibility で、奥行きのある立体を組み立てる。",
    emoji: "🧊",
    lessons: [
      { id: "transform-perspective", title: "奥行きをつける: perspective" },
      { id: "transform-preserve-3d", title: "立体を組み立てる: transform-style: preserve-3d" },
      { id: "transform-backface", title: "裏側を隠す: backface-visibility" },
    ],
  },
  {
    id: "entry-animations",
    title: "出現と退場のアニメーション",
    summary: "@starting-style と allow-discrete で、display: none からの出入りを滑らかに。",
    emoji: "🎬",
    lessons: [
      { id: "entry-starting-style", title: "現れる瞬間の出発点: @starting-style" },
      { id: "exit-allow-discrete", title: "消えるときも滑らかに: transition-behavior" },
    ],
  },
  {
    id: "registered-props",
    title: "型付きカスタムプロパティ",
    summary: "@property で変数に型と初期値を与え、アニメーションできるようにする。",
    emoji: "🧬",
    lessons: [
      { id: "property-register", title: "変数に型を付ける: @property" },
      { id: "property-animate", title: "変数をアニメーションさせる" },
    ],
  },
  {
    id: "math-functions",
    title: "CSS の数学関数",
    summary: "round()・mod()・sin()/cos() — 値を倍数に丸め、くり返し、円周に並べる。",
    emoji: "🧮",
    lessons: [
      { id: "math-round", title: "倍数にそろえる: round()" },
      { id: "math-mod", title: "4 つごとにくり返す: mod()" },
      { id: "math-trig", title: "円周に並べる: sin() と cos()" },
    ],
  },
];

export const LESSONS: readonly LessonMeta[] = TRACKS.flatMap((t) => t.lessons);

export function lessonById(id: string): LessonMeta | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function trackOf(lessonId: string): TrackMeta | undefined {
  return TRACKS.find((t) => t.lessons.some((l) => l.id === lessonId));
}

/** The lesson after `id` in catalogue order, or undefined at the end. */
export function nextLesson(id: string): LessonMeta | undefined {
  const idx = LESSONS.findIndex((l) => l.id === id);
  return idx >= 0 ? LESSONS[idx + 1] : undefined;
}

/**
 * Each track's lessons (explanations, starters, solutions, validators) are
 * loaded on demand. Vite emits every import() below as its own chunk, so the
 * initial bundle never carries them; the service worker precaches the chunks
 * for offline use (vite.config.ts lists them into sw.js at build time).
 */
const LOADERS: Record<TrackId, () => Promise<Track>> = {
  selectors: () => import("./selectors.js").then((m) => m.selectorsTrack),
  "box-model": () => import("./box-model.js").then((m) => m.boxModelTrack),
  units: () => import("./units.js").then((m) => m.unitsTrack),
  "custom-props": () => import("./custom-props.js").then((m) => m.customPropsTrack),
  color: () => import("./color.js").then((m) => m.colorTrack),
  "color-functions": () => import("./color-functions.js").then((m) => m.colorFunctionsTrack),
  gradients: () => import("./gradients.js").then((m) => m.gradientsTrack),
  "text-wrap": () => import("./text-wrap.js").then((m) => m.textWrapTrack),
  "text-overflow": () => import("./text-overflow.js").then((m) => m.textOverflowTrack),
  "modern-selectors": () => import("./modern-selectors.js").then((m) => m.modernSelectorsTrack),
  "has-patterns": () => import("./has-patterns.js").then((m) => m.hasPatternsTrack),
  nesting: () => import("./nesting.js").then((m) => m.nestingTrack),
  scope: () => import("./scope.js").then((m) => m.scopeTrack),
  flexbox: () => import("./flexbox.js").then((m) => m.flexboxTrack),
  grid: () => import("./grid.js").then((m) => m.gridTrack),
  "grid-alignment": () => import("./grid-alignment.js").then((m) => m.gridAlignmentTrack),
  subgrid: () => import("./subgrid.js").then((m) => m.subgridTrack),
  "intrinsic-sizing": () => import("./intrinsic-sizing.js").then((m) => m.intrinsicSizingTrack),
  multicol: () => import("./multicol.js").then((m) => m.multicolTrack),
  tables: () => import("./tables.js").then((m) => m.tablesTrack),
  "logical-props": () => import("./logical-props.js").then((m) => m.logicalPropsTrack),
  "writing-modes": () => import("./writing-modes.js").then((m) => m.writingModesTrack),
  positioning: () => import("./positioning.js").then((m) => m.positioningTrack),
  shapes: () => import("./shapes.js").then((m) => m.shapesTrack),
  "aspect-ratio": () => import("./aspect-ratio.js").then((m) => m.aspectRatioTrack),
  "object-fit": () => import("./object-fit.js").then((m) => m.objectFitTrack),
  "anchor-positioning": () => import("./anchor-positioning.js").then((m) => m.anchorPositioningTrack),
  sticky: () => import("./sticky.js").then((m) => m.stickyTrack),
  "scroll-snap": () => import("./scroll-snap.js").then((m) => m.scrollSnapTrack),
  "media-queries": () => import("./media-queries.js").then((m) => m.mediaQueriesTrack),
  "container-queries": () => import("./container-queries.js").then((m) => m.containerQueriesTrack),
  supports: () => import("./supports.js").then((m) => m.supportsTrack),
  layers: () => import("./layers.js").then((m) => m.layersTrack),
  "clip-mask": () => import("./clip-mask.js").then((m) => m.clipMaskTrack),
  filters: () => import("./filters.js").then((m) => m.filtersTrack),
  forms: () => import("./forms.js").then((m) => m.formsTrack),
  transitions: () => import("./transitions.js").then((m) => m.transitionsTrack),
  "transforms-2d": () => import("./transforms-2d.js").then((m) => m.transforms2dTrack),
  "transforms-3d": () => import("./transforms-3d.js").then((m) => m.transforms3dTrack),
  "entry-animations": () => import("./entry-animations.js").then((m) => m.entryAnimationsTrack),
  "registered-props": () => import("./registered-props.js").then((m) => m.registeredPropsTrack),
  "math-functions": () => import("./math-functions.js").then((m) => m.mathFunctionsTrack),
};

export function loadTrack(id: TrackId): Promise<Track> {
  return LOADERS[id]();
}

/** The full lesson with its challenge. Rejects for an id not in the catalogue. */
export async function loadLesson(id: string): Promise<Lesson> {
  const track = trackOf(id);
  const lesson = track && (await loadTrack(track.id)).lessons.find((l) => l.id === id);
  if (!lesson) throw new Error(`unknown lesson: ${id}`);
  return lesson;
}
