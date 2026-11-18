"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useState } from "react";
import { opt } from "@/lib/intro-key";
import type { Cargo } from "./Box";
import { EASE_S } from "./ease";
import { Words } from "./Words";

/**
 * The manifest: every container on one sheet, with its live link. Plain rows,
 * readable by anything. On a fine pointer the hovered row's work hangs beside
 * the cursor.
 */
export function Manifest({ cargo }: { cargo: Cargo[] }) {
  const [hover, setHover] = useState<Cargo | null>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 26 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 26 });

  return (
    <section id="manifest" className="s-manifest" aria-labelledby="s-manifest-title">
      <div className="s-wrap">
        <p className="s-kicker">03 · The manifest</p>
        <Words id="s-manifest-title" className="s-h2" text="The full manifest." />
        <ol
          className="s-rows"
          onPointerMove={(e) => {
            if (e.pointerType !== "mouse") return;
            x.set(e.clientX);
            y.set(e.clientY);
          }}
          onPointerLeave={() => setHover(null)}
        >
          {cargo.map((c, i) => (
            <motion.li
              key={c.slug}
              className="s-row"
              data-sector={c.sector}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -8% 0px" }}
              transition={{ duration: 0.7, delay: (i % 6) * 0.04, ease: EASE_S }}
              onPointerEnter={(e) => e.pointerType === "mouse" && setHover(c)}
            >
              <a href={c.link} target="_blank" rel="noreferrer" data-cursor="Visit">
                <span className="s-row-code">{c.code}</span>
                <span className="s-row-title">{c.title}</span>
                <span className="s-row-desc">{c.description}</span>
                <span className="s-row-meta">
                  <span className="s-row-swatch" aria-hidden="true" />
                  {c.sectorLabel} · {c.years}
                </span>
                <span className="s-row-go" aria-hidden="true">
                  ↗
                </span>
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </motion.li>
          ))}
        </ol>
      </div>
      <motion.div className="s-peek" aria-hidden="true" style={{ x, y }}>
        {cargo.map((c) => (
          <motion.span
            key={c.slug}
            className="s-peek-img"
            initial={false}
            animate={{ opacity: hover?.slug === c.slug ? 1 : 0, scale: hover?.slug === c.slug ? 1 : 0.9 }}
            transition={{ duration: 0.35, ease: EASE_S }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- same optimiser URL the intro preloaded. */}
            <img src={opt(c.image, 384)} alt="" loading="lazy" decoding="async" />
          </motion.span>
        ))}
      </motion.div>
    </section>
  );
}
