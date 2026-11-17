"use client";

import { useEffect, useRef, useState } from "react";

const CHARSET = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:-/&$+'";
const rand = () => CHARSET[1 + Math.floor(Math.random() * (CHARSET.length - 1))];
const norm = (s: string, w: number) =>
  s
    .toUpperCase()
    .replace(/[^A-Z0-9 .,:\-/&$+']/g, " ")
    .padEnd(w)
    .slice(0, w);

type Props = {
  text: string;
  width: number;
  /** ms before the first cell starts */
  delay?: number;
  /** intermediate characters before landing; 1 on touch, 0 when reduced */
  steps?: number;
  reduced?: boolean;
  /** cells re-scramble under the pointer */
  interactive?: boolean;
  className?: string;
};

/**
 * Split-flap text. One rAF loop per string; each cell runs through a few random
 * characters and lands, with a left-to-right stagger. Cells are aria-hidden;
 * the full text is provided once as screen-reader text.
 */
export default function Flap({ text, width, delay = 0, steps = 7, reduced, interactive, className }: Props) {
  const target = norm(text, width);
  const [shown, setShown] = useState(() => (reduced ? target : " ".repeat(width)));
  const shownRef = useRef(shown);
  const queue = useRef<{ at: number; left: number; to: string }[]>([]);
  const raf = useRef(0);

  const run = () => {
    if (raf.current) return;
    let last = 0;
    const tick = (t: number) => {
      raf.current = 0;
      if (t - last >= 50) {
        last = t;
        const cur = shownRef.current.split("");
        let changed = false;
        queue.current.forEach((q, i) => {
          if (!q || q.left <= 0 || t < q.at) return;
          q.left -= 1;
          cur[i] = q.left === 0 ? q.to : rand();
          changed = true;
        });
        if (changed) {
          shownRef.current = cur.join("");
          setShown(shownRef.current);
        }
      }
      if (queue.current.some((q) => q && q.left > 0)) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (reduced || steps === 0) {
      shownRef.current = target;
      setShown(target);
      return;
    }
    const now = performance.now();
    queue.current = Array.from(target).map((to, i) => ({
      at: now + delay + i * 22,
      left: shownRef.current[i] === to ? 0 : steps + Math.floor(Math.random() * 3),
      to,
    }));
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, reduced, steps, delay]);

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    },
    [],
  );

  const poke = (i: number) => {
    if (!interactive || reduced) return;
    const q = queue.current[i];
    if (q && q.left > 0) return;
    queue.current[i] = { at: performance.now(), left: 4 + Math.floor(Math.random() * 4), to: target[i] };
    run();
  };

  return (
    <span className={`fl ${className ?? ""}`} style={{ ["--n" as string]: width }}>
      <span className="sr-only">{text}</span>
      <span className="fl-cells" aria-hidden="true">
        {Array.from(shown).map((ch, i) => (
          <span
            key={`${i}:${ch}`}
            className={`fl-cell${reduced ? "" : " fl-anim"}`}
            onPointerEnter={interactive ? (e) => e.pointerType === "mouse" && poke(i) : undefined}
          >
            {ch === " " ? " " : ch}
          </span>
        ))}
      </span>
    </span>
  );
}
