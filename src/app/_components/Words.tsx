"use client";

import { motion } from "motion/react";
import { Fragment } from "react";
import { EASE_S } from "./ease";

/** A heading that rises word by word as it scrolls into view. */
export function Words({ text, className, as = "h2", id }: { text: string; className?: string; as?: "h2" | "p"; id?: string }) {
  const Tag = as === "h2" ? motion.h2 : motion.p;
  const words = text.split(" ");
  return (
    <Tag id={id} className={className} initial="off" whileInView="on" viewport={{ once: true, margin: "0px 0px -15% 0px" }} aria-label={text}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="s-word" aria-hidden="true">
            <motion.span
              variants={{ off: { y: "110%" }, on: { y: "0%" } }}
              transition={{ duration: 0.9, delay: i * 0.06, ease: EASE_S }}
            >
              {w}
            </motion.span>
          </span>
          {i < words.length - 1 && " "}
        </Fragment>
      ))}
    </Tag>
  );
}
