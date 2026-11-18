"use client";

import { AnimatePresence, motion, useMotionValue, useSpring, useVelocity, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { EASE_F } from "./ease";

/**
 * A small foil chip that leans into its own motion. Over a [data-cursor] target
 * it opens into a pill with the label.
 */
export function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 600, damping: 42, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 600, damping: 42, mass: 0.4 });
  const vx = useVelocity(sx);
  const lean = useTransform(vx, [-2000, 0, 2000], [-35, 0, 35], { clamp: true });
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
    root.dataset.fCursor = "";
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
      delete root.dataset.fCursor;
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", onScroll);
    };
  }, [on, x, y]);

  if (!on) return null;
  return (
    <motion.div aria-hidden="true" className="f-cursor" style={{ x: sx, y: sy }}>
      <motion.div
        className="f-cursor-chip"
        style={{ rotate: lean }}
        // A fixed 96×34 pill scaled down to an 18×12 chip: transform only, no layout.
        animate={{ scaleX: label ? 1 : 18 / 96, scaleY: label ? 1 : 12 / 34 }}
        transition={{ duration: 0.45, ease: EASE_F }}
      >
        <AnimatePresence>
          {label && (
            <motion.span key={label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
