import { ImageResponse } from "next/og";
import { careerSpan, person } from "@/content";

export const alt = `${person.name}, ${person.role}. Portfolio`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#0f1b33";
const CREAM = "#f4efe6";
const CREAM_2 = "#b9c1d3";
const ORANGE = "#f0531c";
// Sector liveries, in the order the containers are painted on the site.
const LIVERIES = ["#1e5aa8", "#2e7d5b", "#f0531c", "#f2b705", "#8e2a2a", "#5b3e96", "#e5e1d8", "#5d6b80", "#1e5aa8", "#2e7d5b", "#f2b705", "#8e2a2a"];

/** Fetch just the glyphs we draw, as TTF, from Google Fonts. Returns null offline so the build still succeeds. */
async function font(family: string, weight: number, text: string) {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}&text=${encodeURIComponent(text)}`)
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

/**
 * The share card for WhatsApp, X, LinkedIn, Slack and the rest. Rendered once at build time.
 * Everything that matters sits in the middle third, so square thumbnail crops still read.
 */
export default async function OpengraphImage() {
  const kicker = `Super Shipper · ${careerSpan}`.toUpperCase();
  const role = person.role;
  const [display, label, body] = await Promise.all([
    font("Big Shoulders", 900, `${person.first}${person.last}`.toUpperCase()),
    font("Big Shoulders", 800, kicker),
    font("Archivo", 500, role),
  ]);
  const fonts = [
    display && { name: "Display", data: display, weight: 900 as const },
    label && { name: "Label", data: label, weight: 800 as const },
    body && { name: "Body", data: body, weight: 500 as const },
  ].filter((f): f is { name: string; data: ArrayBuffer; weight: 900 | 800 | 500 } => Boolean(f));

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", background: NAVY, color: CREAM }}>
        <div style={{ display: "flex", marginTop: 54, fontFamily: "Label", fontSize: 30, letterSpacing: 6, color: ORANGE }}>{kicker}</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 18, fontFamily: "Display", fontSize: 168, lineHeight: 0.86 }}>
          <span>{person.first.toUpperCase()}</span>
          <span>{person.last.toUpperCase()}</span>
        </div>
        <div style={{ display: "flex", marginTop: 22, fontFamily: "Body", fontSize: 34, color: CREAM_2 }}>{role}</div>

        {/* The ship: a row of containers on a black and red hull. */}
        <div style={{ display: "flex", marginTop: "auto", width: "100%", padding: "0 40px", gap: 6 }}>
          {LIVERIES.map((c, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flex: 1,
                height: 58,
                background: c,
                backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,0.18) 0 3px, transparent 3px 11px)",
                boxShadow: "inset 0 -5px 0 rgba(0,0,0,0.22)",
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", width: "100%", height: 26, background: "#161616" }} />
        <div style={{ display: "flex", width: "100%", height: 22, background: "#a3261c" }} />
      </div>
    ),
    { ...size, fonts },
  );
}
