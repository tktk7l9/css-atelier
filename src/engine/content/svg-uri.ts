/**
 * An SVG drawing as a data: URI, for the pictures in lesson markup. The CSP
 * allows data: images (img-src data:), so a preview requests no image. `#`
 * would start a fragment, so it is escaped along with the angle brackets.
 */
export function svgUri(w: number, h: number, body: string, attrs = ""): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'${attrs}>${body}</svg>`;
  return `data:image/svg+xml,${svg.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}`;
}
