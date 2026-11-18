"use client";

import { AnimatePresence, motion, useSpring, useTransform } from "motion/react";
import { useReduced } from "@/lib/motion";
import { useEffect, useState } from "react";
import { markIntroSeen, preload, ReadyProvider, useIntroSeen } from "@/lib/intro";
import { EASE_F } from "./ease";
import { ROSETTE_PATHS } from "./Guilloche";

const STEP = 130;
const MAX_WAIT = 6500;
const HOLD = 500;
const REVEAL = 650;

/** A wedge from 12 o'clock to `deg`, as a clip-path polygon over a square box. */
function wedge(deg: number) {
  if (deg >= 359.9) return "polygon(-50% -50%, 150% -50%, 150% 150%, -50% 150%)";
  const pts = ["50% 50%", "50% -50%"];
  for (let a = 0; a <= deg; a += 10) {
    const r = ((a - 90) * Math.PI) / 180;
    pts.push(`${(50 + Math.cos(r) * 110).toFixed(2)}% ${(50 + Math.sin(r) * 110).toFixed(2)}%`);
  }
  const r = ((deg - 90) * Math.PI) / 180;
  pts.push(`${(50 + Math.cos(r) * 110).toFixed(2)}% ${(50 + Math.sin(r) * 110).toFixed(2)}%`);
  return `polygon(${pts.join(", ")})`;
}

/**
 * The intro engraves a guilloche rosette, the security pattern behind every card
 * on this page. Each card's art is fetched and decoded; each one advances the
 * engraving and the card number. Then the counter irises shut on the centre, where
 * the hero card is waiting. Runs once per tab.
 */
export function Intro({ urls, titles, name, children }: { urls: string[]; titles: string[]; name: string; children: React.ReactNode }) {
  const skip = useIntroSeen("v2");
  const reduce = useReduced();
  const [phase, setPhase] = useState<"loading" | "leaving" | "gone">("loading");
  const [revealed, setRevealed] = useState(false);
  const [count, setCount] = useState(0);
  const total = titles.length;
  const progress = useSpring(0, { stiffness: 70, damping: 20 });
  const clip = useTransform(progress, (v) => wedge(v * 360));

  useEffect(() => {
    if (skip) return;
    let cancelled = false;
    let timedOut = false;
    let next = 0;
    const done = new Set<number>();
    preload(urls, (i) => done.add(i));
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearInterval(tick);
      clearTimeout(timer);
      progress.set(1);
      markIntroSeen("v2");
      setTimeout(() => {
        if (cancelled) return;
        setPhase("leaving");
        setTimeout(() => setRevealed(true), REVEAL);
      }, HOLD);
    };
    const timer = setTimeout(() => (timedOut = true), MAX_WAIT);
    const tick = setInterval(() => {
      if (cancelled) return;
      if (next < total && done.has(next)) {
        next += 1;
        setCount(next);
        progress.set(next / total);
      }
      if (next >= total || timedOut) finish();
    }, STEP);
    return () => {
      cancelled = true;
      clearInterval(tick);
      clearTimeout(timer);
    };
  }, [skip, urls, total, progress]);

  const covering = !skip && phase !== "gone";
  useEffect(() => {
    if (!covering) return;
    const root = document.documentElement;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = "";
    };
  }, [covering]);

  const digits = String(count).padStart(16, "0").replace(/(\d{4})(?=\d)/g, "$1 ");
  const title = count ? titles[count - 1] : "";

  return (
    <ReadyProvider value={skip || revealed}>
      {children}
      <AnimatePresence onExitComplete={() => setPhase("gone")}>
        {!skip && phase === "loading" && (
          <motion.div
            key="intro"
            role="status"
            className="f-intro"
            initial={false}
            exit={
              reduce
                ? { opacity: 0, transition: { duration: 0.4 } }
                : { clipPath: "circle(0% at 50% 50%)", transition: { duration: 1.1, ease: EASE_F } }
            }
            style={{ clipPath: "circle(150% at 50% 50%)" }}
          >
            <span className="sr-only">
              Loading the cards, {count} of {total}
            </span>
            <div className="f-intro-top" aria-hidden="true">
              <span>{name}</span>
              <span>Issuing {String(total).padStart(2, "0")} cards</span>
            </div>
            <motion.div className="f-intro-rosette" aria-hidden="true" exit={{ scale: 0.4, rotate: 40, opacity: 0, transition: { duration: 0.9, ease: EASE_F } }}>
              <svg viewBox="0 0 240 240" className="f-intro-ghost">
                {ROSETTE_PATHS.map((d, i) => (
                  <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={0.4} />
                ))}
              </svg>
              <motion.svg viewBox="0 0 240 240" className="f-intro-engraved" style={{ clipPath: clip }}>
                {ROSETTE_PATHS.map((d, i) => (
                  <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={0.7} />
                ))}
              </motion.svg>
            </motion.div>
            <div className="f-intro-foot" aria-hidden="true">
              <div className="f-intro-now">
                <span>Now issuing</span>
                <div className="f-roll">
                  <AnimatePresence initial={false}>
                    <motion.span
                      key={title}
                      initial={{ y: "110%" }}
                      animate={{ y: "0%" }}
                      exit={{ y: "-110%" }}
                      transition={{ duration: 0.28, ease: EASE_F }}
                    >
                      {title || "Engraving"}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
              <p className="f-intro-number">{digits}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ReadyProvider>
  );
}
