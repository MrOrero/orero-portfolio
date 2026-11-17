"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { person } from "@/content";
import { DUR, EASE, clamp, usePrefersReducedMotion } from "@/lib/motion";

/** Orero's signature writes itself in as the block scrolls into view. */
export function OreroSignature() {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      el.style.setProperty("--w", "1");
      return;
    }
    let raf = 0;
    let top = 0;
    const measure = () => {
      top = el.getBoundingClientRect().top + window.scrollY;
      tick();
    };
    const tick = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const vh = window.innerHeight;
        const atEnd = window.scrollY + vh >= document.documentElement.scrollHeight - 4;
        const p = atEnd ? 1 : clamp((window.scrollY + vh - top) / (vh * 0.3));
        el.style.setProperty("--w", p.toFixed(3));
      });
    };
    measure();
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", tick);
      window.removeEventListener("resize", measure);
    };
  }, [reduced]);
  return (
    <span className="c-sig c-sig-orero" ref={ref}>
      <span className="sr-only">Signed: {person.name}</span>
      <span aria-hidden="true" className="c-sig-ink">
        {person.name}
      </span>
      <span aria-hidden="true" className="c-nib" />
    </span>
  );
}

type Pt = [number, number];

/** The visitor's signature pad: pointer or finger, plus a typed alternative. */
export function SignaturePad() {
  const reduced = usePrefersReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const strokes = useRef<Pt[][]>([]);
  const drawing = useRef(false);
  const raf = useRef(0);
  const box = useRef<DOMRect | null>(null);
  const [inked, setInked] = useState(0);
  const [typed, setTyped] = useState("");
  const [executed, setExecuted] = useState(false);
  const [drying, setDrying] = useState(false);
  const [date, setDate] = useState("");

  useEffect(() => {
    setDate(new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }));
  }, []);

  const toD = () =>
    strokes.current
      .map((s) => {
        if (s.length < 2) return s.length ? `M${s[0][0]} ${s[0][1]}l0.1 0` : "";
        let d = `M${s[0][0]} ${s[0][1]}`;
        for (let i = 1; i < s.length - 1; i++) {
          const mx = (s[i][0] + s[i + 1][0]) / 2;
          const my = (s[i][1] + s[i + 1][1]) / 2;
          d += `Q${s[i][0]} ${s[i][1]} ${mx.toFixed(1)} ${my.toFixed(1)}`;
        }
        return d;
      })
      .join("");

  const paint = () => {
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      pathRef.current?.setAttribute("d", toD());
    });
  };

  const point = (e: React.PointerEvent): Pt => {
    const b = box.current!;
    return [((e.clientX - b.left) / b.width) * 600, ((e.clientY - b.top) / b.height) * 180];
  };

  const down = (e: React.PointerEvent) => {
    if (executed) return;
    box.current = svgRef.current!.getBoundingClientRect(); // measured once per stroke
    drawing.current = true;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    strokes.current.push([point(e)]);
    setTyped("");
    paint();
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const s = strokes.current[strokes.current.length - 1];
    const p = point(e);
    const last = s[s.length - 1];
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) > 1.5) s.push(p);
    paint();
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const len = strokes.current.reduce((a, s) => a + s.length, 0);
    setInked(len);
  };

  const clear = () => {
    strokes.current = [];
    pathRef.current?.setAttribute("d", "");
    setInked(0);
    setTyped("");
    setExecuted(false);
  };

  const canExecute = inked > 12 || typed.trim().length > 1;
  const execute = () => {
    if (!canExecute) return;
    setDrying(true);
    setTimeout(
      () => {
        setDrying(false);
        setExecuted(true);
      },
      reduced ? 0 : 900,
    );
  };

  const mail = `mailto:${person.email}?subject=${encodeURIComponent("Countersigned: let's build something")}&body=${encodeURIComponent(
    `Hi Orero,\n\nI've signed the agreement on your site. Here's what I'd like to build:\n\n`,
  )}`;

  return (
    <div className="c-pad-wrap" data-executed={executed || undefined}>
      <div className={`c-pad${drying ? " is-drying" : ""}`}>
        <svg
          ref={svgRef}
          viewBox="0 0 600 180"
          className="c-pad-svg"
          role="img"
          aria-label={executed ? "Your signature" : "Signature pad: draw with a pointer or finger, or type your name below"}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        >
          <path ref={pathRef} className="c-pad-ink" d="" />
          {typed && (
            <text x="24" y="120" className="c-pad-typed">
              {typed}
            </text>
          )}
        </svg>
        <span className="c-pad-line" aria-hidden="true">
          ✕
        </span>
        {!inked && !typed && (
          <span className="c-pad-hint" aria-hidden="true">
            Sign here
          </span>
        )}
      </div>
      <div className="c-pad-row">
        <label className="c-type">
          <span>Or type your name to sign</span>
          <input
            value={typed}
            disabled={executed}
            onChange={(e) => {
              setTyped(e.target.value);
              if (e.target.value) {
                strokes.current = [];
                pathRef.current?.setAttribute("d", "");
                setInked(0);
              }
            }}
            onKeyDown={(e) => e.key === "Enter" && execute()}
            autoComplete="name"
          />
        </label>
        <div className="c-pad-actions">
          <button type="button" onClick={clear} className="c-btn-ghost">
            Clear
          </button>
          <button type="button" onClick={execute} disabled={!canExecute || executed} className="c-btn">
            {drying ? "Ink drying…" : executed ? "Executed" : "Execute agreement"}
          </button>
        </div>
      </div>
      <p className="c-witness">
        The Client{date ? `, ${date}` : ""}
      </p>
      <AnimatePresence>
        {executed && (
          <motion.div
            className="c-executed"
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.base, ease: EASE }}
            role="status"
          >
            <Seal reduced={reduced} />
            <div>
              <p>This agreement is executed. The next step is a conversation.</p>
              <a href={mail} className="c-deliver">
                Deliver the countersigned copy <span aria-hidden="true">→</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Seal({ reduced, still }: { reduced?: boolean; still?: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 120 120"
      className="c-seal"
      aria-hidden="true"
      initial={reduced || still ? false : { scale: 1.8, rotate: -24, opacity: 0 }}
      animate={{ scale: 1, rotate: -8, opacity: 1 }}
      transition={{ duration: DUR.base, ease: EASE }}
    >
      <defs>
        <path id="seal-c" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" />
      </defs>
      <circle cx="60" cy="60" r="57" className="c-seal-o" />
      <circle cx="60" cy="60" r="34" className="c-seal-i" />
      <text className="c-seal-t">
        <textPath href="#seal-c">ORERO OZORE · SOFTWARE ENGINEER · EST. 2020 ·</textPath>
      </text>
      <text x="60" y="70" textAnchor="middle" className="c-seal-m">
        OO
      </text>
    </motion.svg>
  );
}
