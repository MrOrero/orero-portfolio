"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Project, Sector } from "@/content";
import { DUR, EASE, clamp, useMediaQuery, usePrefersReducedMotion } from "@/lib/motion";

type Span = {
  id: string;
  kind: "root" | "sector" | "project";
  label: string;
  start: number;
  end: number; // exclusive, in years
  depth: number;
  sector?: string;
  project?: Project;
};

const T0 = 2020;
const T1 = 2026;
const frac = (y: number) => (y - T0) / (T1 - T0);
const yearAt = (f: number) => T0 + f * (T1 - T0);

export default function Trace({
  projects,
  sectors,
  name,
  role,
}: {
  projects: Project[];
  sectors: Sector[];
  name: string;
  role: string;
}) {
  const reduced = usePrefersReducedMotion();
  const mobile = useMediaQuery("(max-width: 899px)");

  // Root span → sector spans → project spans, like a real trace tree.
  const spans = useMemo(() => {
    const out: Span[] = [{ id: "root", kind: "root", label: "build-the-product", start: T0, end: T1, depth: 0 }];
    const bySector = sectors
      .map((s) => ({ s, ps: projects.filter((p) => p.sector === s.id).sort((a, b) => a.start - b.start) }))
      .filter((g) => g.ps.length)
      .sort((a, b) => a.ps[0].start - b.ps[0].start);
    for (const { s, ps } of bySector) {
      out.push({
        id: s.id,
        kind: "sector",
        label: s.label.toLowerCase().replace(/\s+&\s+/, "-"),
        start: Math.min(...ps.map((p) => p.start)),
        end: Math.max(...ps.map((p) => p.end)) + 1,
        depth: 1,
        sector: s.id,
      });
      for (const p of ps)
        out.push({ id: p.slug, kind: "project", label: p.title, start: p.start, end: p.end + 1, depth: 2, sector: s.id, project: p });
    }
    return out;
  }, [projects, sectors]);

  const projectSpans = spans.filter((s) => s.kind === "project");
  const [t, setT] = useState(2025.5);
  const [pinned, setPinned] = useState<string | null>(null);
  const tRef = useRef(2025.5);
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const interacted = useRef(false);
  const raf = useRef(0);

  const active = projectSpans.filter((s) => s.start <= t && t < s.end);
  const hot =
    spans.find((s) => s.id === pinned) ??
    [...active].sort((a, b) => b.start - a.start || Number(b.project!.featured) - Number(a.project!.featured))[0] ??
    null;

  // Paint the scrubber position every frame via a CSS variable; only re-render React
  // when the quarter-year changes, which is what changes the set of active spans.
  const apply = useCallback((year: number) => {
    tRef.current = year;
    wrapRef.current?.style.setProperty("--t", String(frac(year)));
    const q = Math.floor(year * 4) / 4 + 0.001;
    setT((cur) => (Math.abs(cur - q) < 0.01 ? cur : q));
  }, []);

  // Idle drift until the visitor takes the scrubber.
  useEffect(() => {
    if (mobile) return;
    if (reduced) {
      apply(2025.5);
      return;
    }
    const t0 = performance.now();
    const loop = (now: number) => {
      if (interacted.current) return;
      const phase = ((now - t0) / 26000) * Math.PI * 2;
      apply(yearAt((0.5 - 0.5 * Math.cos(phase)) * 0.9999));
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [reduced, mobile, apply]);

  const take = () => {
    interacted.current = true;
    cancelAnimationFrame(raf.current);
  };

  // Drag vs click: movement over 4px is a scrub; otherwise it's a click on whatever is under it.
  const drag = useRef<{ x0: number; left: number; width: number; moved: boolean; pending: number | null } | null>(null);
  const suppressClick = useRef(false);
  const dragRaf = useRef(0);
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    take();
    const r = trackRef.current!.getBoundingClientRect(); // measured at rest, once per gesture
    drag.current = { x0: e.clientX, left: r.left, width: r.width, moved: false, pending: null };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.abs(e.clientX - d.x0) > 4) {
      d.moved = true;
      // Capture only once it is a drag, so a plain click still reaches the span under it.
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      e.preventDefault();
    }
    if (!d.moved) return;
    d.pending = yearAt(clamp((e.clientX - d.left) / d.width, 0, 0.9999));
    if (!dragRaf.current)
      dragRaf.current = requestAnimationFrame(() => {
        dragRaf.current = 0;
        if (drag.current?.pending != null) apply(drag.current.pending);
      });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.moved) {
      suppressClick.current = true;
      setTimeout(() => (suppressClick.current = false), 0);
      return;
    }
    const target = (e.target as HTMLElement).closest("[data-span]");
    if (!target && e.clientX >= d.left) apply(yearAt(clamp((e.clientX - d.left) / d.width, 0, 0.9999)));
  };

  const select = (s: Span) => {
    if (suppressClick.current) return;
    take();
    setPinned((p) => (p === s.id ? null : s.id));
    if (s.kind === "project" && !(s.start <= tRef.current && tRef.current < s.end)) apply(s.start + 0.5);
  };

  const onSliderKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 1 : 0.25;
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = tRef.current + step;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = tRef.current - step;
    if (e.key === "Home") next = T0;
    if (e.key === "End") next = T1 - 0.01;
    if (next === null) return;
    e.preventDefault();
    take();
    apply(clamp(next, T0, T1 - 0.01));
  };

  const year = Math.floor(t);
  const who = hot?.project?.client;
  const heroLine = hot
    ? [year, hot.label, who && who !== hot.label ? who : null, active.length > 1 ? `+${active.length - 1} concurrent` : null]
        .filter(Boolean)
        .join(" · ")
    : `${year} · idle`;

  if (mobile) return <MobileTrace spans={spans} name={name} role={role} reduced={reduced} />;

  return (
    <div className="t-app" ref={wrapRef} style={{ ["--t" as string]: frac(t) }}>
      <header className="t-header">
        <p className="t-meta">
          <span>trace_id 0x0r3r0</span>
          <span>service orero</span>
          <span>
            {T0} → {T1 - 1}
          </span>
          <span>{projectSpans.length} spans</span>
        </p>
        <h1 className="t-name">
          {name}
          <span className="t-role">{role}, end to end</span>
        </h1>
        <p className="t-line" aria-live="polite">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={heroLine}
              initial={reduced ? false : { y: "0.6em", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduced ? undefined : { y: "-0.6em", opacity: 0 }}
              transition={{ duration: DUR.fast * 1.5, ease: EASE }}
            >
              {heroLine}
            </motion.span>
          </AnimatePresence>
        </p>
      </header>

      <div className="t-grid">
        <section aria-labelledby="wf-h" className="t-wf">
          <h2 id="wf-h" className="sr-only">
            Projects as a trace waterfall
          </h2>
          <div className="t-axis" aria-hidden="true">
            <span className="t-axis-name">span</span>
            <div className="t-axis-track">
              {Array.from({ length: T1 - T0 }, (_, i) => (
                <span key={i} style={{ left: `${(i / (T1 - T0)) * 100}%` }}>
                  {T0 + i}
                </span>
              ))}
            </div>
          </div>
          <div
            className="t-rows"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => (drag.current = null)}
          >
            <div className="t-scrub-zone" ref={trackRef}>
              <div
                className="t-scrubber"
                role="slider"
                tabIndex={0}
                aria-label="Time scrubber"
                aria-valuemin={T0}
                aria-valuemax={T1}
                aria-valuenow={Number(t.toFixed(2))}
                aria-valuetext={`${year}: ${active.map((a) => a.label).join(", ") || "no active spans"}`}
                onKeyDown={onSliderKey}
              >
                <span className="t-scrub-year">{year}</span>
              </div>
            </div>
            {spans.map((s) => {
              const on = s.kind === "project" ? active.includes(s) : s.start <= t && t < s.end;
              return (
                <div key={s.id} className={`t-row k-${s.kind}`} data-on={on || undefined} data-pinned={pinned === s.id || undefined} data-sector={s.sector}>
                  <span className="t-label" style={{ paddingLeft: s.depth * 16 }}>
                    {s.kind !== "project" && <span className="t-caret" aria-hidden="true">▾</span>}
                    {s.label}
                  </span>
                  <div className="t-track">
                    <button
                      type="button"
                      data-span
                      className="t-bar"
                      style={{ left: `${frac(s.start) * 100}%`, width: `${(frac(s.end) - frac(s.start)) * 100}%` }}
                      onClick={() => select(s)}
                      aria-pressed={pinned === s.id}
                      aria-label={`${s.label}, ${s.start} to ${s.end - 1}${s.project ? `, ${s.project.client}` : ""}`}
                    >
                      <span className="t-dur" aria-hidden="true">
                        {s.end - s.start}y
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="t-hint">Drag across the waterfall to scrub through time. Click a span to pin it. Arrow keys work on the scrubber.</p>
        </section>

        <aside className="t-inspect" aria-label="Span attributes">
          <div className="t-sticky">{hot ? <Inspector span={hot} pinned={pinned === hot.id} reduced={reduced} onUnpin={() => setPinned(null)} /> : null}</div>
        </aside>
      </div>
    </div>
  );
}

function Inspector({ span, pinned, reduced, onUnpin }: { span: Span; pinned: boolean; reduced: boolean; onUnpin: () => void }) {
  const p = span.project;
  return (
    <motion.div
      key={span.id}
      className="t-panel"
      initial={reduced ? false : { opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: DUR.fast, ease: EASE }}
    >
      <div className="t-panel-head">
        <span>span attributes</span>
        {pinned ? (
          <button type="button" onClick={onUnpin}>
            unpin
          </button>
        ) : (
          <span className="t-dim">following scrubber</span>
        )}
      </div>
      <h3 className="t-panel-title">{span.label}</h3>
      <dl className="t-attrs">
        <Attr k="span.kind" v={span.kind} />
        {span.sector && <Attr k="service" v={span.sector} />}
        {p && <Attr k="client" v={p.client} />}
        <Attr k="start" v={String(span.start)} />
        <Attr k="duration" v={`${span.end - span.start}y`} />
        <Attr k="status" v="OK" ok />
        {p?.impact && <Attr k="impact" v={p.impact} ok />}
      </dl>
      {p && (
        <>
          <div className="t-attach">
            <Image src={p.image} alt={`${p.title} screenshot`} fill sizes="360px" />
          </div>
          <p className="t-desc">{p.description}</p>
          <a className="t-open" href={p.link} target="_blank" rel="noreferrer">
            open {new URL(p.link).hostname.replace("www.", "")} <span aria-hidden="true">↗</span>
          </a>
        </>
      )}
    </motion.div>
  );
}

function Attr({ k, v, ok }: { k: string; v: string; ok?: boolean }) {
  return (
    <div>
      <dt>{k}</dt>
      <dd className={ok ? "t-ok" : undefined}>{v}</dd>
    </div>
  );
}

/** Touch: the axis turns vertical. Scrolling is the scrubber; the row crossing the centre line is live. */
function MobileTrace({ spans, name, role, reduced }: { spans: Span[]; name: string; role: string; reduced: boolean }) {
  const rows = spans.filter((s) => s.kind === "project").sort((a, b) => a.start - b.start || a.end - b.end);
  const [live, setLive] = useState(rows[0]?.id);
  const [open, setOpen] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLLIElement | null>>({});

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setLive((e.target as HTMLElement).dataset.id!)),
      { rootMargin: "-50% 0px -50% 0px" },
    );
    Object.values(refs.current).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const cur = rows.find((r) => r.id === live)!;
  return (
    <div className="t-app t-m">
      <header className="t-header">
        <p className="t-meta">
          <span>trace_id 0x0r3r0</span>
          <span>{rows.length} spans</span>
        </p>
        <h1 className="t-name">
          {name}
          <span className="t-role">{role}, end to end</span>
        </h1>
      </header>
      <div className="t-m-now" aria-hidden="true">
        <span className="t-m-year">{cur.start}</span>
        <span className="t-m-label">{cur.label}</span>
      </div>
      <div className="t-m-center" aria-hidden="true" />
      <h2 className="sr-only">Projects, oldest first</h2>
      <ol className="t-m-list">
        {rows.map((r) => (
          <li
            key={r.id}
            data-id={r.id}
            ref={(el) => {
              refs.current[r.id] = el;
            }}
            data-live={live === r.id || undefined}
            data-sector={r.sector}
            className="t-m-row"
          >
            <span className="t-m-time">{r.start}</span>
            <span className="t-m-bar" style={{ height: `${(r.end - r.start) * 28}px` }} aria-hidden="true" />
            <div className="t-m-body">
              <button type="button" aria-expanded={open === r.id} onClick={() => setOpen(open === r.id ? null : r.id)}>
                <span className="t-m-title">{r.label}</span>
                <span className="t-dim">
                  {r.project!.client} · {r.end - r.start}y
                </span>
              </button>
              {open === r.id && (
                <motion.div
                  initial={reduced ? false : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DUR.fast, ease: EASE }}
                  className="t-m-detail"
                >
                  <div className="t-attach">
                    <Image src={r.project!.image} alt={`${r.label} screenshot`} fill sizes="90vw" />
                  </div>
                  <p className="t-desc">{r.project!.description}</p>
                  {r.project!.impact && <p className="t-ok">{r.project!.impact}</p>}
                  <a className="t-open" href={r.project!.link} target="_blank" rel="noreferrer">
                    open <span aria-hidden="true">↗</span>
                  </a>
                </motion.div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
