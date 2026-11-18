"use client";

import { motion } from "motion/react";
import { useReduced } from "@/lib/motion";
import { useState } from "react";
import { EASE_F } from "./ease";
import { Holo } from "./Holo";
import { Magnetic } from "./Magnetic";

type Link = { label: string; href: string };

/** The last card: a business card. Turn it over for the details. */
export function Contact({ name, role, email, links }: { name: string; role: string; email: string; links: Link[] }) {
  const [flipped, setFlipped] = useState(false);
  const reduce = useReduced();
  const others = links.filter((l) => !l.href.startsWith("mailto:"));
  return (
    <section id="contact" className="f-contact" aria-labelledby="contact-h">
      <div className="f-wrap">
        <p className="f-kicker">Contact</p>
        <h2 id="contact-h" className="f-contact-big">
          Deal me in.
        </h2>
        <div className="f-contact-grid">
          <button
            type="button"
            className="f-biz"
            onClick={() => setFlipped((f) => !f)}
            aria-pressed={flipped}
            aria-label={flipped ? "Turn the business card back over" : "Turn the business card over"}
            data-cursor="Flip"
          >
            <Holo max={12}>
              <motion.div
                className="f-flip"
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={reduce ? { duration: 0 } : { duration: 1, ease: EASE_F }}
              >
                <div className="f-side f-side-front">
                  <div className="f-card f-biz-front">
                    <span className="f-chip" aria-hidden="true" />
                    <p className="f-biz-name">{name}</p>
                    <p className="f-biz-role">{role}</p>
                  </div>
                </div>
                <div className="f-side f-side-back">
                  <div className="f-card f-biz-back">
                    <p>{email}</p>
                    {others.map((l) => (
                      <p key={l.href}>{l.label}</p>
                    ))}
                  </div>
                </div>
              </motion.div>
            </Holo>
          </button>
          <div className="f-contact-actions">
            <Magnetic href={`mailto:${email}`} className="f-btn f-btn-pearl f-btn-big" cursor="Write">
              {email}
            </Magnetic>
            <ul className="f-contact-links">
              {others.map((l) => (
                <li key={l.href}>
                  <Magnetic href={l.href} external className="f-btn" cursor="Open">
                    {l.label} ↗
                  </Magnetic>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="f-foot">
          <span>© {name}</span>
          <span>Every card on this page is real work.</span>
        </p>
      </div>
    </section>
  );
}
