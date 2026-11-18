"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useReduced } from "@/lib/motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { sectors } from "@/content";
import { useOnScreen } from "@/lib/intro";
import { Box, type Cargo } from "./Box";
import { BoxView } from "./BoxView";
import { EASE_S } from "./ease";
import { Words } from "./Words";

type Mode = "year" | "sector";
/** One bay of the ship: `name` is stencilled on its hull and shown in the head. */
type Bay = { key: string; name: string; cols: Cargo[][] };

const HIGH = 3;

const stack = (items: Cargo[]) => {
  const cols: Cargo[][] = [];
  for (let i = 0; i < items.length; i += HIGH) cols.push(items.slice(i, i + HIGH));
  return cols;
};

function load(mode: Mode, cargo: Cargo[]): Bay[] {
  // Cargo arrives newest first; reversed so the oldest sits at the bottom of every stack.
  if (mode === "year") {
    const years = [...new Set(cargo.map((c) => c.end))].sort((a, b) => a - b);
    return years.map((year) => ({
      key: `y${year}`,
      name: String(year),
      cols: stack(cargo.filter((c) => c.end === year).reverse()),
    }));
  }
  return sectors
    .map((s) => ({
      key: s.id,
      name: s.label,
      cols: stack(cargo.filter((c) => c.sector === s.id).reverse()),
    }))
    .filter((b) => b.cols.length > 0);
}

const COPY: Record<Mode, { title: string; lede: (n: number, bays: number) => string }> = {
  year: {
    title: "The same cargo, restowed by the year it left port.",
    lede: (n) => `${n} containers, oldest at the bow. Open any one to see the work and visit it live.`,
  },
  sector: {
    title: "Every job I shipped, loaded by the trade it serves.",
    lede: (n, bays) => `${n} containers across ${bays} sectors. Open any one to see the work and visit it live.`,
  },
};

/**
 * The voyage. One long ship sails past while the page is pinned, with a bay for each
 * sector (or each year), containers stacked three high, and the bay named on the hull
 * below them. The switch in the head unloads the ship and restows it the other way.
 */
export function Voyage({ cargo }: { cargo: Cargo[] }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const ship = useRef<HTMLDivElement>(null);
  const keep = useRef<number | null>(null);
  const reduce = useReduced();
  const [mode, setMode] = useState<Mode>("sector");
  const [travel, setTravel] = useState(0);
  const [bay, setBay] = useState(0);
  const [open, setOpen] = useState<Cargo | null>(null);
  const close = useCallback(() => setOpen(null), []);

  const bays = load(mode, cargo);
  const now = bays[Math.min(bay, bays.length - 1)];

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

  // The two loadings make ships of different lengths. Hold the reader at the same
  // fraction of the voyage once the new one has been measured, so the page does not jump.
  useLayoutEffect(() => {
    const p = keep.current;
    const s = section.current;
    if (p === null || !s || reduce) return;
    // Wait for the new loading to be on board; the old one may still be lifting off.
    if (!track.current?.querySelector(`.s-cargo[data-mode="${mode}"]`)) return;
    keep.current = null;
    const top = s.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + p * travel, behavior: "instant" });
  }, [travel, reduce, mode]);

  const pick = (m: Mode) => {
    if (m === mode) return;
    const s = section.current;
    const r = s?.getBoundingClientRect();
    // Only re-anchor while the ship is pinned; above or below it there is nothing to hold.
    if (r && r.top <= 0 && r.bottom >= window.innerHeight) keep.current = scrollYProgress.get();
    setMode(m);
  };

  const copy = COPY[mode];

  return (
    <section id="voyage" ref={section} className="s-voyage" aria-labelledby="s-voyage-title" style={{ height: reduce ? undefined : `calc(100svh + ${travel}px)` }}>
      <div className="s-voyage-pin">
        <div className="s-wrap s-voyage-head">
          <p className="s-kicker">01 · The voyage</p>
          <div className="s-sort" role="group" aria-label="Load the ship by">
            {(["sector", "year"] as const).map((m) => (
              <button key={m} type="button" aria-pressed={mode === m} onClick={() => pick(m)} data-cursor={mode === m ? undefined : "Restow"}>
                By {m}
              </button>
            ))}
            <motion.span className="s-sort-pill" aria-hidden="true" animate={{ x: mode === "sector" ? "0%" : "100%" }} transition={{ duration: 0.42, ease: EASE_S }} />
          </div>
          <p className="s-voyage-now" aria-hidden="true">
            Bay{" "}
            <span className="s-roll">
              <AnimatePresence initial={false}>
                <motion.span key={now.key} initial={{ y: "-110%" }} animate={{ y: "0%" }} exit={{ y: "110%" }} transition={{ duration: 0.35, ease: EASE_S }}>
                  {now.name}
                </motion.span>
              </AnimatePresence>
            </span>
          </p>
        </div>

        <motion.div ref={track} className="s-track" style={{ x: reduce ? 0 : x }}>
          <div className="s-bow">
            <Words key={mode} id="s-voyage-title" className="s-h2" text={copy.title} />
            <p className="s-lede" aria-live="polite">
              {copy.lede(cargo.length, bays.length)}
            </p>
          </div>

          <div ref={ship} className="s-ship">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mode}
                className="s-cargo"
                data-mode={mode}
                initial="off"
                animate="on"
                exit="gone"
                variants={{
                  on: { transition: { staggerChildren: reduce ? 0 : 0.025 } },
                  gone: { transition: { staggerChildren: reduce ? 0 : 0.012, staggerDirection: -1 } },
                }}
              >
                {bays.map((b) => (
                  <div key={b.key} className="s-bay">
                    <ol className="s-bay-stack" aria-label={mode === "year" ? `Shipped ${b.name}` : `${b.name} work`}>
                      {b.cols.map((col, ci) => (
                        <li key={ci} className="s-bay-col">
                          <ul>
                            {col.map((c) => (
                              <motion.li
                                key={c.slug}
                                variants={{
                                  off: { y: -90, opacity: 0 },
                                  on: { y: 0, opacity: 1, transition: { duration: reduce ? 0 : 0.55, ease: EASE_S } },
                                  gone: { y: -120, opacity: 0, transition: { duration: reduce ? 0 : 0.32, ease: [0.5, 0, 0.75, 0] } },
                                }}
                              >
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
                              </motion.li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ol>
                    <div className="s-hull">
                      <p className={mode === "sector" ? "s-hull-year s-hull-word" : "s-hull-year"} aria-hidden="true">
                        {b.name}
                      </p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
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
