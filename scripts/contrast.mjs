// node scripts/contrast.mjs
// WCAG contrast for every text-on-background pair the site uses. Body text needs 4.5:1;
// pairs marked large are only used at 24px+ (or 18.66px bold) and need 3:1.
const pairs = [
  ["cream on navy", "#f4efe6", "#0f1b33"],
  ["cream-2 on navy", "#b9c1d3", "#0f1b33"],
  ["orange on navy", "#f0531c", "#0f1b33"],
  ["navy on cream", "#0f1b33", "#f4efe6"],
  ["ink-2 on cream", "#4a5468", "#f4efe6"],
  ["rust on cream (about role)", "#b23a0e", "#f4efe6"],
  ["navy on orange", "#0f1b33", "#f0531c"],
  ["cream on hull", "#f4efe6", "#161616"],
  ["orange on hull", "#f0531c", "#161616"],
  ["white on fintech livery", "#ffffff", "#1e5aa8", "large"],
  ["white on health livery", "#ffffff", "#2e7d5b", "large"],
  ["white on enterprise livery", "#ffffff", "#8e2a2a", "large"],
  ["white on ai-web3 livery", "#ffffff", "#5b3e96", "large"],
  ["white on consumer livery", "#ffffff", "#5d6b80", "large"],
  ["navy on telecom livery", "#0f1b33", "#f2b705", "large"],
  ["navy on events livery", "#0f1b33", "#e5e1d8", "large"],
];

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

let failed = 0;
for (const [name, fg, bg, size] of pairs) {
  const r = ratio(fg, bg);
  const need = size === "large" ? 3 : 4.5;
  const ok = r >= need;
  if (!ok) failed += 1;
  console.log(`${ok ? "ok  " : "FAIL"}  ${r.toFixed(2).padStart(5)}:1  (needs ${need})  ${name}`);
}
console.log(failed ? `\n${failed} pair(s) below AA` : "\nAll pairs meet AA");
process.exit(failed ? 1 : 0);
