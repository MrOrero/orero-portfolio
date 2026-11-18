"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { MotionConfig } from "motion/react";
import { useEffect } from "react";
import type { Cargo } from "./Box";
import { Cursor } from "./Cursor";
import { Intro } from "./Intro";
import { setLenis } from "./scroll";

/** Client wrapper: reduced motion, smooth scroll (off when motion is reduced), intro, cursor. */
export function Shell({ cargo, urls, name, children }: { cargo: Cargo[]; urls: string[]; name: string; children: React.ReactNode }) {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.1 });
    setLenis(lenis);
    return () => {
      setLenis(null);
      lenis.destroy();
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <Intro cargo={cargo} urls={urls} name={name}>
        {children}
      </Intro>
      <Cursor />
    </MotionConfig>
  );
}
