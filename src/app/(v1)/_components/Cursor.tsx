"use client";

import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";
import { EASE_R } from "./ease";

/**
 * A heat point for fine pointers: thermal paper darkens where it is warm. Over a
 * [data-cursor] target it pulls a little ticket out of itself with the label.
 */
export function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 900, damping: 50, mass: 0.3 });
  const sy = useSpring(y, { stiffness: 900, damping: 50, mass: 0.3 });
  const [label, setLabel] = useState<string | null>(null);
  const [on, setOn] = useState(false);
  const [down, setDown] = useState(false);

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
    root.dataset.rCursor = "";
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
    // Content scrolls under a still pointer: re-read what is beneath it, once per frame.
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        read(document.elementFromPoint(px, py));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const dn = () => setDown(true);
    const up = () => setDown(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerdown", dn);
    window.addEventListener("pointerup", up);
    return () => {
      delete root.dataset.rCursor;
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", dn);
      window.removeEventListener("pointerup", up);
    };
  }, [on, x, y]);

  if (!on) return null;
  return (
    <motion.div aria-hidden="true" className="r-cursor" style={{ x: sx, y: sy }}>
      <motion.span className="r-cursor-dot" animate={{ scale: down ? 2.2 : label ? 0.6 : 1 }} transition={{ duration: 0.25, ease: EASE_R }} />
      <AnimatePresence>
        {label && (
          <motion.span
            key={label}
            className="r-cursor-ticket"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.28, ease: EASE_R }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
