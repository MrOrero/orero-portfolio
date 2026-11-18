// node scripts/contrast.mjs
// WCAG contrast for every text-on-background pair used in v1 to v4. Body text needs 4.5:1;
// pairs marked large are only used at 24px+ (or 18.66px bold) and need 3:1.
const pairs = [
  // v1 Receipt
  ["v1", "ink on paper", "#111111", "#f2efe6"],
  ["v1", "ink-2 on paper", "#57534a", "#f2efe6"],
  ["v1", "red on paper", "#b3261e", "#f2efe6"],
  ["v1", "paper on counter", "#f2efe6", "#171716"],
  ["v1", "on-counter-2 on counter", "#b1ac9f", "#171716"],
  ["v1", "paper on red disc", "#f2efe6", "#b3261e"],
  // v2 Foil
  ["v2", "pearl on midnight", "#eceaf2", "#0c0e1c"],
  ["v2", "pearl-2 on midnight", "#a9a7bf", "#0c0e1c"],
  ["v2", "midnight on pearl", "#0c0e1c", "#eceaf2"],
  // v3 Shipped
  ["v3", "cream on navy", "#f4efe6", "#0f1b33"],
  ["v3", "cream-2 on navy", "#b9c1d3", "#0f1b33"],
  ["v3", "orange on navy", "#f0531c", "#0f1b33"],
  ["v3", "navy on cream", "#0f1b33", "#f4efe6"],
  ["v3", "ink-2 on cream", "#4a5468", "#f4efe6"],
  ["v3", "rust on cream (about role)", "#b23a0e", "#f4efe6"],
  ["v3", "navy on orange", "#0f1b33", "#f0531c"],
  ["v3", "cream on hull", "#f4efe6", "#161616"],
  ["v3", "orange on hull", "#f0531c", "#161616"],
  ["v3", "white on fintech livery", "#ffffff", "#1e5aa8", "large"],
  ["v3", "white on health livery", "#ffffff", "#2e7d5b", "large"],
  ["v3", "white on enterprise livery", "#ffffff", "#8e2a2a", "large"],
  ["v3", "white on ai-web3 livery", "#ffffff", "#5b3e96", "large"],
  ["v3", "white on consumer livery", "#ffffff", "#5d6b80", "large"],
  ["v3", "navy on telecom livery", "#0f1b33", "#f2b705", "large"],
  ["v3", "navy on events livery", "#0f1b33", "#e5e1d8", "large"],
  // v4 Load
  ["v4", "white on cobalt", "#ffffff", "#1c2bd6"],
  ["v4", "on-cobalt-2 on cobalt", "#c9cdf6", "#1c2bd6"],
  ["v4", "yellow on cobalt", "#ffe14d", "#1c2bd6"],
  ["v4", "cobalt on paper", "#1c2bd6", "#f5f6fb"],
  ["v4", "on-paper-2 on paper", "#3d4486", "#f5f6fb"],
  ["v4", "deep on yellow", "#0b1270", "#ffe14d"],
  ["v4", "white on deep", "#ffffff", "#0b1270"],
  ["v4", "yellow on deep", "#ffe14d", "#0b1270"],
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
for (const [v, name, fg, bg, size] of pairs) {
  const r = ratio(fg, bg);
  const need = size === "large" ? 3 : 4.5;
  const ok = r >= need;
  if (!ok) failed += 1;
  console.log(`${ok ? "ok  " : "FAIL"} ${v}  ${r.toFixed(2).padStart(5)}:1  (needs ${need})  ${name}`);
}
console.log(failed ? `\n${failed} pair(s) below AA` : "\nAll pairs meet AA");
process.exit(failed ? 1 : 0);
