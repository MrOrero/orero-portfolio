/**
 * Server-safe half of the intro plumbing: keys and the pre-paint script.
 * Layouts (server components) import from here; hooks live in intro.ts.
 */

/** sessionStorage key and <html> attribute for one version's intro. */
export const introKey = (v: string) => `orero:${v}:intro`;
export const introAttr = (v: string) => `data-${v}-seen`;

/**
 * Inline script for the version's layout. It runs while the HTML is parsed, before
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
