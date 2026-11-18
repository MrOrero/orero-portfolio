"use client";

import { useReduced } from "@/lib/motion";
import { useEffect, useRef } from "react";

export type HoloEls = { card: HTMLElement | null; band: HTMLElement | null; glare: HTMLElement | null; foil: HTMLElement | null };

/**
 * Writes one pose of a holographic card: tilt (deg), the foil band sliding
 * against the tilt, the glare following it, and foil strength rising with the
 * angle. Transforms and opacity only.
 */
export function paintHolo(els: HoloEls, rx: number, ry: number, extra = "") {
  const k = Math.min(1, Math.hypot(rx, ry) / 14);
  if (els.card) els.card.style.transform = `${extra} rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
  if (els.band) els.band.style.transform = `translate3d(${(-ry * 2.4).toFixed(1)}%, ${(rx * 2.4).toFixed(1)}%, 0) rotate(-24deg)`;
  if (els.glare) {
    els.glare.style.transform = `translate3d(${(ry * 3.4).toFixed(1)}%, ${(-rx * 3.4).toFixed(1)}%, 0)`;
    els.glare.style.opacity = String(0.25 + k * 0.6);
  }
  if (els.foil) els.foil.style.opacity = String(0.35 + k * 0.65);
}

/** The foil and glare layers; place inside a card, above its art. */
/** `bind` stores each layer element; the owner keeps them in its own ref. */
export function FoilLayers({ bind, mask }: { bind: (k: keyof HoloEls, el: HTMLElement | null) => void; mask?: "frame" | "full" }) {
  return (
    <>
      <div
        className={`f-foil ${mask === "frame" ? "is-frame" : ""}`}
        aria-hidden="true"
        ref={(el) => {
          bind("foil", el);
        }}
      >
        <div
          className="f-foil-band"
          ref={(el) => {
            bind("band", el);
          }}
        />
      </div>
      <div className="f-glare-wrap" aria-hidden="true">
        <div
          className="f-glare"
          ref={(el) => {
            bind("glare", el);
          }}
        />
      </div>
    </>
  );
}

/**
 * A card that leans toward a fine pointer (or a finger pressed on it) and sways
 * slowly on its own when `idle` is set. The loop runs only while the card is on
 * screen and something is moving.
 */
export function Holo({
  children,
  className,
  max = 14,
  idle = false,
  mask = "full",
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
  idle?: boolean;
  mask?: "frame" | "full";
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const els = useRef<HoloEls>({ card: null, band: null, glare: null, foil: null });
  const reduce = useReduced();

  useEffect(() => {
    const w = wrap.current;
    if (!w) return;
    paintHolo(els.current, 0, 0);
    if (reduce) return;
    let target: { x: number; y: number } | null = null;
    const cur = { x: 0, y: 0 };
    let running = false;
    let visible = false;
    let frame = 0;
    let rect = w.getBoundingClientRect();
    const tick = (t: number) => {
      if (!running) return;
      let tx = 0;
      let ty = 0;
      if (target) {
        tx = target.x;
        ty = target.y;
      } else if (idle) {
        tx = Math.sin(t / 2100) * max * 0.45;
        ty = Math.cos(t / 2700) * max * 0.6;
      }
      cur.x += (tx - cur.x) * 0.1;
      cur.y += (ty - cur.y) * 0.1;
      paintHolo(els.current, cur.x, cur.y);
      const settled = !target && !idle && Math.abs(cur.x) < 0.02 && Math.abs(cur.y) < 0.02;
      if (settled || !visible) {
        running = false;
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running || !visible) return;
      running = true;
      frame = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.buttons === 0) return;
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      target = { x: -ny * 2 * max, y: nx * 2 * max };
      start();
    };
    const onEnter = () => {
      // Measured at rest, on entry, never during the tilt.
      rect = w.getBoundingClientRect();
    };
    const onLeave = () => {
      target = null;
      start();
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && idle) start();
    });
    io.observe(w);
    w.addEventListener("pointerenter", onEnter);
    w.addEventListener("pointerdown", onEnter);
    w.addEventListener("pointermove", onMove);
    w.addEventListener("pointerleave", onLeave);
    w.addEventListener("pointerup", onLeave);
    return () => {
      running = false;
      cancelAnimationFrame(frame);
      io.disconnect();
      w.removeEventListener("pointerenter", onEnter);
      w.removeEventListener("pointerdown", onEnter);
      w.removeEventListener("pointermove", onMove);
      w.removeEventListener("pointerleave", onLeave);
      w.removeEventListener("pointerup", onLeave);
    };
  }, [idle, max, reduce]);

  return (
    <div ref={wrap} className={`f-holo-wrap ${className ?? ""}`}>
      <div
        className="f-holo"
        ref={(el) => {
          els.current.card = el;
        }}
      >
        {children}
        <FoilLayers
          bind={(k, el) => {
            els.current[k] = el;
          }}
          mask={mask}
        />
      </div>
    </div>
  );
}
