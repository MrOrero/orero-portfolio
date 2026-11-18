"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useReduced } from "@/lib/motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useOnScreen } from "@/lib/intro";
import { Box, type Cargo } from "./Box";
import { BoxView } from "./BoxView";
import { EASE_S } from "./ease";
import { Words } from "./Words";

export type HullStat = { id: string; label: string; text: string; year: number };
type Bay = { year: number; cols: Cargo[][]; stats: HullStat[] };

const HIGH = 3;

/**
 * The voyage. One long ship sails past while the page is pinned: a bay for each
 * year, oldest at the bow, containers stacked three high, and the figures that
 * belong to that year's work stencilled on the hull below them.
 */
export function Voyage({ cargo, stats }: { cargo: Cargo[]; stats: HullStat[] }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const ship = useRef<HTMLDivElement>(null);
  const reduce = useReduced();
  const [travel, setTravel] = useState(0);
  const [bay, setBay] = useState(0);
  const [open, setOpen] = useState<Cargo | null>(null);
  const close = useCallback(() => setOpen(null), []);

  const years = [...new Set(cargo.map((c) => c.end))].sort((a, b) => a - b);
  const bays: Bay[] = years.map((year) => {
    const items = cargo.filter((c) => c.end === year).reverse();
    const cols: Cargo[][] = [];
    for (let i = 0; i < items.length; i += HIGH) cols.push(items.slice(i, i + HIGH));
    return { year, cols, stats: stats.filter((s) => s.year === year) };
  });

  // Measured at rest: the track's own width does not change with its transform.
  useEffect(() => {
    const measure = () => {
      const t = track.current;
      if (!t) return;
      setTravel(Math.max(0, t.scrollWidth - window.innerWidth));
    };
    const id = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useOnScreen(ship, (on) => {
    if (ship.current) ship.current.dataset.run = on ? "1" : "";
  });

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, (p) => -p * travel);
  
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const i = Math.min(bays.length - 1, Math.floor(p * bays.length * 1.02));
    setBay((b) => (b === i ? b : i));
  });

  return (
    <section id="voyage" ref={section} className="s-voyage" aria-labelledby="s-voyage-title" style={{ height: reduce ? undefined : `calc(100svh + ${travel}px)` }}>
      <div className="s-voyage-pin">
        <div className="s-wrap s-voyage-head">
          <p className="s-kicker">01 · The voyage</p>
          <p className="s-voyage-now" aria-hidden="true">
            Bay{" "}
            <span className="s-roll">
              <AnimatePresence initial={false}>
                <motion.span key={bays[bay].year} initial={{ y: "-110%" }} animate={{ y: "0%" }} exit={{ y: "110%" }} transition={{ duration: 0.35, ease: EASE_S }}>
                  {bays[bay].year}
                </motion.span>
              </AnimatePresence>
            </span>
          </p>
        </div>

        <motion.div ref={track} className="s-track" style={{ x: reduce ? 0 : x }}>
          <div className="s-bow">
            <Words id="s-voyage-title" className="s-h2" text="Every job I shipped, loaded by the year it left port." />
            <p className="s-lede">
              {cargo.length} containers, oldest at the bow. Open any one to see the work and visit it live. Years are approximate.
            </p>
          </div>

          <div ref={ship} className="s-ship">
            {bays.map((b) => (
              <div key={b.year} className="s-bay">
                <ol className="s-bay-stack" aria-label={`Shipped ${b.year}`}>
                  {b.cols.map((col, ci) => (
                    <li key={ci} className="s-bay-col">
                      <ul>
                        {col.map((c) => {
                          return (
                            <li key={c.slug}>
                              <button
                                type="button"
                                className="s-box-btn"
                                data-cursor="Open"
                                aria-label={`${c.title}, ${c.sectorLabel}, ${c.years}. Open`}
                                onClick={() => setOpen(c)}
                              >
                                <motion.div layoutId={`voy-${c.slug}`} transition={{ duration: 0.8, ease: EASE_S }}>
                                  <Box c={c} />
                                </motion.div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  ))}
                </ol>
                <div className="s-hull">
                  <p className="s-hull-year" aria-hidden="true">
                    {b.year}
                  </p>
                  {b.stats.map((s) => (
                    <motion.div key={s.id} className="s-hull-stat" initial="off" whileInView="on" viewport={{ once: true, amount: 0.3 }}>
                      <motion.p
                        variants={{ off: { clipPath: "inset(0 100% 0 0)" }, on: { clipPath: "inset(0 0% 0 0)" } }}
                        transition={{ duration: 1.1, ease: EASE_S }}
                      >
                        <strong>{s.text}</strong>
                        <span>{s.label}</span>
                      </motion.p>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
            <div className="s-stern" aria-hidden="true">
              <span>ORERO</span>
              <span>OZORE</span>
            </div>
          </div>
        </motion.div>

        <div className="s-wrap s-voyage-foot" aria-hidden="true">
          <span>Bow</span>
          <span className="s-log">
            <motion.span style={{ scaleX: scrollYProgress }} />
          </span>
          <span>Stern</span>
        </div>
      </div>
      <AnimatePresence>{open && <BoxView key={open.slug} c={open} layoutId={`voy-${open.slug}`} onClose={close} />}</AnimatePresence>
    </section>
  );
}
