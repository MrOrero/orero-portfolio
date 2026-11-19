import type { Project } from "@/content";
import { opt } from "@/lib/intro-key";

/** A project as a container. */
export type Cargo = Project & { n: string; sectorLabel: string; sectorCode: string; years: string; code: string };

/**
 * ISO 6346-style marking: owner prefix, equipment letter, a serial from the year
 * and the item number. Decorative, not a real container number.
 */
export const boxCode = (end: number, n: number) => `SUPER SHIPPER ${String(end).slice(2)}${String(n).padStart(4, "0")}`;

/**
 * The long side of a container: corrugated steel in its sector's livery, a
 * placard with the work, stencilled name and marking. Sizes are in container
 * units, so one design serves the intro, the voyage and the yard.
 */
export function Box({ c, w = 384, placard = true }: { c: Cargo; w?: 384 | 640; placard?: boolean }) {
  // Longest word in the title, so a look can size the title to fit without splitting words.
  const fit = Math.max(...c.title.split(/\s+/).map((t) => t.length));
  return (
    <div className="s-box" data-sector={c.sector} style={{ "--fit": fit } as React.CSSProperties}>
      <span className="s-box-doors" aria-hidden="true" />
      {placard && (
        <span className="s-box-placard">
          {/* eslint-disable-next-line @next/next/no-img-element -- the intro preloads this exact optimiser URL. */}
          <img src={opt(c.image, w)} alt="" draggable={false} loading="lazy" decoding="async" />
        </span>
      )}
      <span className="s-box-text">
        <span className="s-box-code">
          {/* Owner name above the serial, the way a real box is stencilled. */}
          <span>{c.code.slice(0, c.code.lastIndexOf(" "))}</span>
          <span>{c.code.slice(c.code.lastIndexOf(" ") + 1)}</span>
        </span>
        <span className="s-box-title">{c.title}</span>
        <span className="s-box-meta">
          {c.sectorLabel}
        </span>
      </span>
    </div>
  );
}
