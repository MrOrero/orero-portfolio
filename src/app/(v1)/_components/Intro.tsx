"use client";

import { AnimatePresence, motion } from "motion/react";
import { useReduced } from "@/lib/motion";
import { useEffect, useRef, useState } from "react";
import { markIntroSeen, opt, preload, ReadyProvider, useIntroSeen } from "@/lib/intro";
import { ditherImage, loadImage } from "./dither";
import { EASE_R } from "./ease";

/** One line feeds every STEP ms, so the receipt prints even on a fast connection. */
const STEP = 150;
const MAX_WAIT = 6500;
const HOLD = 650;
const LINE = 34;
/** The hero's entrance starts this long into the curtain lifting. */
const REVEAL = 520;

export type IntroItem = { src: string; title: string };
type Line = { id: string; kind: "head" | "item" | "rule" | "total" | "ok"; text: string; n?: number; src?: string };

/**
 * The intro is a terminal printing the portfolio. Every work image is fetched and
 * decoded before the page shows, and each one prints as a line item with its own
 * 1-bit thumbnail. On APPROVED the dark counter lifts away with a torn edge.
 * Runs once per tab; the layout's inline script hides it before first paint after that.
 */
export function Intro({ items, extra, name, children }: { items: IntroItem[]; extra: string[]; name: string; children: React.ReactNode }) {
  const skip = useIntroSeen("v1");
  const reduce = useReduced();
  const [phase, setPhase] = useState<"loading" | "leaving" | "gone">("loading");
  const [revealed, setRevealed] = useState(false);
  const [lines, setLines] = useState<Line[]>(() => [
    { id: "h1", kind: "head", text: name.toUpperCase() },
    { id: "h2", kind: "rule", text: "" },
  ]);
  const [count, setCount] = useState(0);
  const [now, setNow] = useState("");

  useEffect(() => {
    if (skip) return;
    let cancelled = false;
    let timedOut = false;
    let next = 0;
    // A project is ready once both of its sizes are decoded.
    const urls = items.flatMap((it) => [opt(it.src, 384), opt(it.src, 828)]);
    const hits = new Array(items.length).fill(0);
    const failed = new Set<number>();
    preload([...urls, ...extra], (i, ok) => {
      if (i >= urls.length) return;
      const p = Math.floor(i / 2);
      if (!ok) failed.add(p);
      hits[p] += 1;
    });

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearInterval(tick);
      clearTimeout(timer);
      markIntroSeen("v1");
      setLines((l) => [
        ...l,
        { id: "r2", kind: "rule", text: "" },
        { id: "t", kind: "total", text: `ITEMS ${String(items.length).padStart(2, "0")}` },
        { id: "ok", kind: "ok", text: "APPROVED" },
      ]);
      setTimeout(() => {
        if (cancelled) return;
        setPhase("leaving");
        setTimeout(() => setRevealed(true), REVEAL);
      }, HOLD);
    };

    const timer = setTimeout(() => (timedOut = true), MAX_WAIT);
    const tick = setInterval(() => {
      if (cancelled) return;
      if (next < items.length && (hits[next] >= 2 || failed.has(next))) {
        const i = next;
        next += 1;
        setCount(next);
        setLines((l) => [...l, { id: `i${i}`, kind: "item", text: items[i].title, n: i + 1, src: items[i].src }]);
      }
      if (next >= items.length || timedOut) finish();
    }, STEP);

    return () => {
      cancelled = true;
      clearInterval(tick);
      clearTimeout(timer);
    };
  }, [skip, items, extra]);

  // Printed time on the slip, set once on the client.
  useEffect(() => {
    if (skip) return;
    const id = setTimeout(() => {
      const d = new Date();
      setNow(
        `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()} ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`,
      );
    }, 0);
    return () => clearTimeout(id);
  }, [skip]);

  const covering = !skip && phase !== "gone";
  useEffect(() => {
    if (!covering) return;
    const root = document.documentElement;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = "";
    };
  }, [covering]);

  const latest = [...lines].reverse().find((l) => l.kind === "item");

  return (
    <ReadyProvider value={skip || revealed}>
      {children}
      <AnimatePresence onExitComplete={() => setPhase("gone")}>
        {!skip && phase === "loading" && (
          <motion.div
            key="intro"
            role="status"
            className="r-intro"
            initial={false}
            exit={reduce ? { opacity: 0, transition: { duration: 0.4 } } : { y: "-112%", transition: { duration: 0.95, ease: EASE_R } }}
          >
            <span className="sr-only">Printing the work, {count} of {items.length}</span>
            <div aria-hidden="true" className="r-intro-meta">
              <span>{name}</span>
              <span>{now}</span>
            </div>

            <div aria-hidden="true" className="r-intro-feed">
              <div className="r-intro-strip">
                {lines.map((l, i) => (
                  <div
                    key={l.id}
                    className={`r-intro-line is-${l.kind}`}
                    style={{ transform: `translateY(${-(lines.length - 1 - i) * LINE}px)` }}
                  >
                    {l.kind === "item" && (
                      <>
                        <Thumb src={l.src!} />
                        <span className="r-intro-n">{String(l.n).padStart(2, "0")}</span>
                        <span className="r-intro-t">{l.text}</span>
                        <span className="r-intro-dots" />
                        <span>OK</span>
                      </>
                    )}
                    {l.kind !== "item" && l.text}
                  </div>
                ))}
              </div>
              <div className="r-intro-slot" />
            </div>

            <div aria-hidden="true" className="r-intro-foot">
              <div className="r-intro-now">
                <span>Printing</span>
                <div className="r-intro-roll">
                  <AnimatePresence initial={false}>
                    <motion.span
                      key={latest?.id ?? "none"}
                      initial={{ y: "100%" }}
                      animate={{ y: "0%" }}
                      exit={{ y: "-100%" }}
                      transition={{ duration: 0.35, ease: EASE_R }}
                    >
                      {latest?.text ?? "Warming up"}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
              <p className="r-intro-count">
                {String(count).padStart(2, "0")}
                <span>/{String(items.length).padStart(2, "0")}</span>
              </p>
            </div>
            {/* The torn edge the counter lifts away by. */}
            <div aria-hidden="true" className="r-intro-tear" />
          </motion.div>
        )}
      </AnimatePresence>
    </ReadyProvider>
  );
}

/** A tiny 1-bit thumbnail; the image is already decoded, so this is instant. */
function Thumb({ src }: { src: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let off = false;
    loadImage(opt(src, 384)).then(
      (img) => {
        const c = ref.current;
        if (off || !c) return;
        c.width = 39;
        c.height = 26;
        c.getContext("2d")!.putImageData(ditherImage(img, 39, 26, 1.5), 0, 0);
      },
      () => {},
    );
    return () => {
      off = true;
    };
  }, [src]);
  return <canvas ref={ref} className="r-intro-thumb" />;
}
