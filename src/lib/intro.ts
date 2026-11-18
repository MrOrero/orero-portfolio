"use client";

import { createContext, useContext, useEffect, useRef, useSyncExternalStore } from "react";

/**
 * Intro plumbing: the once-per-tab gate, image preloading and the "site ready"
 * signal. The loader itself is drawn by _components/Intro.
 */

import { introAttr, introKey } from "./intro-key";

export function markIntroSeen(v: string) {
  try {
    sessionStorage.setItem(introKey(v), "1");
  } catch {
    // Private mode or blocked storage: the intro simply plays again next time.
  }
}

const noSubscribe = () => () => {};
/** Whether the inline script marked this tab as having seen the intro. */
export function useIntroSeen(v: string) {
  return useSyncExternalStore(
    noSubscribe,
    () => document.documentElement.hasAttribute(introAttr(v)),
    () => false,
  );
}

const Ready = createContext(true);
export const ReadyProvider = Ready.Provider;
/** False while a loader covers the page, so entrances can wait for the curtain. */
export const useSiteReady = () => useContext(Ready);


/** Fetches and decodes each URL; calls back in completion order with the index. */
export function preload(urls: string[], onDone: (i: number, ok: boolean) => void) {
  urls.forEach((src, i) => {
    const img = new window.Image();
    img.src = src;
    img.decode().then(
      () => onDone(i, true),
      () => onDone(i, false),
    );
  });
}

/**
 * Runs `start` while the element is on screen and `stop` when it leaves, so rAF
 * loops never run for something nobody can see.
 */
export function useOnScreen(
  ref: React.RefObject<Element | null>,
  onChange: (visible: boolean) => void,
  rootMargin = "0px",
) {
  const cb = useRef(onChange);
  useEffect(() => {
    cb.current = onChange;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => cb.current(e.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
}
