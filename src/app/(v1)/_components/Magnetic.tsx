"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useReduced } from "@/lib/motion";
import { useRef } from "react";

/** A key on the terminal: leans toward the pointer, and presses down when clicked. */
export function Magnetic({
  href,
  children,
  className,
  cursor = "Open",
  external,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  cursor?: string;
  external?: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduce = useReduced();
  const x = useSpring(useMotionValue(0), { stiffness: 260, damping: 18 });
  const y = useSpring(useMotionValue(0), { stiffness: 260, damping: 18 });
  return (
    <motion.a
      ref={ref}
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      data-cursor={cursor}
      className={className}
      style={{ x, y }}
      whileTap={reduce ? undefined : { scale: 0.94 }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * 0.3);
        y.set((e.clientY - (r.top + r.height / 2)) * 0.3);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.a>
  );
}
