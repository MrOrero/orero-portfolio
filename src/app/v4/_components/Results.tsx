"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useReduced } from "@/lib/motion";
import { useState } from "react";
import { useRef } from "react";
import { opt } from "@/lib/intro-key";
import { EASE_L } from "./ease";
import type { Spec } from "./types";
import { Words } from "./Words";

const VW = 1000;
const VH = 500;

/**
 * The results sheet, pinned. The curve is real: projects shipped, counted up
 * by the year each one finished. Scrolling draws it year by year, and the
 * specimens that finished that year come up beside it with their live links.
 */
export function Results({ specs }: { specs: Spec[] }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReduced();
  const years = [...new Set(specs.map((s) => s.end))].sort((a, b) => a - b);
  const pts = years.map((y, i) => {
    const cum = specs.filter((s) => s.end <= y).length;
    return { year: y, cum, x: (i / (years.length - 1)) * VW, y: VH - (cum / specs.length) * (VH - 40) };
  });
  const d = `M0 ${VH} ` + pts.map((p) => `L${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `${d} L${VW} ${VH} Z`;

  const [step, setI] = useState(0);
  const i = reduce ? years.length - 1 : step;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useTransform(scrollYProgress, [0.04, 0.92], [0, 1], { clamp: true });
  const clip = useTransform(p, (v) => `inset(0 ${((1 - (reduce ? 1 : v)) * 100).toFixed(2)}% 0 0)`);
  const mx = useTransform(p, (v) => {
    const f = (reduce ? 1 : v) * (pts.length - 1);
    const a = Math.floor(f);
    const b = Math.min(pts.length - 1, a + 1);
    return `${((pts[a].x + (pts[b].x - pts[a].x) * (f - a)) / 10).toFixed(2)}%`;
  });
  const my = useTransform(p, (v) => {
    const f = (reduce ? 1 : v) * (pts.length - 1);
    const a = Math.floor(f);
    const b = Math.min(pts.length - 1, a + 1);
    return `${(((pts[a].y + (pts[b].y - pts[a].y) * (f - a)) / VH) * 100).toFixed(2)}%`;
  });
  useMotionValueEvent(p, "change", (v) => {
    const n = Math.min(years.length - 1, Math.round(v * (years.length - 1)));
    setI((c) => (c === n ? c : n));
  });

  const cur = pts[i];
  const batch = specs.filter((s) => s.end === cur.year);

  return (
    <section ref={ref} id="results" className="l-results" aria-labelledby="l-results-title" style={{ height: reduce ? undefined : `${years.length * 70 + 60}svh` }}>
      <div className="l-results-pin">
        <div className="l-wrap l-results-head">
          <p className="l-kicker">01 · Results</p>
          <Words id="l-results-title" className="l-h2" text="Load, year by year." />
        </div>
        <div className="l-wrap l-results-grid">
          <figure className="l-plot">
            <div className="l-plot-box">
              <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" aria-hidden="true">
                {[0.25, 0.5, 0.75].map((g) => (
                  <line key={g} x1="0" x2={VW} y1={VH * g} y2={VH * g} className="l-plot-grid" vectorEffect="non-scaling-stroke" />
                ))}
                <path d={d} className="l-plot-ghost" vectorEffect="non-scaling-stroke" />
                <motion.g style={{ clipPath: clip }}>
                  <path d={area} className="l-plot-area" />
                  <path d={d} className="l-plot-line" vectorEffect="non-scaling-stroke" />
                </motion.g>
              </svg>
              <motion.span className="l-plot-mark" style={{ x: mx, y: my }} aria-hidden="true">
                <span />
              </motion.span>
              <ol className="l-plot-years" aria-hidden="true">
                {pts.map((pt, k) => (
                  <li key={pt.year} data-on={k <= i ? "" : undefined} style={{ left: `${pt.x / 10}%` }}>
                    {pt.year}
                  </li>
                ))}
              </ol>
            </div>
            <figcaption>
              Projects finished, counted up by year: {pts.map((pt) => `${pt.year}, ${pt.cum}`).join("; ")}. Years are approximate.
            </figcaption>
          </figure>

          <div className="l-batch" aria-live="polite">
            <div className="l-batch-head">
              <p className="l-batch-year">
                <span className="l-roll">
                  <AnimatePresence initial={false}>
                    <motion.span key={cur.year} initial={{ y: "100%" }} animate={{ y: "0%" }} exit={{ y: "-100%" }} transition={{ duration: 0.5, ease: EASE_L }}>
                      {cur.year}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </p>
              <p className="l-batch-count">
                {String(cur.cum).padStart(2, "0")}/{specs.length} <span>shipped</span>
              </p>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.ul key={cur.year} className="l-batch-list" initial="off" animate="on" exit="out">
                {batch.map((s, k) => (
                  <motion.li
                    key={s.slug}
                    variants={{
                      off: { opacity: 0, scaleX: 1.12, x: 30 },
                      on: { opacity: 1, scaleX: 1, x: 0, transition: { duration: 0.6, delay: k * 0.06, ease: EASE_L } },
                      out: { opacity: 0, x: -20, transition: { duration: 0.2 } },
                    }}
                  >
                    <a href={s.link} target="_blank" rel="noreferrer" className="l-spec" data-cursor="Visit">
                      <span className="l-spec-img">
                        {/* eslint-disable-next-line @next/next/no-img-element -- the intro preloads this optimiser URL. */}
                        <img src={opt(s.image, 384)} alt={`Screenshot of ${s.title}`} loading="lazy" decoding="async" />
                      </span>
                      <span className="l-spec-text">
                        <span className="l-spec-title">{s.title}</span>
                        <span className="l-spec-meta">
                          {s.sectorLabel} · {s.years}
                        </span>
                      </span>
                      <span className="l-spec-go" aria-hidden="true">
                        ↗
                      </span>
                      <span className="sr-only">Visit live site (opens in a new tab)</span>
                    </a>
                  </motion.li>
                ))}
              </motion.ul>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
