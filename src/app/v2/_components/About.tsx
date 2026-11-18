"use client";

import { motion, useInView } from "motion/react";
import { useReduced } from "@/lib/motion";
import { Fragment, useRef } from "react";
import { opt } from "@/lib/intro-key";
import { EASE_F } from "./ease";
import { Holo } from "./Holo";

/** Words rise out of a mask in a stagger once the paragraph is in view. */
function Rise({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const reduce = useReduced();
  const words = text.split(" ");
  return (
    <p ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((w, i) => (
          <Fragment key={i}>
          <span className="f-mask">
            <motion.span
              className="f-letter"
              initial={reduce ? false : { y: "110%" }}
              animate={inView ? { y: "0%" } : undefined}
              transition={{ duration: 0.9, delay: Math.min(1.6, i * 0.018), ease: EASE_F }}
            >
              {w}
            </motion.span>
          </span>{" "}
          </Fragment>
        ))}
      </span>
    </p>
  );
}

export function About({
  name,
  role,
  bio,
  portrait,
  stack,
  sectors,
}: {
  name: string;
  role: string;
  bio: string;
  portrait: string;
  stack: string[];
  sectors: string[];
}) {
  return (
    <section id="about" className="f-about" aria-labelledby="about-h">
      <div className="f-wrap f-about-grid">
        <div className="f-about-card">
          <Holo max={14} idle>
            <div className="f-card f-idv">
              <div className="f-idv-photo">
                {/* eslint-disable-next-line @next/next/no-img-element -- preloaded optimiser URL. */}
                <img src={opt(portrait, 828)} alt={`Portrait of ${name}, arms folded, in a maroon shirt.`} draggable={false} />
              </div>
              <div className="f-idv-body">
                <p className="f-idv-name">{name}</p>
                <p className="f-idv-role">{role}</p>
                <p className="f-idv-row">
                  <span>Co-founder</span>
                  <span>Yadsale</span>
                </p>
              </div>
            </div>
          </Holo>
        </div>
        <div className="f-about-text">
          <h2 id="about-h" className="f-h2">
            The cardholder
          </h2>
          <Rise text={bio} className="f-about-bio" />
          <div className="f-about-lists">
            <div>
              <h3 className="f-kicker">Stack</h3>
              <ul className="f-pills">
                {stack.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="f-kicker">Sectors</h3>
              <ul className="f-pills">
                {sectors.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
