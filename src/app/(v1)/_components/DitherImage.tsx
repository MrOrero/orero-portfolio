"use client";

import { useEffect, useRef, useState } from "react";
import { opt } from "@/lib/intro";
import { ditherImage, loadImage } from "./dither";

/**
 * A picture as the printer sees it: 1-bit, ink on paper. When `developed`, the
 * colour original is reprinted over it top to bottom in mechanical steps.
 * The dither is computed once, when the picture first comes near the screen.
 */
export function DitherImage({
  src,
  alt,
  cols = 180,
  ratio = 3 / 2,
  developed = false,
  colourWidth = 828,
  className,
  children,
}: {
  src: string;
  alt: string;
  cols?: number;
  ratio?: number;
  developed?: boolean;
  colourWidth?: 828 | 1200;
  className?: string;
  children?: React.ReactNode;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(false);
  const rows = Math.round(cols / ratio);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!near) return;
    let cancelled = false;
    loadImage(opt(src, 384)).then(
      (img) => {
        const c = canvas.current;
        if (cancelled || !c) return;
        c.width = cols;
        c.height = rows;
        c.getContext("2d")!.putImageData(ditherImage(img, cols, rows), 0, 0);
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [near, src, cols, rows]);

  return (
    <div ref={wrap} className={`r-dimg ${className ?? ""}`} style={{ aspectRatio: ratio }} data-developed={developed || undefined}>
      <canvas ref={canvas} aria-hidden="true" className="r-dimg-bits" />
      {/* eslint-disable-next-line @next/next/no-img-element -- same optimiser URL the intro preloaded, so it paints from cache. */}
      <img src={opt(src, colourWidth)} alt={alt} className="r-dimg-colour" loading="lazy" decoding="async" draggable={false} />

      {children}
    </div>
  );
}
