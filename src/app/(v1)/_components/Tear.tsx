"use client";

import { motion } from "motion/react";
import { useReduced } from "@/lib/motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { easeOut } from "@/lib/motion";
import { EASE_R } from "./ease";
import { Magnetic } from "./Magnetic";

type Link = { label: string; href: string };
type State = "attached" | "falling" | "gone";

/** Past this much tear, letting go finishes the rip instead of springing back. */
const COMMIT = 0.42;
const MAX_TILT = 9; // degrees while still attached

/**
 * The customer copy, held on by a perforation. Drag it (sideways on touch) and
 * it peels away from the side you pull from: the tear front runs along the
 * perforation and the copy hinges on it, so the torn end hangs and the attached
 * end tucks under the receipt. Let go past COMMIT and it rips free and falls with
 * the velocity you gave it; before that it springs back. The button does the
 * same rip for keyboards. Everything is a transform on one element.
 */
function CustomerCopy({ name, email, links, onGone }: { name: string; email: string; links: Link[]; onGone: () => void }) {
  const el = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const reduce = useReduced();
  const s = useRef({ p: 0, side: 1, dx: 0, dy: 0, vx: 0, vy: 0, lastX: 0, lastY: 0, lastT: 0, raf: 0, state: "attached" as State });
  const [state, setState] = useState<State>("attached");

  const render = useCallback(() => {
    const e = el.current;
    if (!e) return;
    const { p, side, dx, dy } = s.current;
    // The hinge sits at the tear front; the copy rotates down on the torn side.
    const front = side > 0 ? p * 100 : 100 - p * 100;
    e.style.transformOrigin = `${front}% 0`;
    const tilt = -side * MAX_TILT * easeOut(Math.min(1, p * 1.4));
    e.style.transform = `translate3d(${dx * 0.12}px, ${Math.max(0, dy) * 0.12 + p * 6}px, 0) rotate(${tilt}deg)`;
    if (shade.current) shade.current.style.opacity = String(p * 0.9);
    e.style.setProperty("--tear", String(p));
  }, []);

  const fall = useCallback(() => {
    const e = el.current;
    if (!e) return;
    s.current.state = "falling";
    setState("falling");
    const r = e.getBoundingClientRect();
    let x = s.current.dx * 0.12;
    let y = Math.max(0, s.current.dy) * 0.12 + 6;
    let a = -s.current.side * MAX_TILT;
    let vx = s.current.vx * 14 + s.current.side * 3;
    let vy = Math.min(4, s.current.vy * 14) - 2;
    const va = -s.current.side * (3 + Math.abs(vx) * 0.25);
    e.style.transformOrigin = "50% 50%";
    const step = () => {
      vy += 0.9; // gravity, px/frame²
      vx *= 0.985;
      x += vx;
      y += vy;
      a += va * 0.6;
      e.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${a}deg)`;
      if (r.top + y > window.innerHeight + 80 || y > 2400) {
        s.current.state = "gone";
        setState("gone");
        onGone();
        return;
      }
      s.current.raf = requestAnimationFrame(step);
    };
    s.current.raf = requestAnimationFrame(step);
  }, [onGone]);

  /** Animate p (and the pull offset) to a target, then optionally fall. */
  const tweenTo = useCallback(
    (to: number, ms: number, then?: () => void) => {
      cancelAnimationFrame(s.current.raf);
      const from = { p: s.current.p, dx: s.current.dx, dy: s.current.dy };
      const t0 = performance.now();
      const step = (t: number) => {
        const k = easeOut(Math.min(1, (t - t0) / ms));
        s.current.p = from.p + (to - from.p) * k;
        if (to === 0) {
          s.current.dx = from.dx * (1 - k);
          s.current.dy = from.dy * (1 - k);
        }
        render();
        if (k < 1) s.current.raf = requestAnimationFrame(step);
        else then?.();
      };
      s.current.raf = requestAnimationFrame(step);
    },
    [render],
  );

  const tearNow = () => {
    if (s.current.state !== "attached") return;
    if (reduce) {
      s.current.state = "gone";
      setState("gone");
      onGone();
      return;
    }
    s.current.side = 1;
    s.current.vx = 0.5;
    s.current.vy = 0;
    tweenTo(1, 650, fall);
  };

  useEffect(() => () => cancelAnimationFrame(s.current.raf), []);

  const drag = useRef<{ x: number; y: number; id: number; touch: boolean; w: number } | null>(null);

  return (
    <div
      ref={el}
      className="r-copy"
      data-state={state}
      onPointerDown={(e) => {
        if (reduce || s.current.state !== "attached" || (e.target as Element).closest("a, button")) return;
        cancelAnimationFrame(s.current.raf);
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId, touch: e.pointerType !== "mouse", w: e.currentTarget.offsetWidth };
        s.current.lastX = e.clientX;
        s.current.lastY = e.clientY;
        s.current.lastT = performance.now();
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId) return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        const now = performance.now();
        const dt = Math.max(1, now - s.current.lastT);
        s.current.vx = (e.clientX - s.current.lastX) / dt;
        s.current.vy = (e.clientY - s.current.lastY) / dt;
        s.current.lastX = e.clientX;
        s.current.lastY = e.clientY;
        s.current.lastT = now;
        if (Math.abs(dx) > 4) s.current.side = Math.sign(dx);
        // Sideways pulls tear; on a mouse, pulling down helps too.
        const pull = Math.abs(dx) + (d.touch ? 0 : Math.max(0, dy) * 0.7);
        s.current.p = Math.min(1, pull / (d.w * 0.85));
        s.current.dx = dx;
        s.current.dy = dy;
        render();
        if (s.current.p >= 1) {
          drag.current = null;
          fall();
        }
      }}
      onPointerUp={(e) => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId) return;
        drag.current = null;
        if (s.current.p > COMMIT) tweenTo(1, 220, fall);
        else tweenTo(0, 520);
      }}
      onPointerCancel={() => {
        drag.current = null;
        tweenTo(0, 520);
      }}
    >
      <div className="r-copy-teeth" aria-hidden="true" />
      <p className="r-copy-kicker">
        <span>Customer copy</span>
        <span className="r-only-fine">Drag to tear</span>
        <span className="r-only-touch">Pull sideways to tear</span>
      </p>
      <p className="r-copy-name">{name}</p>
      <ul className="r-copy-links">
        <li>
          <a href={`mailto:${email}`} data-cursor="Write">
            {email}
          </a>
        </li>
        {links
          .filter((l) => !l.href.startsWith("mailto:"))
          .map((l) => (
            <li key={l.href}>
              <a href={l.href} target="_blank" rel="noreferrer" data-cursor="Open">
                {l.label} ↗
              </a>
            </li>
          ))}
      </ul>
      <p className="r-copy-thanks">Thank you. Come again.</p>
      <button type="button" className="r-copy-btn" onClick={tearNow} disabled={state !== "attached"}>
        ✂ Tear off
      </button>
      <div ref={shade} className="r-copy-shade" aria-hidden="true" />
    </div>
  );
}

export function Tear({ name, email, links }: { name: string; email: string; links: Link[] }) {
  const [copies, setCopies] = useState(0);
  const [torn, setTorn] = useState(false);
  const live = useRef<HTMLParagraphElement>(null);
  const onGone = useCallback(() => setTorn(true), []);

  return (
    <section id="contact" className="r-end" aria-labelledby="contact-h">
      <div className="r-end-paper">
        <div className="r-wrap-narrow">
          <h2 id="contact-h" className="r-label">
            Contact
          </h2>
          <p className="r-end-lead">The bottom of the receipt is yours to keep. It has my details on it.</p>
        </div>
      </div>
      <div className="r-perf" aria-hidden="true">
        <span>✂</span>
      </div>
      <div className="r-copy-slot">
        {!torn ? (
          <CustomerCopy key={copies} name={name} email={email} links={links} onGone={onGone} />
        ) : (
          <motion.div
            className="r-copy-after"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            transition={{ duration: 0.5, ease: EASE_R }}
          >
            <p ref={live} role="status">
              Copy torn off. Keep it somewhere safe.
            </p>
            <button
              type="button"
              className="r-textbtn"
              onClick={() => {
                setCopies((c) => c + 1);
                setTorn(false);
              }}
            >
              Print another copy
            </button>
          </motion.div>
        )}
      </div>
      <div className="r-cta">
        <div className="r-wrap">
          <p className="r-cta-kicker">Money, contracts, people</p>
          <p className="r-cta-big">
            Got something
            <br />
            that can&apos;t break?
          </p>
          <div className="r-cta-row">
            <Magnetic href={`mailto:${email}`} className="r-disc" cursor="Write">
              <span aria-hidden="true">Write to me</span>
              <span className="sr-only">Email {email}</span>
            </Magnetic>
            <a className="r-cta-mail" href={`mailto:${email}`} data-cursor="Write">
              {email}
            </a>
            <ul className="r-cta-links">
              {links
                .filter((l) => !l.href.startsWith("mailto:"))
                .map((l) => (
                  <li key={l.href}>
                    <a href={l.href} target="_blank" rel="noreferrer" data-cursor="Open">
                      {l.label} ↗
                    </a>
                  </li>
                ))}
            </ul>
          </div>
          <p className="r-foot">
            <span>© {name}</span>
            <span>Printed on demand</span>
          </p>
        </div>
      </div>
    </section>
  );
}
