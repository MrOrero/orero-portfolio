"use client";

import { AnimatePresence, motion } from "motion/react";
import { useReduced } from "@/lib/motion";
import { useEffect, useState } from "react";
import { markIntroSeen, preload, ReadyProvider, useIntroSeen } from "@/lib/intro";
import { EASE_L } from "./ease";
import { CURVE } from "./curve";

const STEP = 140;
const MAX_WAIT = 6500;
const HOLD = 900;
const REVEAL = 650;

/**
 * The intro is a tensile test. Each picture that loads adds load to the
 * specimen and draws more of the force curve; when every one is in, the
 * machine reads PASS and the screen pulls apart into the hero. Once per tab.
 */
export function Intro({ urls, titles, name, children }: { urls: string[]; titles: string[]; name: string; children: React.ReactNode }) {
  const skip = useIntroSeen("v4");
  const reduce = useReduced();
  const [phase, setPhase] = useState<"loading" | "pass" | "leaving" | "gone">("loading");
  const [revealed, setRevealed] = useState(false);
  const [count, setCount] = useState(0);
  const total = titles.length;

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
      markIntroSeen("v4");
      setCount(total);
      setPhase("pass");
      setTimeout(() => {
        if (cancelled) return;
        setPhase("leaving");
        setTimeout(() => setRevealed(true), REVEAL);
      }, HOLD);
    };
    const timer = setTimeout(() => (timedOut = true), MAX_WAIT);
    // The picture list holds every project image first, in title order.
    const tick = setInterval(() => {
      if (cancelled) return;
      if (next < total && done.has(next)) {
        next += 1;
        setCount(next);
      }
      if (next >= total || timedOut) finish();
    }, STEP);
    return () => {
      cancelled = true;
      clearInterval(tick);
      clearTimeout(timer);
    };
  }, [skip, urls, total]);

  const covering = !skip && phase !== "gone";
  useEffect(() => {
    if (!covering) return;
    const root = document.documentElement;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = "";
    };
  }, [covering]);

  const p = total ? count / total : 0;
  const latest = count ? titles[count - 1] : null;
  const pass = phase === "pass";

  const face = (
    <>
      <div className="l-intro-top">
        <span>{name}</span>
        <span>Tensile test · specimen set of {total}</span>
      </div>
      <div className="l-intro-plot">
        <svg viewBox="0 0 1000 500" preserveAspectRatio="none" className="l-intro-svg">
          <path d={CURVE} className="l-intro-ghost" vectorEffect="non-scaling-stroke" />
          <path
            d={CURVE}
            className="l-intro-line"
            vectorEffect="non-scaling-stroke"
            style={{ clipPath: `inset(0 ${(100 - p * 100).toFixed(1)}% 0 0)`, transition: "clip-path 0.3s cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <span className="l-intro-axis-y">Load</span>
        <span className="l-intro-axis-x">Extension</span>
      </div>
      <div className="l-intro-foot">
        <div className="l-intro-now">
          <span>{pass ? "Result" : "Loading"}</span>
          <span className="l-roll">
            <AnimatePresence initial={false}>
              <motion.span key={pass ? "pass" : (latest ?? "none")} initial={{ y: "-110%" }} animate={{ y: "0%" }} exit={{ y: "110%" }} transition={{ duration: 0.3, ease: EASE_L }}>
                {pass ? "Holds under load" : (latest ?? "Calibrating")}
              </motion.span>
            </AnimatePresence>
          </span>
        </div>
        <p className="l-intro-count" data-pass={pass ? "" : undefined}>
          {pass ? "PASS · " : ""}
          {String(count).padStart(2, "0")}
          <span>/{String(total).padStart(2, "0")}</span>
        </p>
      </div>
    </>
  );

  return (
    <ReadyProvider value={skip || revealed}>
      {children}
      <AnimatePresence onExitComplete={() => setPhase("gone")}>
        {!skip && (phase === "loading" || phase === "pass") && (
          <motion.div key="intro" role="status" className="l-intro" initial={false} exit={{ opacity: reduce ? 0 : 1, transition: { duration: reduce ? 0.4 : 1 } }}>
            <span className="sr-only">
              {pass ? `Loaded, ${total} of ${total}` : `Loading work, ${count} of ${total}`}
            </span>
            {/* Two clipped copies of the same face, so it can tear down the middle. */}
            <motion.div
              className="l-intro-half l-intro-half-a"
              aria-hidden="true"
              exit={reduce ? undefined : { y: "-52%", transition: { duration: 0.95, ease: [0.7, 0, 0.25, 1] } }}
            >
              {face}
            </motion.div>
            <motion.div
              className="l-intro-half l-intro-half-b"
              aria-hidden="true"
              exit={reduce ? undefined : { y: "52%", transition: { duration: 0.95, ease: [0.7, 0, 0.25, 1] } }}
            >
              {face}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ReadyProvider>
  );
}
