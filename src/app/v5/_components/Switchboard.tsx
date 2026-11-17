"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Project, Sector, SectorId } from "@/content";
import { DUR, EASE, easeOut, useMediaQuery, usePrefersReducedMotion } from "@/lib/motion";

type P = { x: number; y: number; px: number; py: number };
type V = { x: number; y: number };

const N = 30; // rope points
const G = 0.55; // gravity, px/frame²
const SNAP = 46; // px from jack centre
const PLUG = 54; // plug length, drawn back along the cable from its tip

export default function Switchboard({ projects, sectors }: { projects: Project[]; sectors: Sector[] }) {
  const reduced = usePrefersReducedMotion();
  const desk = useMediaQuery("(min-width: 900px) and (hover: hover)");
  const [patched, setPatched] = useState<SectorId | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  const lit = useMemo(() => new Set(projects.filter((p) => p.sector === patched).map((p) => p.slug)), [projects, patched]);
  const lineProjects = projects.filter((p) => p.sector === patched);
  const pickedProject = projects.find((p) => p.slug === picked) ?? null;

  const patch = (s: SectorId | null) => {
    setPatched(s);
    setPicked(null);
  };

  const lamps = (
    <ul className="s-lamps" aria-label="Project lamps">
      {projects.map((p) => (
        <li key={p.slug} data-sector={p.sector}>
          <button
            type="button"
            className="s-lamp"
            data-lit={lit.has(p.slug) || undefined}
            data-picked={picked === p.slug || undefined}
            aria-pressed={picked === p.slug}
            aria-label={`${p.title}${lit.has(p.slug) ? ", lit" : ""}`}
            onClick={() => {
              if (patched !== p.sector) setPatched(p.sector);
              setPicked(p.slug);
            }}
          >
            <span className="s-bulb" aria-hidden="true" />
            <span className="s-lamp-label" aria-hidden="true">
              {p.title}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );

  const line = (
    <Line sector={sectors.find((s) => s.id === patched) ?? null} projects={lineProjects} picked={pickedProject} onPick={setPicked} reduced={reduced} />
  );
  return (
    <div className="s-console">
      {desk ? (
        <>
          <DeskBoard sectors={sectors} patched={patched} onPatch={patch} reduced={reduced} lamps={lamps} />
          {line}
        </>
      ) : (
        // Touch: the line sits right under the jacks, so a tap shows its result in view.
        <TouchBoard sectors={sectors} patched={patched} onPatch={patch} lamps={lamps} line={line} />
      )}
    </div>
  );
}

function Jacks({
  sectors,
  patched,
  near,
  onPatch,
  jackRefs,
}: {
  sectors: Sector[];
  patched: SectorId | null;
  near?: SectorId | null;
  onPatch: (s: SectorId | null) => void;
  jackRefs?: React.RefObject<Record<string, HTMLElement | null>>;
}) {
  return (
    <ul className="s-jacks" aria-label="Sector jacks">
      {sectors.map((s) => (
        <li key={s.id} data-sector={s.id}>
          <button
            type="button"
            className="s-jack"
            aria-pressed={patched === s.id}
            data-near={near === s.id || undefined}
            onClick={() => onPatch(patched === s.id ? null : s.id)}
          >
            <span className="s-jack-code" aria-hidden="true">
              {s.code}
            </span>
            <span
              className="s-hole"
              aria-hidden="true"
              ref={(el) => {
                if (jackRefs) jackRefs.current[s.id] = el;
              }}
            />
            <span className="s-jack-label">{s.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function TouchBoard({
  sectors,
  patched,
  onPatch,
  lamps,
  line,
}: {
  sectors: Sector[];
  patched: SectorId | null;
  onPatch: (s: SectorId | null) => void;
  lamps: React.ReactNode;
  line: React.ReactNode;
}) {
  return (
    <div className="s-board s-board-touch">
      <p className="s-instr">Tap a jack to patch the operator into that sector.</p>
      <Jacks sectors={sectors} patched={patched} onPatch={onPatch} />
      <div className="s-touch-line">{line}</div>
      {lamps}
    </div>
  );
}

/**
 * Desk: one operator cord, simulated as a verlet rope. Jack and holster positions are
 * measured at rest (mount / resize), never from the animating cable.
 */
function DeskBoard({
  sectors,
  patched,
  onPatch,
  reduced,
  lamps,
}: {
  sectors: Sector[];
  patched: SectorId | null;
  onPatch: (s: SectorId | null) => void;
  reduced: boolean;
  lamps: React.ReactNode;
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const holsterRef = useRef<HTMLSpanElement>(null);
  const jackRefs = useRef<Record<string, HTMLElement | null>>({});
  const cableRef = useRef<SVGPathElement>(null);
  const cableHiRef = useRef<SVGPathElement>(null);
  const shadowRef = useRef<SVGPathElement>(null);
  const plugRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState<SectorId | null>(null);
  const [dragging, setDragging] = useState(false);

  const geo = useRef({ base: { x: 0, y: 0 }, holster: { x: 0, y: 0 }, jacks: {} as Record<string, V>, reach: 600, seg: 20 });
  const pts = useRef<P[]>([]);
  const tip = useRef<V>({ x: 0, y: 0 });
  const tween = useRef<{ from: V; to: V; t0: number; dur: number } | null>(null);
  const drag = useRef<{ left: number; top: number; x0: number; y0: number; moved: boolean; id: number } | null>(null);
  const pointer = useRef<V | null>(null);
  const patchedRef = useRef(patched);
  const nearRef = useRef<SectorId | null>(null);

  const go = useCallback(
    (to: V) => {
      if (reduced) {
        tip.current = { ...to };
        tween.current = null;
        return;
      }
      tween.current = { from: { ...tip.current }, to, t0: performance.now(), dur: DUR.slow * 1000 };
    },
    [reduced],
  );

  const measure = useCallback(() => {
    const b = boardRef.current!.getBoundingClientRect();
    const c = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2 };
    };
    const g = geo.current;
    g.holster = c(holsterRef.current!);
    g.base = { x: g.holster.x, y: b.height + 30 };
    for (const s of sectors) {
      const el = jackRefs.current[s.id];
      if (el) g.jacks[s.id] = c(el);
    }
    const far = Math.max(...Object.values(g.jacks).map((j) => Math.hypot(j.x - g.base.x, j.y - g.base.y)));
    g.reach = far * 1.32;
    g.seg = g.reach / (N - 1);
    const at = patchedRef.current ? g.jacks[patchedRef.current] : g.holster;
    tip.current = { ...at };
    tween.current = null;
    pts.current = Array.from({ length: N }, (_, i) => {
      const t = i / (N - 1);
      const x = g.base.x + (at.x - g.base.x) * t;
      const y = g.base.y + (at.y - g.base.y) * t;
      return { x, y, px: x, py: y };
    });
  }, [sectors]);

  // Keyboard / lamp patches move the plug too.
  useEffect(() => {
    patchedRef.current = patched;
    if (drag.current) return;
    const g = geo.current;
    if (!g.jacks || !pts.current.length) return;
    go(patched ? g.jacks[patched] : g.holster);
  }, [patched, go]);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(boardRef.current!);
    let raf = 0;
    const loop = (now: number) => {
      const g = geo.current;
      // 1. Where is the tip this frame?
      if (pointer.current) {
        let { x, y } = pointer.current;
        const dx = x - g.base.x;
        const dy = y - g.base.y;
        const d = Math.hypot(dx, dy);
        if (d > g.reach * 0.985) {
          x = g.base.x + (dx / d) * g.reach * 0.985;
          y = g.base.y + (dy / d) * g.reach * 0.985;
        }
        tip.current = { x, y };
      } else if (tween.current) {
        const tw = tween.current;
        const k = Math.min(1, (now - tw.t0) / tw.dur);
        const e = easeOut(k);
        tip.current = { x: tw.from.x + (tw.to.x - tw.from.x) * e, y: tw.from.y + (tw.to.y - tw.from.y) * e };
        if (k >= 1) tween.current = null;
      }
      // 2. Verlet rope, pinned at the desk and at the plug tip.
      const p = pts.current;
      if (p.length) {
        const sway = reduced ? 0 : Math.sin(now / 1400) * 0.06;
        for (let i = 1; i < N - 1; i++) {
          const q = p[i];
          const vx = (q.x - q.px) * 0.96;
          const vy = (q.y - q.py) * 0.96;
          q.px = q.x;
          q.py = q.y;
          q.x += vx + sway * Math.sin((i / N) * Math.PI);
          q.y += vy + G;
        }
        p[0].x = g.base.x;
        p[0].y = g.base.y;
        p[N - 1].x = tip.current.x;
        p[N - 1].y = tip.current.y;
        for (let k = 0; k < 18; k++) {
          for (let i = 0; i < N - 1; i++) {
            const a = p[i];
            const b = p[i + 1];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const d = Math.hypot(dx, dy) || 0.0001;
            if (d <= g.seg) continue; // a rope resists stretch, not slack
            const diff = (d - g.seg) / d;
            const aPinned = i === 0;
            const bPinned = i + 1 === N - 1;
            if (aPinned && !bPinned) {
              b.x -= dx * diff;
              b.y -= dy * diff;
            } else if (bPinned && !aPinned) {
              a.x += dx * diff;
              a.y += dy * diff;
            } else if (!aPinned && !bPinned) {
              a.x += dx * diff * 0.5;
              a.y += dy * diff * 0.5;
              b.x -= dx * diff * 0.5;
              b.y -= dy * diff * 0.5;
            }
          }
        }
        // 3. Paint.
        let d = `M${p[0].x.toFixed(1)} ${p[0].y.toFixed(1)}`;
        for (let i = 1; i < N - 1; i++) {
          const mx = (p[i].x + p[i + 1].x) / 2;
          const my = (p[i].y + p[i + 1].y) / 2;
          d += `Q${p[i].x.toFixed(1)} ${p[i].y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
        }
        cableRef.current?.setAttribute("d", d);
        cableHiRef.current?.setAttribute("d", d);
        shadowRef.current?.setAttribute("d", d);
        // The plug points along the last stretch of cable.
        const back = p[N - 4];
        const ang = Math.atan2(tip.current.y - back.y, tip.current.x - back.x);
        if (plugRef.current)
          plugRef.current.style.transform = `translate(${tip.current.x}px, ${tip.current.y}px) rotate(${ang}rad)`;
      }
      // 4. Which jack is the plug near?
      if (pointer.current) {
        const best = nearest(g.jacks, pointer.current);
        if (best !== nearRef.current) {
          nearRef.current = best;
          setNear(best);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [measure, reduced]);

  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const b = boardRef.current!.getBoundingClientRect();
    drag.current = { left: b.left, top: b.top, x0: e.clientX, y0: e.clientY, moved: false, id: e.pointerId };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 4) {
      d.moved = true;
      tween.current = null;
      setDragging(true);
    }
    if (d.moved) pointer.current = { x: e.clientX - d.left, y: e.clientY - d.top };
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    pointer.current = null;
    setDragging(false);
    if (!d) return;
    const g = geo.current;
    if (!d.moved) {
      // A click on the plug, not a drag: pull it out if seated.
      if (patchedRef.current) onPatch(null);
      return;
    }
    // Decide from the release point itself, not from whatever the last frame saw.
    const target = nearest(g.jacks, { x: e.clientX - d.left, y: e.clientY - d.top });
    nearRef.current = null;
    setNear(null);
    if (target) {
      go(g.jacks[target]);
      onPatch(target);
    } else {
      go(g.holster);
      onPatch(null);
    }
  };

  return (
    <div className="s-board" ref={boardRef} data-dragging={dragging || undefined}>
      {lamps}
      <Jacks sectors={sectors} patched={patched} near={near} onPatch={onPatch} jackRefs={jackRefs} />
      <svg className="s-cable" aria-hidden="true">
        <path ref={shadowRef} className="s-cable-shadow" />
        <path ref={cableRef} className="s-cable-body" />
        <path ref={cableHiRef} className="s-cable-hi" />
      </svg>
      <div className="s-desk">
        <span className="s-holster" ref={holsterRef} aria-hidden="true" />
        <span className="s-desk-label">Operator · {patched ? "on the line" : "idle"}</span>
      </div>
      <div
        ref={plugRef}
        className="s-plug"
        aria-hidden="true"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <span className="s-plug-body" />
      </div>
      <p className="s-instr s-instr-desk">
        {patched ? "Pull the cord out to hang up, or plug it into another sector." : "Pick up the operator’s cord and plug it into a sector."}
        <span className="sr-only"> Keyboard: each sector jack is a button.</span>
      </p>
    </div>
  );
}

function nearest(jacks: Record<string, V>, at: V): SectorId | null {
  let best: SectorId | null = null;
  let bd = SNAP;
  for (const [id, j] of Object.entries(jacks)) {
    const dd = Math.hypot(j.x - at.x, j.y - at.y);
    if (dd < bd) {
      bd = dd;
      best = id as SectorId;
    }
  }
  return best;
}

function Line({
  sector,
  projects,
  picked,
  onPick,
  reduced,
}: {
  sector: Sector | null;
  projects: Project[];
  picked: Project | null;
  onPick: (s: string) => void;
  reduced: boolean;
}) {
  return (
    <section className="s-line" aria-live="polite" aria-labelledby="line-h">
      <h2 id="line-h" className="s-line-h">
        {sector ? (
          <>
            <span className="s-line-code">{sector.code}</span> {sector.label}
          </>
        ) : (
          "No line"
        )}
      </h2>
      {!sector && <p className="s-line-idle">Nothing patched. The lamps above are every project; a sector lights its own.</p>}
      {sector && (
        <ul className="s-line-list" data-sector={sector.id}>
          {projects.map((p) => (
            <li key={p.slug}>
              <button type="button" aria-pressed={picked?.slug === p.slug} onClick={() => onPick(p.slug)}>
                <span>{p.title}</span>
                <span className="s-dim">{p.client}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <AnimatePresence mode="wait" initial={false}>
        {picked && (
          <motion.article
            key={picked.slug}
            className="s-card"
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: DUR.base, ease: EASE }}
          >
            <div className="s-card-img">
              <Image src={picked.image} alt={`${picked.title} screenshot`} fill sizes="360px" />
            </div>
            <h3>{picked.title}</h3>
            <p>{picked.description}</p>
            {picked.impact && <p className="s-impact">{picked.impact}</p>}
            <a href={picked.link} target="_blank" rel="noreferrer">
              Connect <span aria-hidden="true">↗</span>
            </a>
          </motion.article>
        )}
      </AnimatePresence>
    </section>
  );
}
