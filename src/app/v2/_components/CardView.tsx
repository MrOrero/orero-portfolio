"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { opt } from "@/lib/intro-key";
import type { DeckItem } from "./Card";
import { EASE_F } from "./ease";
import { Holo } from "./Holo";
import { Magnetic } from "./Magnetic";
import { lockScroll, unlockScroll } from "./scroll";

/**
 * A card lifted out of the deck and held up close. The art flies from wherever
 * the card was (shared layout); the engraved details rise in beside it.
 */
export function CardView({ item, layoutId, onClose }: { item: DeckItem; layoutId: string; onClose: () => void }) {
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
    transition: { duration: 0.8, delay: d, ease: EASE_F },
  });

  return (
    <motion.div
      className="f-view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35, delay: 0.15 } }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={box} role="dialog" aria-modal="true" aria-labelledby="f-view-title" className="f-view-box">
        <motion.div layoutId={layoutId} className="f-view-card" transition={{ duration: 0.85, ease: EASE_F }}>
          <Holo max={10}>
            <div className="f-card f-view-art">
              {/* eslint-disable-next-line @next/next/no-img-element -- optimiser URL, decoded on open. */}
              <img src={opt(item.image, 1200)} alt={`Screenshot of ${item.title}`} draggable={false} />
            </div>
          </Holo>
        </motion.div>
        <div className="f-view-body">
          <motion.p className="f-kicker" {...rise(0.3)}>
            No. {item.n} · {item.sectorLabel} · {item.years}
          </motion.p>
          <motion.h2 id="f-view-title" className="f-view-title" {...rise(0.38)}>
            {item.title}
          </motion.h2>
          <motion.p className="f-view-desc" {...rise(0.46)}>
            {item.description}
          </motion.p>
          <motion.dl className="f-dl" {...rise(0.54)}>
            <div>
              <dt>Client</dt>
              <dd>{item.client}</dd>
            </div>
            {item.impact && (
              <div>
                <dt>Impact</dt>
                <dd>{item.impact}</dd>
              </div>
            )}
          </motion.dl>
          <motion.div className="f-view-actions" {...rise(0.62)}>
            <Magnetic href={item.link} external className="f-btn f-btn-pearl" cursor="Visit">
              Visit live site ↗
            </Magnetic>
            <button ref={close} type="button" className="f-btn" onClick={onClose} data-cursor="Close">
              Close
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
