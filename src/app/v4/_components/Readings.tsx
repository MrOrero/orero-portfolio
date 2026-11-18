"use client";

import { animate, useInView } from "motion/react";
import { useReduced } from "@/lib/motion";
import { useEffect, useRef } from "react";
import { EASE_L } from "./ease";
import { Words } from "./Words";

type Stat = { id: string; label: string; value: number; prefix?: string; suffix?: string };

/** One dial per stated figure. The needle swings up to the reading as it comes into view and the number counts with it. */
function Dial({ s, i }: { s: Stat; i: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReduced();
  const fmt = (v: number) => `${s.prefix ?? ""}${Math.round(v).toLocaleString("en-US")}${s.suffix ?? ""}`;
  // Each dial's full scale sits a little past its reading, so every needle lands near the top of its range.
  const angle = 52;

  useEffect(() => {
    if (!inView || !num.current) return;
    if (reduce) {
      num.current.textContent = fmt(s.value);
      return;
    }
    const c = animate(0, s.value, {
      duration: 1.6,
      delay: i * 0.12,
      ease: EASE_L,
      onUpdate: (v) => {
        if (num.current) num.current.textContent = fmt(v);
      },
    });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once when the dial enters view.
  }, [inView]);

  return (
    <li ref={ref} className="l-dial">
      <svg viewBox="0 0 200 120" aria-hidden="true">
        <path d="M20 110 A80 80 0 0 1 180 110" className="l-gauge-arc" />
        {Array.from({ length: 21 }, (_, k) => {
          const a = Math.PI * (1 - k / 20);
          const r = k % 5 ? 74 : 68;
          return <line key={k} x1={+(100 + Math.cos(a) * r).toFixed(2)} y1={+(110 - Math.sin(a) * r).toFixed(2)} x2={+(100 + Math.cos(a) * 80).toFixed(2)} y2={+(110 - Math.sin(a) * 80).toFixed(2)} className="l-gauge-tick" />;
        })}
        <g className="l-gauge-needle l-dial-needle" style={{ transform: `rotate(${inView ? angle : -90}deg)`, transitionDelay: `${i * 0.12}s` }}>
          <line x1="100" y1="110" x2="100" y2="36" />
          <circle cx="100" cy="110" r="6" />
        </g>
      </svg>
      <p className="l-dial-num">
        <span ref={num} aria-hidden="true">{fmt(0)}</span>
        <span className="sr-only">{fmt(s.value)}</span>
      </p>
      <p className="l-dial-label">{s.label}</p>
    </li>
  );
}

export function Readings({ stats }: { stats: Stat[] }) {
  return (
    <section id="readings" className="l-readings" aria-labelledby="l-readings-title">
      <div className="l-wrap">
        <p className="l-kicker">03 · Readings</p>
        <Words id="l-readings-title" className="l-h2" text="What the work carries." />
        <ul className="l-dials">
          {stats.map((s, i) => (
            <Dial key={s.id} s={s} i={i} />
          ))}
        </ul>
      </div>
    </section>
  );
}
