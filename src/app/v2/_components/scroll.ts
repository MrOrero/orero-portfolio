"use client";

import type Lenis from "lenis";

/** The page's Lenis instance, so dialogs can hold the page still. */
let current: Lenis | null = null;
export const setLenis = (l: Lenis | null) => {
  current = l;
};

export function lockScroll() {
  current?.stop();
  document.documentElement.style.overflow = "hidden";
}
export function unlockScroll() {
  current?.start();
  document.documentElement.style.overflow = "";
}
