/**
 * Thermal printing, in software. A receipt printer has one ink and one paper,
 * so every picture on this page is reduced to 1-bit before it is shown.
 */

export const INK: [number, number, number] = [17, 17, 17];
export const PAPER: [number, number, number] = [242, 239, 230];

/** 8×8 ordered-dither thresholds in 0..1. Stable frame to frame, so live heat never crawls. */
export const BAYER8 = (() => {
  const m = [
    0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3,
    35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
  ];
  return Float32Array.from(m, (v) => (v + 0.5) / 64);
})();

/**
 * Draws `img` into a cols × rows grid (cover-cropped), then error-diffuses it to
 * ink and paper. Floyd–Steinberg keeps screenshots legible at small sizes.
 */
export function ditherImage(img: HTMLImageElement, cols: number, rows: number, contrast = 1.35): ImageData {
  const c = document.createElement("canvas");
  c.width = cols;
  c.height = rows;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  const ir = img.naturalWidth / img.naturalHeight;
  const cr = cols / rows;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  if (ir > cr) sw = sh * cr;
  else sh = sw / cr;
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, cols, rows);
  const data = ctx.getImageData(0, 0, cols, rows);
  const px = data.data;
  const lum = new Float32Array(cols * rows);
  for (let i = 0; i < lum.length; i++) {
    const l = (0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2]) / 255;
    // Thermal heads print hot: push contrast so mid-tone mockup grounds don't turn to mush.
    lum[i] = (l - 0.5) * contrast + 0.55;
  }
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const old = lum[i];
      const v = old < 0.5 ? 0 : 1;
      const err = old - v;
      if (x + 1 < cols) lum[i + 1] += (err * 7) / 16;
      if (y + 1 < rows) {
        if (x > 0) lum[i + cols - 1] += (err * 3) / 16;
        lum[i + cols] += (err * 5) / 16;
        if (x + 1 < cols) lum[i + cols + 1] += err / 16;
      }
      const col = v ? PAPER : INK;
      px[i * 4] = col[0];
      px[i * 4 + 1] = col[1];
      px[i * 4 + 2] = col[2];
      px[i * 4 + 3] = 255;
    }
  }
  return data;
}

/** Loads an image (already decoded by the intro in most cases). */
export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
