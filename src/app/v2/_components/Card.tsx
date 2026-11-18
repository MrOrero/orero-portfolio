import type { Project } from "@/content";
import { opt } from "@/lib/intro-key";

/** A project as a card in the wallet. */
export type DeckItem = Project & { n: string; sectorLabel: string; years: string };

/**
 * The face of a project card, at ISO bank-card proportions. Every size inside it
 * is in container units, so the same card works at 120px in the timeline and
 * 520px on top of the deck.
 */
export function CardFace({ p, w = 640 }: { p: DeckItem; w?: 384 | 640 | 828 }) {
  return (
    <div className="f-card f-face" data-sector={p.sector}>
      <div className="f-face-top">
        <span className="f-chip" aria-hidden="true" />
        <span className="f-no">No. {p.n}</span>
        <span className="f-sector">{p.sectorLabel}</span>
      </div>
      <div className="f-art">
        {/* eslint-disable-next-line @next/next/no-img-element -- the intro preloads this exact optimiser URL. */}
        <img src={opt(p.image, w)} alt="" draggable={false} loading="lazy" decoding="async" />
      </div>
      <div className="f-face-foot">
        <p className="f-title">{p.title}</p>
        <p className="f-meta">{p.years}</p>
      </div>
    </div>
  );
}

/** The back: everything about the project, engraved on guilloche. */
export function CardBack({ p, live = true }: { p: DeckItem; live?: boolean }) {
  return (
    <div className="f-card f-back">
      <p className="f-back-no">
        No. {p.n} · {p.years}
      </p>
      <p className="f-back-title">{p.title}</p>
      <p className="f-back-desc">{p.description}</p>
      <dl className="f-back-dl">
        <div>
          <dt>Client</dt>
          <dd>{p.client}</dd>
        </div>
        <div>
          <dt>Sector</dt>
          <dd>{p.sectorLabel}</dd>
        </div>
        {p.impact && (
          <div>
            <dt>Impact</dt>
            <dd>{p.impact}</dd>
          </div>
        )}
      </dl>
      {live && (
        <a className="f-back-link" href={p.link} target="_blank" rel="noreferrer" data-cursor="Visit" tabIndex={-1}>
          Visit live site ↗
        </a>
      )}
    </div>
  );
}
