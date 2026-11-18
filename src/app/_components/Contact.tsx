"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { useReduced } from "@/lib/motion";
import { EASE_S } from "./ease";
import { Magnetic } from "./Magnetic";
import { Arrow } from "./Arrow";

const LINES = ["Let's ship", "the next one."];

/**
 * The last call. Safety orange floods up the screen as you arrive, then the
 * heading is craned in letter by letter, each one landing with a bounce.
 */
export function Contact({ name, email, links, span }: { name: string; email: string; links: { label: string; href: string }[]; span: string }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.2"] });
  const flood = useTransform(scrollYProgress, [0, 1], ["inset(100% 0 0 0)", "inset(0% 0 0 0)"]);
  const reduce = useReduced();
  const social = links.filter((l) => !l.href.startsWith("mailto:"));

  return (
    <section ref={ref} id="contact" className="s-contact" aria-labelledby="s-contact-title">
      <motion.div className="s-flood" style={{ clipPath: reduce ? "none" : flood }} aria-hidden="true" />
      <div className="s-wrap s-contact-inner">
        <p className="s-kicker">05 · Next sailing</p>
        <motion.h2
          id="s-contact-title"
          className="s-contact-title"
          aria-label={LINES.join(" ")}
          initial="off"
          whileInView="on"
          viewport={{ once: true, amount: 0.5 }}
        >
          {LINES.map((line, li) => (
            <span key={line} className="s-contact-line" aria-hidden="true">
              {[...line].map((ch, i) => {
                const k = (li ? LINES[0].length : 0) + i;
                return (
                  <motion.span
                    key={i}
                    className="s-letter"
                    variants={{ off: { y: "-120%", opacity: 0 }, on: { y: "0%", opacity: 1 } }}
                    transition={{ duration: 0.8, delay: 0.1 + k * 0.035, ease: EASE_S }}
                  >
                    {ch === " " ? " " : ch}
                  </motion.span>
                );
              })}
            </span>
          ))}
        </motion.h2>
        <div className="s-contact-row">
          <Magnetic href={`mailto:${email}`} className="s-disc" cursor="Write">
            <span>Write to me</span>
          </Magnetic>
          <div className="s-contact-links">
            <a href={`mailto:${email}`} className="s-contact-mail" data-cursor="Write">
              {email}
            </a>
            <ul>
              {social.map((l) => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noreferrer" data-cursor="Open">
                    {l.label}<Arrow /><span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <footer className="s-wrap s-foot">
        <span>
          {name} · {span}
        </span>
        <a href="#top" data-cursor="Up">
          Back to the quay ↑
        </a>
      </footer>
    </section>
  );
}
