import type { ValidatorSpec } from "../validate/primitives.js";
import type { Track } from "./types.js";

// Truncating and wrapping change the size of the boxes, so these lessons are
// judged by geometry: line heights are fixed in px, so "one line" and "three
// lines" are exact heights on any machine, and a bubble that overflows its row
// sticks out of it. The ellipsis itself is only painted, so it is read from
// the computed values.

const TITLES = [
  "【重要】年末年始の営業日と配送スケジュールについてのお知らせ",
  "新しい講座「はじめての CSS レイアウト」を公開しました",
  "メンテナンスのため、一部の機能が一時的に使えなくなります",
];

const INBOX_HTML =
  '<ul class="inbox">' + TITLES.map((t, i) => `<li data-id="t${i + 1}" class="title">${t}</li>`).join("") + "</ul>";

const INBOX_CSS = (extra: string): string =>
  `.inbox {\n  width: 240px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n  border: 1px solid #dbe4fb;\n  border-radius: 8px;\n}\n.title {\n  padding: 8px 12px;\n  line-height: 24px;\n  border-bottom: 1px solid #dbe4fb;\n  text-overflow: ellipsis;\n${extra}}\n`;

/** One line of 24px, plus 8px padding above and below and the 1px bottom border. */
const ONE_LINE = 41;

const NEWS_HTML =
  '<article class="news"><h3 class="head">新しい講座を公開しました</h3><p data-id="summary" class="summary">はじめての方向けに、CSS のレイアウトを基礎から学べる講座を公開しました。Flexbox とグリッドの使い分け、よくあるつまずきとその直し方、実際のページを組み立てる練習まで、手を動かしながら少しずつ進められます。</p><span class="more">続きを読む →</span></article>';

const NEWS_CSS = (extra: string): string =>
  `.news {\n  width: 280px;\n  padding: 12px 16px;\n  border: 1px solid #dbe4fb;\n  border-radius: 8px;\n}\n.head {\n  margin: 0 0 6px;\n  font-size: 16px;\n}\n.summary {\n  margin: 0;\n  line-height: 24px;\n${extra}}\n.more {\n  color: #2f5fd0;\n  font-size: 14px;\n}\n`;

// The token after the last slash has no break opportunity of its own, so the
// URL cannot wrap anywhere without overflow-wrap.
const CHAT_HTML =
  '<div data-id="msg" class="msg"><span class="avatar">A</span><p data-id="bubble" class="bubble">資料はこちらです: <span data-id="url" class="url">https://example.com/share/AbCdEfGhIjKlMnOpQrStUvWxYz0123456789</span></p></div>';

const CHAT_CSS = (extra: string): string =>
  `.msg {\n  display: flex;\n  gap: 8px;\n  width: 280px;\n  padding: 8px;\n  border: 1px solid #dbe4fb;\n  border-radius: 12px;\n}\n.avatar {\n  flex: none;\n  display: grid;\n  place-items: center;\n  width: 36px;\n  height: 36px;\n  border-radius: 50%;\n  color: #fff;\n  background: #2f5fd0;\n}\n.bubble {\n  margin: 0;\n  padding: 8px 12px;\n  line-height: 1.6;\n  border-radius: 12px;\n  background: #eef1f8;\n${extra}}\n.url {\n  color: #2f5fd0;\n}\n`;

const each = (spec: (id: string) => ValidatorSpec, message: string): ValidatorSpec => ({
  kind: "allOf",
  of: ["t1", "t2", "t3"].map(spec),
  message,
});

