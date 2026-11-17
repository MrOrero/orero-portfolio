"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Project } from "@/content";
import { person } from "@/content";
import { DUR, EASE, clamp, useMediaQuery, usePrefersReducedMotion } from "@/lib/motion";

type Row = Project & { sectorLabel: string };

/** What each entry adds to the running balance. Only figures stated in the content. */
const CONTRIB: Record<string, Partial<Record<"lent" | "businesses" | "countries" | "monthly", number>>> = {
  moniepoint: { lent: 7, businesses: 10000 },
  "contract-collab": { countries: 10 },
  betacare: { monthly: 40 },
};

const ref = (r: Row) => `${r.slug.replace(/[^a-z]/g, "").slice(0, 3).toUpperCase()}-${r.start}`;
const period = (r: Row) => (r.start === r.end ? `${r.start}` : `${r.start}–${String(r.end).slice(2)}`);

export default function Statement({ rows, bio }: { rows: Row[]; bio: string }) {
  const reduced = usePrefersReducedMotion();
  const compact = useMediaQuery("(max-width: 860px), (hover: none)");
  const [active, setActive] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  const listRef = useRef<HTMLOListElement>(null);
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);
  const tops = useRef<number[]>([]);
  const fig = useRef<Record<string, HTMLElement | null>>({});

  // Scroll-driven clearing. Row positions are measured at rest (on resize / layout change),
  // never during the frame, and --p only drives paint (opacity, transforms), so motion
  // never feeds back into its own measurements.
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      tops.current = rowRefs.current.map((el) => (el ? el.getBoundingClientRect().top + window.scrollY : 0));
      schedule();
    };
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const line = window.scrollY + vh * 0.8;
      const t = { posted: 0, lent: 0, businesses: 0, countries: 0, monthly: 0 };
      const seen = new Set<string>();
      rows.forEach((r, i) => {
        const el = rowRefs.current[i];
        if (!el) return;
        const p = reduced ? 1 : clamp((line - tops.current[i]) / (vh * 0.16));
        el.style.setProperty("--p", p.toFixed(3));
        const posted = p > 0.98 ? "true" : "false";
        if (el.dataset.posted !== posted) el.dataset.posted = posted;
        t.posted += p;
        const c = CONTRIB[r.slug];
        if (c) for (const k in c) t[k as keyof typeof t] += (c[k as keyof typeof c] ?? 0) * p;
        if (p > 0.5) seen.add(r.sector);
      });
      const set = (k: string, v: string) => {
        const el = fig.current[k];
        if (el && el.textContent !== v) el.textContent = v;
      };
      set("posted", `${String(Math.round(t.posted)).padStart(2, "0")}/${rows.length}`);
      set("sectors", String(seen.size));
      set("lent", `$${t.lent.toFixed(1)}M`);
      set("businesses", Math.round(t.businesses).toLocaleString("en-US"));
      set("countries", String(Math.round(t.countries)));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (listRef.current) ro.observe(listRef.current);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
    };
  }, [rows, reduced]);

  const activeRow = active === null ? null : rows[active];

  return (
    <div className="l-body">
      <div className="l-balance" aria-hidden="true">
        <div className="l-wrap l-balance-in">
          <span className="l-balance-label">Running balance</span>
          <Fig label="Posted" k="posted" fig={fig} init={`00/${rows.length}`} />
          <Fig label="Sectors" k="sectors" fig={fig} init="0" hideCompact />
          <Fig label="Lent" k="lent" fig={fig} init="$0.0M" />
          <Fig label="Businesses" k="businesses" fig={fig} init="0" />
          <Fig label="Countries" k="countries" fig={fig} init="0" hideCompact />
        </div>
      </div>

      <div className="l-wrap l-grid">
        <section aria-labelledby="entries-h">
          <h2 id="entries-h" className="sr-only">
            Entries, oldest first
          </h2>
          <div className="l-cols" aria-hidden="true">
            <span>Date</span>
            <span>Description</span>
            <span>Sector</span>
            <span>Credit</span>
            <span>Status</span>
            <span>No.</span>
          </div>
          <ol ref={listRef} className="l-rows" onMouseLeave={() => undefined}>
            {rows.map((r, i) => (
              <li
                key={r.slug}
                ref={(el) => {
                  rowRefs.current[i] = el;
                }}
                className="l-row"
                data-active={active === i || undefined}
                onPointerEnter={(e) => e.pointerType === "mouse" && !compact && setActive(i)}
              >
                <span className="c-date">{period(r)}</span>
                <button
                  type="button"
                  className="c-desc"
                  onFocus={() => !compact && setActive(i)}
                  onClick={() => (compact ? setOpen(open === i ? null : i) : setActive(i))}
                  aria-expanded={compact ? open === i : undefined}
                  aria-controls={compact ? `rc-${r.slug}` : "l-receipt"}
                >
                  <span className="c-title">{r.title}</span>
                  <span className="c-client">{r.client}</span>
                </button>
                <span className="c-sector">{r.sectorLabel}</span>
                <span className="c-impact">{r.impact ?? "—"}</span>
                <span className="c-status">
                  <span className="st-pend" aria-hidden="true">
                    Pending
                  </span>
                  <span className="st-post" aria-hidden="true">
                    Posted
                  </span>
                </span>
                <span className="c-no" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="c-rule" aria-hidden="true" />
                {compact && open === i && (
                  <div id={`rc-${r.slug}`} className="l-inline">
                    <Receipt row={r} reduced={reduced} />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </section>

        {!compact && (
          <aside className="l-aside" aria-label="Receipt" id="l-receipt" aria-live="polite">
            <div className="l-sticky">
              {activeRow ? (
                <Receipt key={activeRow.slug} row={activeRow} reduced={reduced} />
              ) : (
                <AccountSlip bio={bio} reduced={reduced} />
              )}
              <p className="l-hint">{activeRow ? "Point at another entry to print its receipt." : "Point at an entry to print its receipt."}</p>
            </div>
          </aside>
        )}
      </div>

      <section className="l-wrap l-closing" aria-labelledby="closing-h">
        <h2 id="closing-h" className="l-h2">
          Closing balance
        </h2>
        <dl className="l-closing-figs">
          {person.stats.map((s) => (
            <div key={s.id}>
              <dt>{s.label}</dt>
              <dd>
                {s.prefix}
                {s.value.toLocaleString("en-US")}
                {s.suffix}
              </dd>
            </div>
          ))}
        </dl>
        <div className="l-notes">
          <h3>Account notes</h3>
          <p>{bio}</p>
          <p className="l-stack">
            <span>Instruments:</span> {person.stack.join(" · ")}
          </p>
        </div>
      </section>
    </div>
  );
}

function Fig({
  label,
  k,
  fig,
  init,
  hideCompact,
}: {
  label: string;
  k: string;
  fig: React.RefObject<Record<string, HTMLElement | null>>;
  init: string;
  hideCompact?: boolean;
}) {
  return (
    <span className={`l-fig${hideCompact ? " l-fig-wide" : ""}`}>
      <span className="l-fig-label">{label}</span>
      <span
        className="l-fig-val"
        ref={(el) => {
          fig.current[k] = el;
        }}
      >
        {init}
      </span>
    </span>
  );
}

function Printed({ children, reduced }: { children: React.ReactNode; reduced: boolean }) {
  // The slip prints top to bottom, the way a till roll comes out.
  return (
    <motion.div
      className="l-slip"
      initial={reduced ? false : { clipPath: "inset(0 0 100% 0)", y: -12 }}
      animate={{ clipPath: "inset(0 0 0% 0)", y: 0 }}
      transition={{ duration: DUR.slow, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function Receipt({ row, reduced }: { row: Row; reduced: boolean }) {
  return (
    <Printed reduced={reduced}>
      <p className="s-head">
        <span>{person.name}</span>
        <span>Receipt</span>
      </p>
      <p className="s-ref">REF {ref(row)}</p>
      <div className="s-img">
        <Image src={row.image} alt={`${row.title} screenshot`} fill sizes="300px" />
      </div>
      <dl className="s-lines">
        <div>
          <dt>Item</dt>
          <dd>{row.title}</dd>
        </div>
        <div>
          <dt>For</dt>
          <dd>{row.client}</dd>
        </div>
        <div>
          <dt>Sector</dt>
          <dd>{row.sectorLabel}</dd>
        </div>
        <div>
          <dt>Period</dt>
          <dd>{period(row)}</dd>
        </div>
        {row.impact && (
          <div className="s-total">
            <dt>Credit</dt>
            <dd>{row.impact}</dd>
          </div>
        )}
      </dl>
      <p className="s-desc">{row.description}</p>
      <a className="s-link" href={row.link} target="_blank" rel="noreferrer">
        Open {row.title} <span aria-hidden="true">↗</span>
      </a>
      <Barcode seed={row.slug} />
    </Printed>
  );
}

function AccountSlip({ bio, reduced }: { bio: string; reduced: boolean }) {
  return (
    <Printed reduced={reduced}>
      <p className="s-head">
        <span>{person.name}</span>
        <span>Account</span>
      </p>
      <p className="s-ref">{person.role}</p>
      <p className="s-desc">{bio}</p>
      <Barcode seed="ororeozore" />
    </Printed>
  );
}

function Barcode({ seed }: { seed: string }) {
  // Bars derived from the slug, so every receipt has its own code.
  const bars = Array.from(seed.repeat(3)).map((c, i) => ((c.charCodeAt(0) * (i + 7)) % 4) + 1);
  return (
    <div className="s-bar" aria-hidden="true">
      {bars.map((w, i) => (
        <i key={i} style={{ width: w, marginRight: ((w * 3) % 3) + 1 }} />
      ))}
    </div>
  );
}
