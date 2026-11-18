"use client";

import { AnimatePresence, motion } from "motion/react";
import { useReduced } from "@/lib/motion";
import { useEffect, useState } from "react";
import { markIntroSeen, preload, ReadyProvider, useIntroSeen } from "@/lib/intro";
import { Box, type Cargo } from "./Box";
import { EASE_S } from "./ease";

const STEP = 160;
const MAX_WAIT = 6500;
const HOLD = 600;
const REVEAL = 700;
/** Rows from the bottom up; stacked straight, the way twistlocks hold them. */
const ROWS = [5, 5, 5, 4];

function slot(i: number) {
  let r = 0;
  let k = i;
  while (k >= ROWS[r]) {
    k -= ROWS[r];
    r += 1;
  }
  return { r, c: k - (ROWS[r] - 1) / 2 };
}

/**
 * The intro loads the ship. Every container's picture is fetched and decoded, and
 * each one drops onto the stack as it arrives: a fall, a squash on landing, a
 * settle. Then the crane hoists the whole stack away and the hero opens.
 * Runs once per tab.
 */
export function Intro({ cargo, urls, name, children }: { cargo: Cargo[]; urls: string[]; name: string; children: React.ReactNode }) {
  const skip = useIntroSeen("home");
  const reduce = useReduced();
  const [phase, setPhase] = useState<"loading" | "leaving" | "gone">("loading");
  const [revealed, setRevealed] = useState(false);
  const [count, setCount] = useState(0);
  const total = cargo.length;

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
      markIntroSeen("home");
      setCount(total);
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

  const latest = count ? cargo[count - 1] : null;

  return (
    <ReadyProvider value={skip || revealed}>
      {children}
      <AnimatePresence onExitComplete={() => setPhase("gone")}>
        {!skip && phase === "loading" && (
          <motion.div
            key="intro"
            role="status"
            className="s-intro"
            initial={false}
            exit={reduce ? { opacity: 0, transition: { duration: 0.4 } } : { y: "-100%", transition: { duration: 1.1, ease: [0.7, 0, 0.3, 1] } }}
          >
            <span className="sr-only">
              Loading containers, {count} of {total}
            </span>
            <div className="s-intro-top" aria-hidden="true">
              <span>{name}</span>
              <span>Manifest · {total} containers</span>
            </div>
            <div className="s-intro-stack" aria-hidden="true">
              {cargo.slice(0, count).map((c, i) => {
                const { r, c: col } = slot(i);
                return (
                  <div key={c.slug} className="s-intro-slot" style={{ "--r": r, "--c": col } as React.CSSProperties}>
                    <motion.div
                      className="s-intro-drop"
                      initial={reduce ? false : { y: "-110vh" }}
                      animate={{ y: ["-110vh", "0vh", "-0.6vh", "0vh"], scaleY: [1, 1, 0.86, 1] }}
                      transition={{ duration: 0.75, times: [0, 0.62, 0.8, 1], ease: ["easeIn", "easeOut", "easeOut"] }}
                    >
                      <Box c={c} />
                    </motion.div>
                  </div>
                );
              })}
            </div>
            <div className="s-intro-foot" aria-hidden="true">
              <div className="s-intro-now">
                <span>Loading</span>
                <div className="s-roll">
                  <AnimatePresence initial={false}>
                    <motion.span
                      key={latest?.slug ?? "none"}
                      initial={{ y: "-110%" }}
                      animate={{ y: "0%" }}
                      exit={{ y: "110%" }}
                      transition={{ duration: 0.3, ease: EASE_S }}
                    >
                      {latest?.title ?? "Quay 1"}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
              <p className="s-intro-count">
                {String(count).padStart(2, "0")}
                <span>/{String(total).padStart(2, "0")}</span>
              </p>
            </div>
            <div className="s-intro-quay" aria-hidden="true" />
          </motion.div>
        )}
      </AnimatePresence>
    </ReadyProvider>
  );
}
