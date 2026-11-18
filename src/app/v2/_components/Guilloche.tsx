/**
 * Guilloche: the engraved rosettes on banknotes and cards, made of overlapping
 * hypotrochoids. Built once at module load as SVG data URIs, so any number of
 * cards can wear them as a static background without repeating the paths in the DOM.
 */
function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a;
}

function hypotrochoid(R: number, r: number, d: number, c: number) {
  const turns = r / gcd(R, r);
  const steps = turns * 96;
  const end = Math.PI * 2 * turns;
  let p = "";
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * end;
    const x = c + (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t);
    const y = c + (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t);
    p += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return p;
}

const CURVES: [number, number, number][] = [
  [100, 36, 54],
  [100, 30, 48],
  [100, 40, 60],
  [70, 28, 30],
  [56, 21, 24],
];

/** The rosette paths, for inline use where they must be clipped (the intro). */
export const ROSETTE_PATHS = CURVES.map(([R, r, d]) => hypotrochoid(R, r, d, 120));

const svg = (body: string, vb: string, extra = "") =>
  `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='${vb}' ${extra}>${body}</svg>`)}")`;

export const rosetteUrl = (stroke: string, w = 0.55) =>
  svg(
    ROSETTE_PATHS.map((d, i) => `<path d='${d}' fill='none' stroke='${stroke}' stroke-width='${w}' opacity='${(1 - i * 0.15).toFixed(2)}'/>`).join(""),
    "0 0 240 240",
  );

export const waveUrl = (stroke: string) => {
  let body = "";
  for (let k = 0; k < 12; k++) {
    let p = "";
    for (let i = 0; i <= 160; i++) {
      const x = (i / 160) * 400;
      const y = 60 + Math.sin(i / 6 + k * 0.5) * (14 + k * 1.6) + Math.sin(i / 17 - k) * 7;
      p += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    body += `<path d='${p}' fill='none' stroke='${stroke}' stroke-width='0.6'/>`;
  }
  return svg(body, "0 0 400 120", "preserveAspectRatio='none'");
};
