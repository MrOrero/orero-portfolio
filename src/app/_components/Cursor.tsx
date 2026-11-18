"use client";

import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, useVelocity } from "motion/react";
import { useEffect, useState } from "react";
import { EASE_S } from "./ease";

/**
 * A crane hook on a short cable. It trails the pointer with weight and swings
 * with its speed. Over a [data-cursor] target a stencilled tag hangs off it; while
 * a container is held (html[data-s-holding]) the hook closes.
 */
export function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 380, damping: 30, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 380, damping: 30, mass: 0.6 });
  const swing = useTransform(useVelocity(sx), [-2400, 0, 2400], [28, 0, -28], { clamp: true });
  const rot = useSpring(swing, { stiffness: 120, damping: 8 });
  const [label, setLabel] = useState<string | null>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const mq = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const sync = () => setOn(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!on) return;
    const root = document.documentElement;
    root.dataset.sCursor = "";
    let px = -100;
    let py = -100;
    let frame = 0;
    const read = (el: Element | null) => setLabel(el?.closest<HTMLElement>("[data-cursor]")?.dataset.cursor ?? null);
    const move = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      x.set(px);
      y.set(py);
      read(e.target as Element | null);
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        read(document.elementFromPoint(px, py));
      });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      delete root.dataset.sCursor;
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", onScroll);
    };
  }, [on, x, y]);

  if (!on) return null;
  return (
    <motion.div aria-hidden="true" className="s-cursor" style={{ x: sx, y: sy }}>
      <motion.div className="s-cursor-rig" style={{ rotate: rot }}>
        <span className="s-cursor-cable" />
        <svg className="s-cursor-hook" viewBox="0 0 24 32" width="22" height="30">
          <path d="M12 0v9" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="12" cy="11" r="3" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <path className="s-hook-jaw" d="M12 14v8a5 5 0 1 1-8-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <AnimatePresence>
          {label && (
            <motion.span
              key={label}
              className="s-cursor-tag"
              initial={{ scaleY: 0, rotate: -8 }}
              animate={{ scaleY: 1, rotate: 0 }}
              exit={{ scaleY: 0 }}
              transition={{ duration: 0.4, ease: EASE_S }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
