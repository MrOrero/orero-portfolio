"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useReduced } from "@/lib/motion";
import { useRef } from "react";
import { useSiteReady } from "@/lib/intro";
import { EASE_F } from "./ease";
import { Holo } from "./Holo";

function Word({ text, delay, className }: { text: string; delay: number; className?: string }) {
  const ready = useSiteReady();
  return (
    <span className={className} aria-hidden="true">
      {[...text].map((ch, i) => (
        <span key={i} className="f-mask">
          <motion.span
            className="f-letter"
            initial={{ y: "105%" }}
            animate={ready ? { y: "0%" } : undefined}
            transition={{ duration: 1.2, delay: delay + i * 0.05, ease: EASE_F }}
          >
            {ch}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

const nav = [
  { label: "Work", href: "#deal" },
  { label: "Deck", href: "#deck" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export function Hero({
  first,
  last,
  role,
  line,
  span,
  count,
}: {
  first: string;
  last: string;
  role: string;
  line: string;
  span: string;
  count: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const ready = useSiteReady();
  const reduce = useReduced();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const leftX = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-18%"]);
  const rightX = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "18%"]);
  const cardY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "38%"]);
  const cardTilt = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 38]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const fadeIn = (d: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: ready ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 1, delay: d, ease: EASE_F },
  });

  return (
    <header ref={ref} className="f-hero">
      <div className="f-wrap f-hero-bar">
        <motion.p {...fadeIn(0.6)}>{role}</motion.p>
        <motion.nav aria-label="Sections" {...fadeIn(0.7)}>
          <ul>
            {nav.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="f-link">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </motion.nav>
      </div>

      <h1 className="f-hero-name">
        <span className="sr-only">
          {first} {last}
        </span>
        <motion.span className="f-hero-l" style={{ x: leftX, opacity: fade }}>
          <Word text={first} delay={0.05} />
        </motion.span>
        <motion.span className="f-hero-r" style={{ x: rightX, opacity: fade }}>
          <Word text={last} delay={0.25} />
        </motion.span>
      </h1>

      <motion.div className="f-hero-card" style={{ y: cardY, rotateX: cardTilt }}>
        <motion.div
          initial={{ rotateY: -160, scale: 0.6, opacity: 0 }}
          animate={ready ? { rotateY: 0, scale: 1, opacity: 1 } : undefined}
          transition={{ duration: 1.6, delay: 0.1, ease: EASE_F }}
          style={{ transformPerspective: 1400 }}
        >
          <Holo idle max={16} className="f-hero-holo">
            <div className="f-card f-id">
              <div className="f-id-top">
                <span className="f-chip" aria-hidden="true" />
                <span className="f-id-issuer">Software, end to end</span>
              </div>
              <p className="f-id-name" aria-hidden="true">
                {first}
                <br />
                {last}
              </p>
              <div className="f-id-foot">
                <span>
                  <small>Valid</small>
                  {span}
                </span>
                <span>
                  <small>Cards</small>
                  {String(count).padStart(2, "0")}
                </span>
                <span className="f-id-seal" aria-hidden="true" />
              </div>
            </div>
          </Holo>
        </motion.div>
      </motion.div>

      <div className="f-wrap f-hero-foot">
        <motion.p className="f-hero-line" {...fadeIn(1.1)}>
          {line}
        </motion.p>
        <motion.p className="f-hero-hint" aria-hidden="true" {...fadeIn(1.3)}>
          <span className="f-only-fine">Tilt the card</span>
          <span className="f-only-touch">Press and drag the card</span>
          <span>Scroll to deal ↓</span>
        </motion.p>
      </div>
    </header>
  );
}
