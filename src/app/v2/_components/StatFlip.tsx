"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useReduced } from "@/lib/motion";
import { useRef, useState } from "react";
import type { Person } from "@/content";
import { Holo } from "./Holo";

type Stat = Person["stats"][number];
const fig = (s: Stat) => `${s.prefix ?? ""}${s.value.toLocaleString("en-US")}${s.suffix ?? ""}`;

function StatFace({ s, i, total }: { s: Stat; i: number; total: number }) {
  return (
    <div className="f-card f-stat">
      <p className="f-stat-top">
        <span className="f-chip" aria-hidden="true" />
        <span>
          {String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </p>
      <p className="f-stat-fig">{fig(s)}</p>
      <p className="f-stat-label">{s.label}</p>
    </div>
  );
}

/**
 * Four figures on one card. The scene pins and scroll turns the card over three
 * times; each half turn shows the next figure. Content only ever changes on the
 * face turned away from you.
 */
export function StatFlip({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReduced();
  const turns = stats.length - 1;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // Hold a beat on each figure: ease the turn between plateaus.
  const angle = useTransform(scrollYProgress, (p) => {
    const t = Math.min(turns, Math.max(0, p * (turns + 0.4) - 0.2));
    const k = Math.floor(t);
    const f = t - k;
    const eased = f < 0.25 ? 0 : f > 0.75 ? 1 : (1 - Math.cos(((f - 0.25) / 0.5) * Math.PI)) / 2;
    return (k + eased) * 180;
  });
  const [n, setN] = useState(0);
  useMotionValueEvent(angle, "change", (a) => {
    const k = Math.floor((a + 90) / 180);
    setN((c) => (c === k ? c : k));
  });
  // Front shows even figures, back shows odd ones; each is the nearest to n.
  const front = n % 2 === 0 ? n : Math.min(turns, n + 1);
  const back = n % 2 === 1 ? n : Math.min(turns, n + 1);

  if (reduce) {
    return (
      <section className="f-stats is-static" aria-labelledby="stats-h">
        <div className="f-wrap">
          <h2 id="stats-h" className="f-h2">
            In figures
          </h2>
          <ul className="f-stats-grid">
            {stats.map((s, i) => (
              <li key={s.id}>
                <StatFace s={s} i={i} total={stats.length} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="f-stats" aria-labelledby="stats-h" style={{ height: `${100 + turns * 70}svh` }}>
      <div className="f-stats-stage">
        <div className="f-wrap f-stats-head">
          <h2 id="stats-h" className="f-h2">
            In figures
          </h2>
          <ol className="f-stats-dots" aria-hidden="true">
            {stats.map((s, i) => (
              <li key={s.id} data-on={i === n || undefined}>
                {String(i + 1).padStart(2, "0")}
              </li>
            ))}
          </ol>
        </div>
        {/* Screen readers get all four at once. */}
        <ul className="sr-only">
          {stats.map((s) => (
            <li key={s.id}>
              {fig(s)}: {s.label}
            </li>
          ))}
        </ul>
        <div className="f-stats-card" aria-hidden="true">
          <Holo max={10}>
            <motion.div className="f-flip f-stats-flip" style={{ rotateY: angle }}>
              <div className="f-side f-side-front">
                <StatFace s={stats[front]} i={front} total={stats.length} />
              </div>
              <div className="f-side f-side-back">
                <StatFace s={stats[back]} i={back} total={stats.length} />
              </div>
            </motion.div>
          </Holo>
        </div>
      </div>
    </section>
  );
}
