"use client";

import { motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { useReduced } from "@/lib/motion";
import { useEffect, useRef } from "react";
import { useSiteReady } from "@/lib/intro";
import { EASE_S } from "./ease";

const nav = [
  { label: "Voyage", href: "#voyage" },
  { label: "Yard", href: "#yard" },
  { label: "Manifest", href: "#manifest" },
  { label: "Contact", href: "#contact" },
];

/**
 * Standing at the doors of a container. The interior is five CSS planes in one
 * preserve-3d group; the doors swing open once the intro has lifted. A fine
 * pointer shifts the camera (the near walls slide more than the far one), and
 * scrolling walks you in toward the name stencilled on the back wall.
 */
export function Hero({ first, last, role, line, span }: { first: string; last: string; role: string; line: string; span: string }) {
  const ref = useRef<HTMLElement>(null);
  const ready = useSiteReady();
  const reduce = useReduced();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const cx = useSpring(px, { stiffness: 60, damping: 18 });
  const cy = useSpring(py, { stiffness: 60, damping: 18 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const dolly = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 1], { clamp: true });
  const z = useTransform(dolly, (d) => `calc(var(--s-depth) * ${(d * 0.62).toFixed(3)})`);
  const fade = useTransform(scrollYProgress, [0.55, 0.95], [1, 0]);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    let rect = el.getBoundingClientRect();
    const enter = () => (rect = el.getBoundingClientRect());
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      px.set(((e.clientX - rect.left) / rect.width - 0.5) * -60);
      py.set(((e.clientY - rect.top) / rect.height - 0.5) * -40);
    };
    const leave = () => {
      px.set(0);
      py.set(0);
    };
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [reduce, px, py]);

  const open = ready || !!reduce;
  const door = (side: "l" | "r") => ({
    initial: { rotateY: reduce ? (side === "l" ? -108 : 108) : 0 },
    animate: open ? { rotateY: side === "l" ? -108 : 108 } : undefined,
    transition: { duration: 1.8, delay: side === "l" ? 0.15 : 0.32, ease: EASE_S },
  });
  const rise = (d: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: ready ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 1, delay: d, ease: EASE_S },
  });

  return (
    <header ref={ref} className="s-hero">
      <h1 className="sr-only">
        {first} {last}, {role}
      </h1>
      <div className="s-tunnel-view" aria-hidden="true">
        <motion.div className="s-tunnel" style={{ x: cx, y: cy, z }}>
          <div className="s-plane s-wall-l" />
          <div className="s-plane s-wall-r" />
          <div className="s-plane s-ceil">
            <span className="s-light" />
          </div>
          <div className="s-plane s-floor" />
          <div className="s-plane s-back">
            <p className="s-back-name">
              <span>{first}</span>
              <span>{last}</span>
            </p>
            <p className="s-back-mark">
              SUPER SHIPPER · Handle with care · {span}
            </p>
          </div>
          <motion.div className="s-door s-door-l" {...door("l")}>
            <span className="s-door-text">{first}</span>
          </motion.div>
          <motion.div className="s-door s-door-r" {...door("r")}>
            <span className="s-door-text">{last}</span>
          </motion.div>
        </motion.div>
      </div>

      <motion.div className="s-wrap s-hero-bar" style={{ opacity: fade }}>
        <motion.p {...rise(0.9)}>{role}</motion.p>
        <motion.nav aria-label="Sections" {...rise(1)}>
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
      </motion.div>
      <motion.div className="s-wrap s-hero-foot" style={{ opacity: fade }}>
        <motion.p className="s-hero-line" {...rise(1.3)}>
          {line}
        </motion.p>
        <motion.p className="s-hero-hint" aria-hidden="true" {...rise(1.5)}>
          Scroll to walk in ↓
        </motion.p>
      </motion.div>
    </header>
  );
}
