"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { opt } from "@/lib/intro-key";
import { EASE_L } from "./ease";

/** The engineer on the certificate: the bio sentence by sentence, the portrait in a calibrated frame. */
export function About({ name, role, bio, portrait, stack, sectors }: { name: string; role: string; bio: string; portrait: string; stack: string[]; sectors: string[] }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const lift = useTransform(scrollYProgress, [0, 1], ["7%", "-7%"]);
  const scan = useTransform(scrollYProgress, [0.15, 0.6], ["0%", "100%"]);
  const sentences = bio.split(/(?<=\.)\s+(?=[A-Z])/);

  return (
    <section ref={ref} id="about" className="l-about" aria-labelledby="l-about-title">
      <div className="l-wrap l-about-grid">
        <figure className="l-about-fig">
          <div className="l-about-frame">
            <motion.div className="l-about-img" style={{ y: lift }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- the intro preloads this optimiser URL. */}
              <img src={opt(portrait, 828)} alt={`Portrait of ${name}`} loading="lazy" decoding="async" />
            </motion.div>
            <motion.span className="l-about-scan" style={{ y: scan }} aria-hidden="true" />
            <span className="l-about-cross" aria-hidden="true" />
          </div>
          <figcaption>
            Certified · {name} · {role}
          </figcaption>
        </figure>
        <div>
          <p className="l-kicker">05 · Certificate</p>
          <h2 id="l-about-title" className="l-h2">
            {name}
          </h2>
          <div className="l-bio">
            {sentences.map((s, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 24, clipPath: "inset(0 0 100% 0)" }}
                whileInView={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }}
                viewport={{ once: true, margin: "0px 0px -12% 0px" }}
                transition={{ duration: 0.9, ease: EASE_L }}
              >
                {s}
              </motion.p>
            ))}
          </div>
          <dl className="l-about-dl">
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
      </div>
    </section>
  );
}
