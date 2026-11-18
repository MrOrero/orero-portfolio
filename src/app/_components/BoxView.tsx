"use client";

import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { opt, optSet } from "@/lib/intro-key";
import type { Cargo } from "./Box";
import { EASE_S } from "./ease";
import { Magnetic } from "./Magnetic";
import { lockScroll, unlockScroll } from "./scroll";
import { Arrow } from "./Arrow";

/**
 * A container brought to the front of the quay. It flies in from wherever it
 * was (shared layout), then its doors swing open on the work inside.
 */
export function BoxView({ c, layoutId, onClose }: { c: Cargo; layoutId?: string; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    close.current?.focus({ preventScroll: true });
    lockScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !box.current) return;
      const f = box.current.querySelectorAll<HTMLElement>("a[href], button");
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      unlockScroll();
      window.removeEventListener("keydown", onKey);
      opener?.focus({ preventScroll: true });
    };
  }, [onClose]);

  const rise = (d: number) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, transition: { duration: 0.15 } },
    transition: { duration: 0.8, delay: d, ease: EASE_S },
  });
  const door = (side: "l" | "r") => ({
    initial: { rotateY: 0 },
    animate: { rotateY: side === "l" ? -112 : 112 },
    exit: { rotateY: 0, transition: { duration: 0.3 } },
    transition: { duration: 1.3, delay: side === "l" ? 0.55 : 0.68, ease: EASE_S },
  });

  return (
    <motion.div
      className="s-view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35, delay: 0.15 } }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={box} role="dialog" aria-modal="true" aria-labelledby="s-view-title" className="s-view-box">
        <motion.div layoutId={layoutId} className="s-view-hold" data-sector={c.sector} style={{ "--cap": `${c.size[0]}px` } as CSSProperties} transition={{ duration: 0.8, ease: EASE_S }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- optimiser URL, decoded on open. */}
          <img src={opt(c.image, 1200)} srcSet={optSet(c.image, c.size[0])} sizes="(min-width: 800px) 680px, 100vw" alt={`Screenshot of ${c.title}`} draggable={false} />
          <motion.span className="s-view-door s-view-door-l" aria-hidden="true" {...door("l")}>
            <span>{c.code}</span>
          </motion.span>
          <motion.span className="s-view-door s-view-door-r" aria-hidden="true" {...door("r")}>
            <span>{c.sectorCode}</span>
          </motion.span>
        </motion.div>
        <div className="s-view-body">
          <motion.p className="s-kicker" {...rise(0.3)}>
            {c.code} · {c.sectorLabel}
          </motion.p>
          <motion.h2 id="s-view-title" className="s-view-title" {...rise(0.38)}>
            {c.title}
          </motion.h2>
          <motion.p className="s-view-desc" {...rise(0.46)}>
            {c.description}
          </motion.p>
          <motion.dl className="s-dl" {...rise(0.54)}>
            <div>
              <dt>Consignee</dt>
              <dd>{c.client}</dd>
            </div>
            {c.impact && (
              <div>
                <dt>Declared</dt>
                <dd>{c.impact}</dd>
              </div>
            )}
          </motion.dl>
          <motion.div className="s-view-actions" {...rise(0.62)}>
            {c.link && (
              <Magnetic href={c.link} external className="s-btn s-btn-orange" cursor="Visit">
                Visit live site<Arrow />
              </Magnetic>
            )}
            <button ref={close} type="button" className="s-btn" onClick={onClose} data-cursor="Close">
              Close
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