export const textOverflowTrack: Track = {
  id: "text-overflow",
  title: "文字のはみ出し",
  summary: "text-overflow・-webkit-line-clamp・overflow-wrap で、長いタイトルや文章、URL を枠に収める。",
  emoji: "📰",
  lessons: [
    {
      id: "overflow-ellipsis",
      title: "1 行で省略する: text-overflow: ellipsis",
      explanation:
        "<p>一覧のタイトルを 1 行にそろえ、収まらない部分を「…」で省略するのが <code>text-overflow: ellipsis</code> です。ただし、これだけでは何も起きません。<b>3 つの指定がそろって</b>はじめて効きます。</p><p><code>white-space: nowrap</code> で折り返しを止めて 1 行にし、<code>overflow: hidden</code> で枠からはみ出した部分を隠すと、その隠れた境目に <code>text-overflow: ellipsis</code> が「…」を出します。text-overflow は<b>隠したはみ出しの目印</b>を決めるだけで、自分では折り返しを止めないからです。flex の子に使うときは、中身の幅より縮めるように <code>min-width: 0</code> も必要になることがあります。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/text-overflow",
      viz: { concept: "none" },
      challenge: {
        starterHTML: INBOX_HTML,
        starterCSS: INBOX_CSS(""),
        task: "お知らせのタイトル（.title）が折り返して 2〜3 行になっています。text-overflow: ellipsis は書いてあるのに「…」が出ません。どれも 1 行に収めて、収まらない部分を「…」で省略しよう。",
        snapshot: { props: ["overflow-x", "text-overflow"] },
        validators: [
          // allOf reports only the first unmet step, so a fresh starter gets one message.
          {
            kind: "allOf",
            of: [
              each(
                (id) => ({ kind: "sizeApprox", id, h: ONE_LINE }),
                "タイトルが折り返して 2 行以上になっています。white-space: nowrap で 1 行に収めましょう",
              ),
              each(
                (id) => ({ kind: "computedMatches", id, prop: "overflow-x", pattern: "^(?:hidden|clip)$" }),
                "1 行に収まらない部分が、枠の右へはみ出しています。overflow: hidden で隠しましょう",
              ),
              each(
                (id) => ({ kind: "computedEquals", id, prop: "text-overflow", value: "ellipsis" }),
                "隠した部分の目印に、text-overflow: ellipsis で「…」を出しましょう",
              ),
            ],
          },
        ],
        hints: ["折り返しを止める・はみ出しを隠す・「…」を出す、の 3 つがそろって効きます", "white-space: nowrap; overflow: hidden;"],
        solution: INBOX_CSS("  white-space: nowrap;\n  overflow: hidden;\n"),
      },
    },
    {
      id: "overflow-line-clamp",
      title: "3 行で省略する: -webkit-line-clamp",
      explanation:
        "<p>複数行の文章を<b>決まった行数で打ち切り</b>、最後の行の終わりに「…」を付けるのが <code>-webkit-line-clamp</code> です。カードの要約などで、文章の長さが違ってもカードの高さをそろえられます。</p><p>このプロパティは、<code>display: -webkit-box</code> と <code>-webkit-box-orient: vertical</code> を<b>一緒に指定したときだけ</b>効きます。どれも古い接頭辞つきの書き方ですが、この 3 つの組み合わせは仕様にも書かれていて、これからも使えるとされています。打ち切った後ろの行が見えないように、<code>overflow: hidden</code> も付けます。</p><p>この組み合わせは Chrome・Edge・Safari と Firefox 68 以降で使えます。接頭辞なしの <code>line-clamp</code> は、まだどのブラウザも正式には対応していないため、MDN の Baseline では「限定的」の扱いです。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/line-clamp",
      viz: { concept: "none" },
      challenge: {
        starterHTML: NEWS_HTML,
        starterCSS: NEWS_CSS(""),
        task: "ニュースの要約（.summary）を 3 行で打ち切って、最後に「…」を付けよう。",
        snapshot: { props: ["-webkit-line-clamp", "overflow-y"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "sizeApprox",
                id: "summary",
                h: 72,
                message: "要約が 3 行分（72px）の高さになっていません。display: -webkit-box・-webkit-box-orient: vertical・-webkit-line-clamp: 3 の 3 つをそろえましょう",
              },
              {
                kind: "computedEquals",
                id: "summary",
                prop: "-webkit-line-clamp",
                value: "3",
                message: "最後の行に「…」を付けるには、高さではなく -webkit-line-clamp: 3 で行数を指定します",
              },
              {
                kind: "computedMatches",
                id: "summary",
                prop: "overflow-y",
                pattern: "^(?:hidden|clip)$",
                message: "4 行目からの文字が下にはみ出して見えています。overflow: hidden で隠しましょう",
              },
            ],
          },
        ],
        hints: [
          "-webkit-line-clamp は、display: -webkit-box と -webkit-box-orient: vertical がそろったときだけ効きます",
          "display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden;",
        ],
        solution: NEWS_CSS("  display: -webkit-box;\n  -webkit-box-orient: vertical;\n  -webkit-line-clamp: 3;\n  overflow: hidden;\n"),
      },
    },
    {
      id: "overflow-wrap-anywhere",
      title: "長い URL を折り返す: overflow-wrap: anywhere",
      explanation:
        "<p>URL や長い英数字には途中に<b>折り返せる場所がない</b>ので、狭い枠からそのままはみ出します。<code>overflow-wrap</code> は、ほかに折り返せる場所がないときに限って、<b>単語の途中でも折り返して</b>よいことにします。</p><p>途中での折り返しを許す値は <code>break-word</code> と <code>anywhere</code> の 2 つで、違いは要素が<b>どこまで縮めるか</b>（最小の幅）の計算です。<code>break-word</code> はこの計算に途中の折り返しを入れないので、flex の子のように中身に合わせて幅が決まる要素は、URL の長さより縮まずにはみ出したままです。<code>anywhere</code> は入れるので、要素ごと縮みます（<code>break-word</code> に <code>min-width: 0</code> を足しても直せます）。<code>word-break: break-all</code> でも折り返せますが、ふつうの英単語まで行の端で切れてしまいます。</p><p>主要ブラウザすべてで使えます（Baseline: 広く利用可能。<code>anywhere</code> は Chrome 80・Firefox 65・Safari 15.4 から）。</p>",
      mdnPath: "/ja/docs/Web/CSS/Reference/Properties/overflow-wrap",
      viz: { concept: "none" },
      challenge: {
        starterHTML: CHAT_HTML,
        starterCSS: CHAT_CSS(""),
        task: "チャットの吹き出し（.bubble）が、長い URL に引っぱられて枠（.msg）の右へはみ出しています。URL を途中で折り返して、吹き出しを枠の中に収めよう。",
        snapshot: { props: ["overflow-wrap"] },
        validators: [
          {
            kind: "allOf",
            of: [
              {
                kind: "insideContainer",
                id: "bubble",
                containerId: "msg",
                message: "吹き出しが、長い URL に引っぱられて枠の右へはみ出しています（flex の子は、中身の最小の幅より縮みません）",
              },
              {
                kind: "insideContainer",
                id: "url",
                containerId: "bubble",
                message: "URL が吹き出しの右端からはみ出しています。単語の途中でも折り返せるようにしましょう",
              },
              {
                kind: "computedMatches",
                id: "url",
                prop: "overflow-wrap",
                pattern: "^(?:anywhere|break-word)$",
                message: "URL の途中で折り返すには overflow-wrap を使いましょう（word-break: break-all だと、ふつうの英単語まで途中で切れます）",
              },
            ],
          },
        ],
        hints: [
          "吹き出しは flex の子です。overflow-wrap: break-word では、吹き出しが縮める最小の幅は URL の長さのままです",
          "overflow-wrap: anywhere;",
        ],
        solution: CHAT_CSS("  overflow-wrap: anywhere;\n"),
      },
    },
  ],
};
