/**
 * Server-safe half of the intro plumbing: keys and the pre-paint script.
 * Layouts (server components) import from here; hooks live in intro.ts.
 */

/** sessionStorage key and <html> attribute for an intro. */
export const introKey = (v: string) => `orero:${v}:intro`;
export const introAttr = (v: string) => `data-${v}-seen`;

/**
 * Inline script for the root layout. It runs while the HTML is parsed, before
 * first paint, so a repeat visit never flashes the loader.
 */
export const introScript = (v: string) =>
  `try{sessionStorage.getItem(${JSON.stringify(introKey(v))})&&document.documentElement.setAttribute(${JSON.stringify(
    introAttr(v),
  )},"")}catch(e){}`;

/** A URL from the built-in image optimiser, so preloads and renders hit the same cache entry. */
export function opt(src: string, w: 384 | 640 | 828 | 1200 | 1920 = 828) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`;
}

const SET_WIDTHS = [640, 828, 1200, 1920, 2048, 3840] as const;

/**
 * srcSet for large views. Widths past the file's own size are dropped (the optimiser never
 * upscales), and the file's real width closes the list, so a 2x screen gets every pixel there is.
 */
export function optSet(src: string, fileWidth: number, q: 75 | 90 = 90) {
  const under = SET_WIDTHS.filter((w) => w < fileWidth);
  const top = SET_WIDTHS.find((w) => w >= fileWidth) ?? SET_WIDTHS[SET_WIDTHS.length - 1];
  return [...under.map((w) => `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=${q} ${w}w`), `/_next/image?url=${encodeURIComponent(src)}&w=${top}&q=${q} ${fileWidth}w`].join(", ");
}
