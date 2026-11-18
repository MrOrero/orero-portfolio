"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { opt } from "@/lib/intro-key";
import { EASE_S } from "./ease";

/** The bill of lading: the bio, one sentence at a time, beside the man himself. */
export function About({ name, role, bio, portrait, stack, sectors }: { name: string; role: string; bio: string; portrait: string; stack: string[]; sectors: string[] }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const lift = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);
  const sentences = bio.split(/(?<=\.)\s+(?=[A-Z])/);

  return (
    <section ref={ref} id="about" className="s-about" aria-labelledby="s-about-title">
      <div className="s-wrap s-about-grid">
        <div className="s-about-copy">
          <p className="s-kicker">04 · Bill of lading</p>
          <h2 id="s-about-title" className="s-h2">
            {name}
            <span>{role}</span>
          </h2>
          <div className="s-bio">
            {sentences.map((s, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 28, clipPath: "inset(0 0 100% 0)" }}
                whileInView={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }}
                viewport={{ once: true, margin: "0px 0px -12% 0px" }}
                transition={{ duration: 1, ease: EASE_S }}
              >
                {s}
              </motion.p>
            ))}
          </div>
          <dl className="s-about-dl">
            <div>
              <dt>Stack</dt>
              <dd>{stack.join(" · ")}</dd>
            </div>
            <div>
              <dt>Sectors</dt>
              <dd>{sectors.join(" · ")}</dd>
            </div>
          </dl>
        </div>
        <figure className="s-about-fig">
          <div className="s-about-frame">
            <motion.div className="s-about-img" style={{ y: lift }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- the intro preloads this optimiser URL. */}
              <img src={opt(portrait, 828)} alt={`Portrait of ${name}`} loading="lazy" decoding="async" />
            </motion.div>
          </div>
          <figcaption>Consignor · {name}</figcaption>
        </figure>
      </div>
    </section>
  );
}
