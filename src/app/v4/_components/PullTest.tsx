"use client";

import { AnimatePresence, motion } from "motion/react";
import { useReduced } from "@/lib/motion";
import { useEffect, useRef, useState } from "react";
import { EASE_L } from "./ease";
import { Words } from "./Words";

/** Extension at full load, as a share of the specimen's resting width. */
const STRETCH = 0.5;
const HOLD_AT = 0.98;

/**
 * The pull test. The name is clamped in a test rig; drag the right-hand grip
 * (or focus it and use the arrow keys) to load it. Each letter is a mass on a
 * spring, so the name stretches like rubber, lags, and wobbles home when you
 * let go. Strain shows in yellow, the dial reads the load, and at the limit the
 * machine stamps the result.
 */
export function PullTest({ word }: { word: string }) {
  const rig = useRef<HTMLDivElement>(null);
  const spec = useRef<HTMLDivElement>(null);
  const grip = useRef<HTMLDivElement>(null);
  const needle = useRef<SVGGElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const letters = useRef<(HTMLSpanElement | null)[]>([]);
  const reduce = useReduced();
  const [held, setHeld] = useState(false);
  const [pct, setPct] = useState(0);
  const api = useRef<{ setLoad: (l: number, sticky: boolean) => void; release: () => void } | null>(null);
  const chars = [...word];

  useEffect(() => {
    const el = rig.current;
    const s = spec.current;
    const g = grip.current;
    if (!el || !s || !g) return;
    const n = chars.length;
    let width = 0;
    let load = 0; // what the operator applies, 0..1
    let target = 0; // where the load is heading when released
    let dragging = false;
    let sticky = false; // keyboard holds the load until released
    const pos = new Float32Array(n + 1); // letter centres' extension, last one is the grip
    const vel = new Float32Array(n + 1);
    let frame = 0;
    let visible = true;
    let last = performance.now();
    let lastPct = -1;
    let wasHeld = false;

    const measure = () => {
      width = s.offsetWidth;
    };
    measure();

    const paint = () => {
      const E = width * STRETCH;
      for (let i = 0; i < n; i++) {
        const l = letters.current[i];
        if (!l) continue;
        const ext = pos[i];
        const strain = Math.max(0, Math.min(1.2, (ext / Math.max(1, E)) * 1.1));
        l.style.transform = `translateX(${(ext * ((i + 0.5) / n)).toFixed(2)}px) scaleX(${(1 + (ext / Math.max(1, width)) * 0.9).toFixed(4)}) scaleY(${(1 - strain * 0.08).toFixed(4)})`;
        l.style.setProperty("--strain", Math.min(1, strain).toFixed(3));
      }
      g.style.transform = `translateX(${pos[n].toFixed(2)}px)`;
      const L = Math.max(0, Math.min(1, pos[n] / Math.max(1, E)));
      if (needle.current) needle.current.style.transform = `rotate(${(-90 + L * 180).toFixed(2)}deg)`;
      const p = Math.round(L * 100);
      if (p !== lastPct) {
        lastPct = p;
        if (readout.current) readout.current.textContent = String(p).padStart(3, "0");
        g.setAttribute("aria-valuenow", String(p));
        g.setAttribute("aria-valuetext", `${p} percent load${L >= HOLD_AT ? ", holds" : ""}`);
      }
      const h = L >= HOLD_AT;
      if (h !== wasHeld) {
        wasHeld = h;
        setHeld(h);
        setPct(p);
      }
    };

    const step = (dt: number) => {
      const E = width * STRETCH;
      const goal = (dragging || sticky ? load : target) * E;
      let moving = false;
      for (let i = n; i >= 0; i--) {
        // The grip follows the hand tightly; letters further from it lag more.
        const k = i === n ? 900 : 260 - (n - 1 - i) * 26;
        const c = i === n ? 60 : 9;
        const a = k * (goal - pos[i]) - c * vel[i];
        vel[i] += a * dt;
        pos[i] += vel[i] * dt;
        if (Math.abs(goal - pos[i]) > 0.3 || Math.abs(vel[i]) > 0.3) moving = true;
      }
      return moving;
    };

    const loop = (now: number) => {
      frame = 0;
      let dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      let moving = false;
      if (reduce) {
        const goal = (dragging || sticky ? load : target) * width * STRETCH;
        pos.fill(goal);
        vel.fill(0);
      } else {
        // Fixed sub-steps keep the springs stable on slow frames.
        while (dt > 0) {
          const h = Math.min(dt, 1 / 240);
          moving = step(h) || moving;
          dt -= h;
        }
      }
      paint();
      if (visible && (moving || dragging)) frame = requestAnimationFrame(loop);
    };
    const wake = () => {
      if (!frame && visible) {
        last = performance.now();
        frame = requestAnimationFrame(loop);
      }
    };

    let x0 = 0;
    let l0 = 0;
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      sticky = false;
      x0 = e.clientX;
      l0 = pos[n] / Math.max(1, width * STRETCH);
      load = l0;
      g.setPointerCapture(e.pointerId);
      g.dataset.drag = "";
      wake();
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const raw = l0 + (e.clientX - x0) / Math.max(1, width * STRETCH);
      // Past the limit the rig resists: load grows ever more slowly toward 1.
      load = raw <= 0.85 ? Math.max(0, raw) : 0.85 + 0.15 * (1 - Math.exp(-(raw - 0.85) / 0.15));
      wake();
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      target = 0;
      delete g.dataset.drag;
      wake();
    };
    g.addEventListener("pointerdown", down);
    g.addEventListener("pointermove", move);
    g.addEventListener("pointerup", up);
    g.addEventListener("pointercancel", up);

    api.current = {
      setLoad(l, keep) {
        load = Math.max(0, Math.min(1, l));
        sticky = keep;
        wake();
      },
      release() {
        sticky = false;
        target = 0;
        wake();
      },
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) wake();
      else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    io.observe(el);
    const resize = () => {
      measure();
      wake();
    };
    window.addEventListener("resize", resize);
    paint();

    return () => {
      api.current = null;
      cancelAnimationFrame(frame);
      io.disconnect();
      window.removeEventListener("resize", resize);
      g.removeEventListener("pointerdown", down);
      g.removeEventListener("pointermove", move);
      g.removeEventListener("pointerup", up);
      g.removeEventListener("pointercancel", up);
    };
  }, [chars.length, reduce]);

  const onKey = (e: React.KeyboardEvent) => {
    const now = Number(grip.current?.getAttribute("aria-valuenow") ?? 0) / 100;
    const map: Record<string, number> = { ArrowRight: now + 0.1, ArrowUp: now + 0.1, ArrowLeft: now - 0.1, ArrowDown: now - 0.1, PageUp: now + 0.25, PageDown: now - 0.25, Home: 0, End: 1 };
    if (e.key in map) {
      e.preventDefault();
      api.current?.setLoad(map[e.key], true);
    } else if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
      e.preventDefault();
      api.current?.release();
    }
  };

  return (
    <section id="pull" className="l-pull" aria-labelledby="l-pull-title">
      <div className="l-wrap l-pull-head">
        <p className="l-kicker">02 · Pull test</p>
        <Words id="l-pull-title" className="l-h2" text="Go on, try to break it." />
        <p className="l-lede">
          Drag the grip on the right. With a keyboard, focus the grip and use the arrow keys to add load, End for full load, Enter to let go.
        </p>
      </div>

      <div className="l-wrap l-pull-stage">
        <div ref={rig} className="l-rig">
          <span className="l-jaw l-jaw-l" aria-hidden="true" />
          <div ref={spec} className="l-specimen" aria-hidden="true">
            {chars.map((ch, i) => (
              <span
                key={i}
                className="l-letter"
                ref={(node) => {
                  letters.current[i] = node;
                }}
              >
                <span className="l-letter-base">{ch}</span>
                <span className="l-letter-hot">{ch}</span>
              </span>
            ))}
          </div>
          <div
            ref={grip}
            className="l-jaw l-jaw-r"
            role="slider"
            tabIndex={0}
            aria-label={`Load on the specimen “${word}”`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={0}
            data-cursor="Pull"
            onKeyDown={onKey}
          >
            <span className="l-grip-arrow" aria-hidden="true">
              ⟶
            </span>
          </div>
        </div>

        <div className="l-gauge" aria-hidden="true">
          <svg viewBox="0 0 200 120">
            <path d="M20 110 A80 80 0 0 1 180 110" className="l-gauge-arc" />
            <path d="M152 47 A80 80 0 0 1 180 110" className="l-gauge-red" />
            {Array.from({ length: 11 }, (_, i) => {
              const a = Math.PI * (1 - i / 10);
              return <line key={i} x1={+(100 + Math.cos(a) * 70).toFixed(2)} y1={+(110 - Math.sin(a) * 70).toFixed(2)} x2={+(100 + Math.cos(a) * 80).toFixed(2)} y2={+(110 - Math.sin(a) * 80).toFixed(2)} className="l-gauge-tick" />;
            })}
            <g ref={needle} className="l-gauge-needle">
              <line x1="100" y1="110" x2="100" y2="40" />
              <circle cx="100" cy="110" r="6" />
            </g>
          </svg>
          <p className="l-gauge-read">
            <span ref={readout}>000</span>% load
          </p>
        </div>

        <AnimatePresence>
          {held && (
            <motion.p
              key="holds"
              className="l-stamp"
              role="status"
              initial={{ opacity: 0, scale: 2.2, rotate: -14 }}
              animate={{ opacity: 1, scale: 1, rotate: -8 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ duration: 0.45, ease: EASE_L }}
            >
              Holds.
              <span className="sr-only"> Full load, {pct} percent, and nothing broke.</span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
