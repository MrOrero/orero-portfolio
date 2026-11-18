"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { useReduced } from "@/lib/motion";
import { EASE_L } from "./ease";
import { Magnetic } from "./Magnetic";

/**
 * The last word. The heading arrives slack and pulls taut as you scroll to it,
 * then "holds." lands in strain yellow.
 */
export function Contact({ name, email, links, span }: { name: string; email: string; links: { label: string; href: string }[]; span: string }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.25"] });
  const taut = useTransform(scrollYProgress, [0, 1], [1.5, 1]);
  const squash = useTransform(scrollYProgress, [0, 1], [0.7, 1]);
  const reduce = useReduced();
  const social = links.filter((l) => !l.href.startsWith("mailto:"));

  return (
    <section ref={ref} id="contact" className="l-contact" aria-labelledby="l-contact-title">
      <div className="l-wrap l-contact-inner">
        <p className="l-kicker">06 · Next test</p>
        <h2 id="l-contact-title" className="l-contact-title">
          <motion.span className="l-contact-line" style={{ scaleX: reduce ? 1 : taut, scaleY: reduce ? 1 : squash }}>
            Build something
          </motion.span>
          <motion.span
            className="l-contact-line l-contact-hot"
            initial={{ opacity: 0, scaleX: 1.6, scaleY: 0.6 }}
            whileInView={{ opacity: 1, scaleX: 1, scaleY: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, delay: 0.15, ease: EASE_L }}
          >
            that holds.
          </motion.span>
        </h2>
        <div className="l-contact-row">
          <Magnetic href={`mailto:${email}`} className="l-cta" cursor="Write">
            Write to me <span aria-hidden="true">→</span>
          </Magnetic>
          <div className="l-contact-links">
            <a href={`mailto:${email}`} data-cursor="Write">
              {email}
            </a>
            <ul>
              {social.map((l) => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noreferrer" data-cursor="Open">
                    {l.label} ↗<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <footer className="l-wrap l-foot">
        <span>
          {name} · {span}
        </span>
        <a href="#top" data-cursor="Up">
          Back to the top ↑
        </a>
      </footer>
    </section>
  );
}
