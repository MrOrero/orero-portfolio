"use client";

import { motion } from "motion/react";
import { useReduced } from "@/lib/motion";
import { useEffect, useRef } from "react";
import { useSiteReady } from "@/lib/intro";
import { EASE_L } from "./ease";

const nav = [
  { label: "Results", href: "#results" },
  { label: "Pull test", href: "#pull" },
  { label: "Specimens", href: "#specimens" },
  { label: "Contact", href: "#contact" },
];

/**
 * The name as a chain under cyclic load. A tension wave runs through the
 * letters forever: each one stretches and relaxes a beat after its neighbour,
 * and goes yellow with strain at the peak. The pointer adds load where it
 * hovers. The loop stops off screen and does not run with reduced motion.
 */
export function Hero({ first, last, role, line }: { first: string; last: string; role: string; line: string }) {
  const ref = useRef<HTMLElement>(null);
  const letters = useRef<(HTMLSpanElement | null)[]>([]);
  const cycles = useRef<HTMLSpanElement>(null);
  const ready = useSiteReady();
  const reduce = useReduced();
  const words = [first, last];

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce || !ready) return;
    let frame = 0;
    let running = false;
    let t0 = performance.now();
    let mx = -1;
    let my = -1;
    // Letter centres, measured at rest (the transforms below never move layout).
    let centres: { x: number; y: number }[] = [];
    const measure = () => {
      centres = letters.current.map((l) => {
        if (!l) return { x: 0, y: 0 };
        const r = l.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + scrollY + r.height / 2 };
      });
    };
    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      letters.current.forEach((l, i) => {
        if (!l) return;
        const wave = Math.max(0, Math.sin(t * 2.1 - i * 0.55));
        const c = centres[i];
        const d = mx < 0 || !c ? 1 : Math.min(1, Math.hypot(mx - c.x, my - c.y) / 260);
        const load = Math.min(1, wave * 0.55 + (1 - d) * 0.85);
        l.style.transform = `scaleY(${(1 + load * 0.22).toFixed(3)}) scaleX(${(1 - load * 0.06).toFixed(3)})`;
        l.style.setProperty("--strain", load.toFixed(3));
      });
      if (cycles.current) cycles.current.textContent = String(Math.floor((t * 2.1) / (Math.PI * 2))).padStart(6, "0");
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running) return;
      running = true;
      measure();
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
    io.observe(el);
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX;
      my = e.clientY + scrollY;
    };
    const leave = () => {
      mx = -1;
    };
    const resize = () => measure();
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    window.addEventListener("resize", resize);
    t0 = performance.now();
    return () => {
      stop();
      io.disconnect();
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      window.removeEventListener("resize", resize);
    };
  }, [ready, reduce]);

  const rise = (d: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: ready ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 0.9, delay: d, ease: EASE_L },
  });

  return (
    <header ref={ref} className="l-hero">
      <div className="l-wrap l-hero-bar">
        <motion.p {...rise(0.5)}>{role}</motion.p>
        <motion.nav aria-label="Sections" {...rise(0.6)}>
          <ul>
            {nav.map((n) => (
              <li key={n.href}>
                <a href={n.href} data-cursor="Go">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </motion.nav>
      </div>

      <h1 className="l-wrap l-chain" aria-label={`${first} ${last}, ${role}`}>
        {words.map((w, wi) => (
          <span key={w} className="l-chain-word" aria-hidden="true">
            {[...w].map((ch, i) => {
              const idx = (wi ? words[0].length : 0) + i;
              return (
                <motion.span
                  key={i}
                  className="l-link"
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={ready ? { scaleY: 1, opacity: 1 } : undefined}
                  transition={{ duration: 0.9, delay: 0.05 * idx + wi * 0.1, ease: EASE_L }}
                >
                  <span
                    className="l-letter"
                    ref={(n) => {
                      letters.current[idx] = n;
                    }}
                  >
                    <span className="l-letter-base">{ch}</span>
                    <span className="l-letter-hot">{ch}</span>
                  </span>
                </motion.span>
              );
            })}
          </span>
        ))}
      </h1>

      <div className="l-wrap l-hero-foot">
        <motion.p className="l-hero-line" {...rise(0.9)}>
          {line}
        </motion.p>
        <motion.p className="l-hero-meter" aria-hidden="true" {...rise(1)}>
          <span>Cyclic load</span>
          <span ref={cycles}>000000</span>
          <span>cycles, no failure</span>
        </motion.p>
      </div>
    </header>
  );
}
