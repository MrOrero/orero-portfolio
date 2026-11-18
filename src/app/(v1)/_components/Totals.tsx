"use client";

import { animate, motion, useInView } from "motion/react";
import { useReduced } from "@/lib/motion";
import { useEffect, useRef } from "react";
import type { Person } from "@/content";
import { EASE_R } from "./ease";

type Stat = Person["stats"][number];

const fmt = (s: Stat, v: number) => `${s.prefix ?? ""}${Math.round(v).toLocaleString("en-US")}${s.suffix ?? ""}`;

/** The figure counts up like a till, writing text directly so React never re-renders per frame. */
function Figure({ stat, go, delay }: { stat: Stat; go: boolean; delay: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReduced();
  useEffect(() => {
    const el = ref.current;
    if (!el || !go || reduce) return;
    const c = animate(0, stat.value, {
      duration: 1.3,
      delay,
      ease: EASE_R,
      onUpdate: (v) => {
        el.textContent = fmt(stat, v);
      },
    });
    return () => c.stop();
  }, [go, stat, delay, reduce]);
  // Server and no-JS render the final figure; the count starts from zero only once in view.
  return (
    <span ref={ref} className="r-total-fig">
      {fmt(stat, stat.value)}
    </span>
  );
}

/**
 * The four figures from the work, printed as subtotals on the dark underside of
 * the counter. Each line prints in, then its figure runs up.
 */
export function Totals({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const go = useInView(ref, { once: true, amount: 0.35 });
  return (
    <section className="r-totals" aria-labelledby="totals-h">
      <div className="r-wrap">
        <h2 id="totals-h" className="r-label">
          Subtotals
        </h2>
        <div ref={ref} className="r-total-list">
          {stats.map((s, i) => (
            <motion.div
              key={s.id}
              className="r-total"
              initial={{ clipPath: "inset(0 0 100% 0)" }}
              animate={go ? { clipPath: "inset(0 0 0% 0)" } : undefined}
              transition={{ duration: 0.5, delay: i * 0.18, ease: EASE_R }}
            >
              <p className="r-total-label">
                <span>{String(i + 1).padStart(2, "0")}</span>
                {s.label}
              </p>
              <span className="r-total-dots" aria-hidden="true" />
              <Figure stat={s} go={go} delay={0.2 + i * 0.18} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
