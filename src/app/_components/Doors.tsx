"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

/**
 * A scrubbed transition between sections: you scroll up to the closed end of a
 * container, the lock bars turn, and the doors swing open onto what is next.
 * Hidden in CSS when motion is reduced.
 */
export function Doors({ code, label, tone = "navy" }: { code: string; label: string; tone?: "navy" | "orange" }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const bar = useTransform(scrollYProgress, [0.1, 0.3], [0, 90]);
  const left = useTransform(scrollYProgress, [0.3, 0.85], [0, -115]);
  const right = useTransform(scrollYProgress, [0.32, 0.87], [0, 115]);
  const inside = useTransform(scrollYProgress, [0.45, 0.85], [0.6, 1]);
  const fade = useTransform(scrollYProgress, [0.45, 0.8], [0, 1]);

  return (
    <div ref={ref} className="s-doors" data-tone={tone} aria-hidden="true">
      <div className="s-doors-pin">
        <motion.p className="s-doors-inside" style={{ scale: inside, opacity: fade }}>
          {label}
        </motion.p>
        <motion.div className="s-doors-leaf s-doors-l" style={{ rotateY: left }}>
          <motion.span className="s-doors-bar" style={{ rotate: bar }} />
          <motion.span className="s-doors-bar" style={{ rotate: bar }} />
          <span className="s-doors-code">{code}</span>
        </motion.div>
        <motion.div className="s-doors-leaf s-doors-r" style={{ rotateY: right }}>
          <motion.span className="s-doors-bar" style={{ rotate: bar }} />
          <motion.span className="s-doors-bar" style={{ rotate: bar }} />
          <span className="s-doors-code">{label}</span>
        </motion.div>
      </div>
    </div>
  );
}
