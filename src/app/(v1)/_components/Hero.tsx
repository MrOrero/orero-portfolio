"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useReduced } from "@/lib/motion";
import { useEffect, useMemo, useRef } from "react";
import { useSiteReady } from "@/lib/intro";
import { BAYER8, INK, PAPER } from "./dither";
import { EASE_R } from "./ease";

const pack = ([r, g, b]: number[]) => (255 << 24) | (b << 16) | (g << 8) | r; // little-endian RGBA
const INK32 = pack(INK);
const PAPER32 = pack(PAPER);

/**
 * The name as a printed logo on thermal paper. It is rasterised from Cabinet
 * Grotesk Black into a grid of print dots and dithered every frame against a
 * heat field. The pointer is heat: paper darkens where it passes and cools back.
 * When nobody touches it, the print head makes a slow pass. Entrance: the logo
 * prints top to bottom once the intro's curtain lifts.
 */
function ThermalName({ lines }: { lines: string[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const ready = useSiteReady();
  const reduce = useReduced();
  const readyRef = useRef(ready);
  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const ctx = cv.getContext("2d")!;
    let cols = 0;
    let rows = 0;
    let cell = 4;
    let base = new Float32Array(0);
    let grain = new Float32Array(0);
    let heat = new Float32Array(0);
    let img: ImageData | null = null;
    let px32: Uint32Array = new Uint32Array(0);
    let printed = 0; // rows printed so far (entrance)
    let printStart = 0;
    let pointer: { x: number; y: number; t: number; down: boolean } | null = null;
    let last: { x: number; y: number } | null = null;
    let lastMove = 0;
    let running = false;
    let frame = 0;
    let dirty = true;

    const build = async () => {
      const family = getComputedStyle(el).fontFamily;
      try {
        await document.fonts.load(`900 100px ${family}`);
      } catch {
        // Falls back to whatever face is available.
      }
      const w = el.clientWidth;
      // A phone is taller than it is wide, so the logo prints rotated, the way a
      // receipt printer prints a sideways label, and runs down the paper.
      const vertical = w < 600;
      cell = w > 900 ? 4 : 3;
      cols = Math.floor(w / cell);
      const length = vertical ? Math.floor(el.clientHeight / cell) : cols;
      // Measure each line at a reference size, then fit it to the available length.
      const m = document.createElement("canvas").getContext("2d")!;
      m.font = `900 100px ${family}`;
      let fits = lines.map((t) => {
        const mt = m.measureText(t);
        const k = (length * 0.998) / (mt.actualBoundingBoxLeft + mt.actualBoundingBoxRight);
        return { t, size: 100 * k, asc: mt.actualBoundingBoxAscent * k, left: mt.actualBoundingBoxLeft * k, len: length * 0.998 };
      });
      let gap = Math.round(fits[0].asc * 0.1);
      const thick = () => fits.reduce((s, f) => s + f.asc, 0) + gap * (fits.length - 1);
      if (vertical && thick() > cols - 2) {
        // Too thick for the width: shrink every line by the same factor.
        const k = (cols - 2) / thick();
        fits = fits.map((f) => ({ ...f, size: f.size * k, asc: f.asc * k, left: f.left * k, len: f.len * k }));
        gap = Math.round(gap * k);
      }
      rows = vertical ? length : Math.ceil(thick()) + 2;
      const off = document.createElement("canvas");
      off.width = cols;
      off.height = rows;
      const o = off.getContext("2d", { willReadFrequently: true })!;
      o.fillStyle = "#000";
      o.textBaseline = "alphabetic";
      let at = vertical ? (cols - thick()) / 2 : 1;
      for (const f of fits) {
        o.font = `900 ${f.size}px ${family}`;
        if (vertical) {
          // Rotated a quarter turn anticlockwise: reads bottom to top, first line on the left.
          o.save();
          o.translate(at + f.asc, (rows + f.len) / 2);
          o.rotate(-Math.PI / 2);
          o.fillText(f.t, f.left, 0);
          o.restore();
        } else {
          o.fillText(f.t, f.left, at + f.asc);
        }
        at += f.asc + gap;
      }
      const a = o.getImageData(0, 0, cols, rows).data;
      base = new Float32Array(cols * rows);
      grain = new Float32Array(cols * rows);
      heat = new Float32Array(cols * rows);
      for (let i = 0; i < base.length; i++) {
        base[i] = a[i * 4 + 3] / 255;
        // Thermal density is never perfectly even.
        grain[i] = (Math.random() - 0.5) * 0.16;
      }
      cv.width = cols;
      cv.height = rows;
      el.style.setProperty("--r-rows", String(rows));
      el.style.setProperty("--r-cols", String(cols));
      img = ctx.createImageData(cols, rows);
      px32 = new Uint32Array(img.data.buffer);
      if (reduce) printed = rows;
      dirty = true;
      draw(performance.now());
      if (!running && !reduce) start();
    };

    const deposit = (cx: number, cy: number, r: number, amt: number) => {
      const x0 = Math.max(0, Math.floor(cx - r * 2));
      const x1 = Math.min(cols - 1, Math.ceil(cx + r * 2));
      const y0 = Math.max(0, Math.floor(cy - r * 2));
      const y1 = Math.min(rows - 1, Math.ceil(cy + r * 2));
      const inv = 1 / (2 * r * r);
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const d = (x - cx) ** 2 + (y - cy) ** 2;
          const i = y * cols + x;
          heat[i] = Math.min(1.2, heat[i] + amt * Math.exp(-d * inv));
        }
      }
    };

    const draw = (t: number) => {
      if (!img) return;
      // Entrance: print rows top to bottom once the curtain has lifted.
      if (printed < rows) {
        if (!readyRef.current) return;
        if (!printStart) printStart = t;
        printed = Math.min(rows, Math.floor(((t - printStart) / 1100) * rows));
        if (head.current) {
          head.current.style.transform = `translateY(${(printed / rows) * 100}%)`;
          head.current.style.opacity = printed < rows ? "1" : "0";
        }
        dirty = true;
      }
      // Heat in.
      const r = cell === 4 ? 9 : 7;
      if (pointer) {
        const cx = pointer.x / cell;
        const cy = pointer.y / cell;
        const from = last ?? { x: cx, y: cy };
        const dist = Math.hypot(cx - from.x, cy - from.y);
        const steps = Math.max(1, Math.ceil(dist / (r * 0.5)));
        const amt = pointer.down ? 0.5 : 0.14;
        for (let s = 1; s <= steps; s++) {
          deposit(from.x + ((cx - from.x) * s) / steps, from.y + ((cy - from.y) * s) / steps, r, amt);
        }
        last = { x: cx, y: cy };
        dirty = true;
      }
      // Idle: the print head passes slowly, warming a column of paper as it goes.
      if (t - lastMove > 2600 && printed >= rows) {
        const cyc = ((t - lastMove - 2600) % 7000) / 7000;
        if (cyc < 0.6) {
          const hx = (cyc / 0.6) * (cols + 40) - 20;
          for (let y = 0; y < rows; y += 1) {
            for (let x = Math.max(0, Math.floor(hx - 6)); x < Math.min(cols, hx + 6); x++) {
              const i = y * cols + x;
              heat[i] = Math.min(0.62, heat[i] + 0.05 * Math.exp(-((x - hx) ** 2) / 18));
            }
          }
          dirty = true;
        }
      }
      if (!dirty) return;
      // Cool down, dither, write.
      let any = false;
      for (let y = 0; y < rows; y++) {
        const by = (y & 7) << 3;
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          let h = heat[i];
          if (h > 0.001) {
            h *= 0.94;
            heat[i] = h;
            any = true;
          } else heat[i] = 0;
          if (y >= printed) {
            px32[i] = PAPER32;
            continue;
          }
          const v = Math.max(base[i] * 0.97, h * 0.9) + grain[i] * (base[i] > 0.5 ? 1 : 0.35 * h);
          px32[i] = v > BAYER8[by + (x & 7)] ? INK32 : PAPER32;
        }
      }
      ctx.putImageData(img, 0, 0);
      dirty = any || printed < rows || !!pointer;
    };

    const tick = (t: number) => {
      if (!running) return;
      draw(t);
      // A still pointer stops depositing.
      if (pointer && t - pointer.t > 120) {
        pointer = null;
        last = null;
      }
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running || reduce) return;
      running = true;
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      // The logo rides a scroll parallax, so map against where it is right now.
      // This is a read only; nothing is written before the next frame.
      const r = cv.getBoundingClientRect();
      const sx = cols / r.width;
      const sy = rows / r.height;
      pointer = { x: (e.clientX - r.left) * sx * cell, y: (e.clientY - r.top) * sy * cell, t: now, down: e.buttons > 0 };
      lastMove = now;
    };
    const onLeave = () => {
      pointer = null;
      last = null;
    };

    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
    io.observe(el);
    let rz = 0;
    const onResize = () => {
      clearTimeout(rz);
      rz = window.setTimeout(build, 150);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", onMove);
    el.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", onResize);
    build();
    return () => {
      stop();
      io.disconnect();
      clearTimeout(rz);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onMove);
      el.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, [lines, reduce]);

  return (
    <div ref={wrap} className="r-thermal">
      <canvas ref={canvas} aria-hidden="true" />
      <div ref={head} aria-hidden="true" className="r-printhead" />
    </div>
  );
}

