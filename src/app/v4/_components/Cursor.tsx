"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";

/**
 * A measuring crosshair. It sits exactly on the pointer, a ring trails it
 * slightly, and a mono readout gives the position, or the label of whatever
 * [data-cursor] target is underneath.
 */
export function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 500, damping: 40 });
  const ry = useSpring(y, { stiffness: 500, damping: 40 });
  const [on, setOn] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const readout = useRef<HTMLSpanElement>(null);

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
    root.dataset.lCursor = "";
    let px = -100;
    let py = -100;
    let frame = 0;
    const read = (el: Element | null) => setLabel(el?.closest<HTMLElement>("[data-cursor]")?.dataset.cursor ?? null);
    const move = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      x.set(px);
      y.set(py);
      if (readout.current) readout.current.textContent = `x ${String(Math.round(px)).padStart(4, "0")}  y ${String(Math.round(py)).padStart(4, "0")}`;
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
      delete root.dataset.lCursor;
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", onScroll);
    };
  }, [on, x, y]);

  if (!on) return null;
  return (
    <div aria-hidden="true" className="l-cursor">
      <motion.span className="l-cursor-cross" style={{ x, y }} />
      <motion.span className="l-cursor-ring" style={{ x: rx, y: ry }} data-on={label ? "" : undefined} />
      <motion.span className="l-cursor-read" style={{ x: rx, y: ry }}>
        <span ref={readout} hidden={!!label} />
        {label && <strong>{label}</strong>}
      </motion.span>
    </div>
  );
}
