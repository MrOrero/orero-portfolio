"use client";

import { motion } from "motion/react";
import { opt } from "@/lib/intro-key";
import { EASE_L } from "./ease";
import type { Spec } from "./types";
import { Words } from "./Words";

/**
 * Every specimen on one sheet. Rows stretch a little as they arrive, then
 * snap to rest; hovering one opens its picture under the row like a test window.
 */
export function Specimens({ specs }: { specs: Spec[] }) {
  return (
    <section id="specimens" className="l-specimens" aria-labelledby="l-specimens-title">
      <div className="l-wrap">
        <p className="l-kicker">04 · Specimens</p>
        <Words id="l-specimens-title" className="l-h2" text={`All ${specs.length}, tested in production.`} />
        <ol className="l-rows">
          {specs.map((s, i) => (
            <motion.li
              key={s.slug}
              className="l-row"
              initial={{ opacity: 0, scaleX: 1.06 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true, margin: "0px 0px -8% 0px" }}
              transition={{ duration: 0.8, delay: (i % 5) * 0.05, ease: EASE_L }}
            >
              <a href={s.link} target="_blank" rel="noreferrer" data-cursor="Visit">
                <span className="l-row-n">{s.n}</span>
                <span className="l-row-title">{s.title}</span>
                <span className="l-row-desc">{s.description}</span>
                <span className="l-row-meta">
                  {s.sectorCode} · {s.years}
                </span>
                <span className="l-row-win" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element -- the intro preloads this optimiser URL. */}
                  <img src={opt(s.image, 384)} alt="" loading="lazy" decoding="async" />
                </span>
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
