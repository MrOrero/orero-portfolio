"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { MotionConfig } from "motion/react";
import { useEffect } from "react";
import { Cursor } from "./Cursor";
import { Intro } from "./Intro";
import { setLenis } from "./scroll";

/** Client wrapper: reduced motion, smooth scroll (off when motion is reduced), intro, cursor. */
export function Shell({ urls, titles, name, children }: { urls: string[]; titles: string[]; name: string; children: React.ReactNode }) {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.12 });
    setLenis(lenis);
    return () => {
      setLenis(null);
      lenis.destroy();
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <Intro urls={urls} titles={titles} name={name}>
        {children}
      </Intro>
      <Cursor />
    </MotionConfig>
  );
}
