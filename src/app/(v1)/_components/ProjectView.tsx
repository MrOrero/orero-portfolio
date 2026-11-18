"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { opt } from "@/lib/intro";
import { EASE_R } from "./ease";
import { Magnetic } from "./Magnetic";
import type { RunItem } from "./types";

/**
 * One project reprinted in colour, full size. The picture flies in from wherever
 * it was clicked (shared layout), the details print in under it.
 */
export function ProjectView({
  item,
  layoutId,
  total,
  onClose,
}: {
  item: RunItem;
  layoutId: string;
  total: number;
  onClose: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    close.current?.focus({ preventScroll: true });
    const root = document.documentElement;
    root.style.overflow = "hidden";
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
      root.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      opener?.focus({ preventScroll: true });
    };
  }, [onClose]);

  const line = (d: number) => ({
    initial: { clipPath: "inset(0 0 100% 0)" },
    animate: { clipPath: "inset(0 0 0% 0)" },
    exit: { opacity: 0, transition: { duration: 0.15 } },
    transition: { duration: 0.4, delay: d, ease: EASE_R },
  });

  return (
    <motion.div
      className="r-view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.1 } }}
      transition={{ duration: 0.3 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={box} role="dialog" aria-modal="true" aria-labelledby="r-view-title" className="r-view-box">
        <motion.div layoutId={layoutId} className="r-view-shot" transition={{ duration: 0.7, ease: EASE_R }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- preloaded optimiser URL. */}
          <img src={opt(item.image, 1200)} alt={`Screenshot of ${item.title}`} draggable={false} />
        </motion.div>
        <div className="r-view-body">
          <motion.p className="r-view-n" {...line(0.35)}>
            Item {item.n} of {String(total).padStart(2, "0")} · {item.years}
          </motion.p>
          <motion.h2 id="r-view-title" className="r-view-title" {...line(0.42)}>
            {item.title}
          </motion.h2>
          <motion.p className="r-view-desc" {...line(0.5)}>
            {item.description}
          </motion.p>
          <motion.dl className="r-lines" {...line(0.58)}>
            <div>
              <dt>Client</dt>
              <dd>{item.client}</dd>
            </div>
            <div>
              <dt>Sector</dt>
              <dd>{item.sectorLabel}</dd>
            </div>
            {item.impact && (
              <div>
                <dt>Impact</dt>
                <dd>{item.impact}</dd>
              </div>
            )}
          </motion.dl>
          <motion.div className="r-view-actions" {...line(0.66)}>
            <Magnetic href={item.link} external className="r-key r-key-ink" cursor="Visit">
              Visit live site ↗
            </Magnetic>
            <button ref={close} type="button" className="r-key" onClick={onClose} data-cursor="Close">
              Close
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
