"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useReduced } from "@/lib/motion";
import { useEffect, useRef, useState } from "react";
import { opt } from "@/lib/intro";
import { ditherImage, loadImage } from "./dither";

function Word({ word, i, n, progress }: { word: string; i: number; n: number; progress: MotionValue<number> }) {
  // Each word darkens over its own slice of the scroll, like heat crossing the paper.
  const a = i / n;
  const opacity = useTransform(progress, [a - 0.04, a + 0.06], [0.16, 1]);
  return <motion.span style={{ opacity }}>{word} </motion.span>;
}

/** The bio develops word by word as it scrolls through the middle of the screen. */
function Developing({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReduced();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.5"] });
  const words = text.split(" ");
  if (reduce) return <p className="r-memo-text">{text}</p>;
  return (
    <p ref={ref} className="r-memo-text">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((w, i) => (
          <Word key={i} word={w} i={i} n={words.length} progress={scrollYProgress} />
        ))}
      </span>
    </p>
  );
}

/**
 * The portrait as a 1-bit print. A fine pointer is a warm lens that reprints the
 * paper in colour under it; tap or the button develops the whole print.
 */
function Portrait({ src, alt }: { src: string; alt: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const colour = useRef<HTMLImageElement>(null);
  const [full, setFull] = useState(false);
  const reduce = useReduced();

  useEffect(() => {
    let off = false;
    loadImage(opt(src, 384)).then(
      (img) => {
        const c = cv.current;
        if (off || !c) return;
        c.width = 168;
        c.height = 224;
        c.getContext("2d")!.putImageData(ditherImage(img, 168, 224, 1.25), 0, 0);
      },
      () => {},
    );
    return () => {
      off = true;
    };
  }, [src]);

  useEffect(() => {
    const el = wrap.current;
    const img = colour.current;
    if (!el || !img || reduce) return;
    // Fully developed: hand the clip back to CSS.
    if (full) {
      img.style.clipPath = "";
      return;
    }
    let frame = 0;
    let pos: { x: number; y: number } | null = null;
    const paint = () => {
      frame = 0;
      img.style.clipPath = pos ? `circle(22% at ${pos.x}px ${pos.y}px)` : "circle(0% at 50% 50%)";
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      pos = { x: e.clientX - r.left, y: e.clientY - r.top };
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const leave = () => {
      pos = null;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [full, reduce]);

  return (
    <figure className="r-portrait">
      <div
        ref={wrap}
        className="r-portrait-frame"
        data-full={full || undefined}
        data-cursor={full ? undefined : "Warm"}
        onPointerUp={(e) => {
          // Touch and pen: tap develops the whole print. A mouse has the lens instead.
          if (e.pointerType !== "mouse") setFull((f) => !f);
        }}
      >
        <canvas ref={cv} aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element -- preloaded optimiser URL. */}
        <img ref={colour} src={opt(src, 828)} alt={alt} draggable={false} className="r-portrait-colour" />
      </div>
      <figcaption>
        <span>Fig. 1, the account holder.</span>
        <button type="button" className="r-textbtn" aria-pressed={full} onClick={() => setFull((f) => !f)}>
          {full ? "Back to 1-bit" : "Print in colour"}
        </button>
      </figcaption>
    </figure>
  );
}

export function Memo({
  bio,
  portrait,
  name,
  stack,
  sectors,
}: {
  bio: string;
  portrait: string;
  name: string;
  stack: string[];
  sectors: string[];
}) {
  return (
    <section id="memo" className="r-memo" aria-labelledby="memo-h">
      <div className="r-wrap r-memo-grid">
        <div className="r-memo-side">
          <h2 id="memo-h" className="r-label">
            Memo
          </h2>
          <Portrait src={portrait} alt={`Portrait of ${name}, arms folded, in a maroon shirt.`} />
        </div>
        <div className="r-memo-main">
          <Developing text={bio} />
          <div className="r-memo-lists">
            <div>
              <h3 className="r-label">Stack</h3>
              <ul className="r-lines r-lines-list">
                {stack.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="r-label">Sectors</h3>
              <ul className="r-lines r-lines-list">
                {sectors.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