const nav = [
  { label: "Work", href: "#work" },
  { label: "Memo", href: "#memo" },
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
  // The paper feeds on: the logo rides up a little faster than the page.
  const y = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-18%"]);
  const lines = useMemo(() => [first.toUpperCase(), last.toUpperCase()], [first, last]);

  const printIn = (d: number) => ({
    initial: { clipPath: "inset(0 0 100% 0)" },
    animate: ready ? { clipPath: "inset(0 0 0% 0)" } : undefined,
    transition: { duration: 0.5, delay: d, ease: EASE_R },
  });

  return (
    <header ref={ref} className="r-hero">
      <div className="r-wrap r-hero-bar">
        <motion.p {...printIn(0.05)}>
          {first} {last}
        </motion.p>
        <motion.nav aria-label="Sections" {...printIn(0.15)}>
          <ul>
            {nav.map((n) => (
              <li key={n.href}>
                <a href={n.href} data-cursor="Feed">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </motion.nav>
      </div>
      <div className="r-wrap">
        <motion.div className="r-hero-meta" {...printIn(0.25)}>
          <span>{role}</span>
          <span>Items {String(count).padStart(2, "0")}</span>
          <span>{span}</span>
        </motion.div>
        <div className="r-rule" aria-hidden="true" />
      </div>
      <motion.div className="r-wrap r-hero-name" style={{ y }}>
        <h1 className="sr-only">
          {first} {last}, {role}
        </h1>
        <ThermalName lines={lines} />
      </motion.div>
      <div className="r-wrap r-hero-foot">
        <motion.p className="r-hero-line" {...printIn(1.1)}>
          {line}
        </motion.p>
        <motion.p className="r-hero-hint" aria-hidden="true" {...printIn(1.3)}>
          <span className="r-only-fine">Move across the name. The paper is heat sensitive.</span>
          <span className="r-only-touch">Touch the name. The paper is heat sensitive.</span>
          <span className="r-hero-feed">Feed paper ↓</span>
        </motion.p>
      </div>
    </header>
  );
}
