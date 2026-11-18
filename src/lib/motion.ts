"use client";
import { useSyncExternalStore } from "react";

const RM = "(prefers-reduced-motion: reduce)";
const subscribeRM = (cb: () => void) => {
  const mq = window.matchMedia(RM);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/**
 * Reduced-motion preference that is safe to render with: the server and the
 * hydration pass both read false, then the real value arrives in a re-render.
 * (motion's useReducedMotion reads the media query during hydration, which
 * makes server and client markup disagree for people who ask for less motion.)
 */
export function useReduced() {
  return useSyncExternalStore(subscribeRM, () => window.matchMedia(RM).matches, () => false);
}
