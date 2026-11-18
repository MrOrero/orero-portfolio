"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useReduced } from "@/lib/motion";
import { useRef } from "react";

/** A button that leans toward the pointer, like a card being slid off a table. */
export function Magnetic({
  href,
  children,
  className,
  cursor = "Open",
  external,
  strength = 0.32,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  cursor?: string;
  external?: boolean;
  strength?: number;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduce = useReduced();
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 16 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 16 });
  return (
    <motion.a
      ref={ref}
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      data-cursor={cursor}
      className={className}
      style={{ x, y }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
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
