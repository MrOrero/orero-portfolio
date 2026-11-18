"use client";

import { animate, AnimatePresence, motion, useMotionValue } from "motion/react";
import { useReduced } from "@/lib/motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { CardBack, CardFace, type DeckItem } from "./Card";
import { CardView } from "./CardView";
import { EASE_F, SPRING_F } from "./ease";
import { FoilLayers, paintHolo, type HoloEls } from "./Holo";
import { Magnetic } from "./Magnetic";

const VISIBLE = 4;
const seed = (i: number) => ((i * 29) % 9) - 4;

/**
 * The deck: the signature interaction. Hold the top card and it comes with you,
 * tilting its foil to your movement; throw it and it flies off with your speed
 * and a spin, and the next card rises. Let go gently and it springs home. A tap
 * flips it over to the engraved back. Keyboard: arrows deal and return, Enter
 * flips, and every action has a button too.
 */
export function Deck({ items }: { items: DeckItem[] }) {
  const N = items.length;
  const [top, setTop] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [open, setOpen] = useState<DeckItem | null>(null);
  const reduce = useReduced();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rot = useMotionValue(0);
  const fade = useMotionValue(1);
  const holo = useRef<HoloEls>({ card: null, band: null, glare: null, foil: null });
  const busy = useRef(false);
  const lastDir = useRef(1);
  const returning = useRef(false);
  const area = useRef<HTMLDivElement>(null);
  const live = useRef<HTMLParagraphElement>(null);

  const current = items[top] ?? null;

  const tilt = useCallback((dx: number, dy: number) => {
    paintHolo(holo.current, Math.max(-16, Math.min(16, -dy * 0.06)), Math.max(-20, Math.min(20, dx * 0.05)));
  }, []);

  const reset = useCallback(() => {
    x.jump(0);
    y.jump(0);
    rot.jump(0);
    fade.jump(1);
    tilt(0, 0);
  }, [x, y, rot, fade, tilt]);

  const throwCard = useCallback(
    (dir: number, vx = 0) => {
      if (busy.current || top >= N) return;
      busy.current = true;
      lastDir.current = dir;
      const w = area.current?.offsetWidth ?? 600;
      if (reduce) {
        setTop((t) => t + 1);
        setFlipped(false);
        busy.current = false;
        return;
      }
      const dur = 0.6;
      animate(x, dir * (window.innerWidth * 0.6 + w), { duration: dur, ease: EASE_F });
      animate(y, y.get() + 60 + Math.abs(vx) * 30, { duration: dur, ease: EASE_F });
      animate(rot, rot.get() + dir * (28 + Math.min(60, Math.abs(vx) * 30)), { duration: dur, ease: EASE_F });
      animate(fade, 0, { duration: dur * 0.9, ease: "linear" }).then(() => {
        setTop((t) => t + 1);
        setFlipped(false);
        reset();
        busy.current = false;
      });
    },
    [N, top, reduce, x, y, rot, fade, reset],
  );

  const back = useCallback(() => {
    if (busy.current || top <= 0) return;
    returning.current = true;
    setFlipped(false);
    setTop((t) => t - 1);
  }, [top]);

  // A returning card flies back in from the side it left by.
  useEffect(() => {
    if (!returning.current) return;
    returning.current = false;
    if (reduce) return;
    busy.current = true;
    x.jump(lastDir.current * (window.innerWidth * 0.6));
    rot.jump(lastDir.current * 30);
    fade.jump(0);
    animate(fade, 1, { duration: 0.3 });
    animate(rot, 0, SPRING_F);
    animate(x, 0, { ...SPRING_F }).then(() => {
      busy.current = false;
    });
  }, [top, reduce, x, rot, fade]);

  useEffect(() => {
    if (live.current && current) live.current.textContent = `Card ${top + 1} of ${N}: ${current.title}`;
  }, [top, N, current]);

  const drag = useRef<{ x0: number; y0: number; id: number; lx: number; lt: number; vx: number; moved: boolean } | null>(null);

  const onDown = (e: React.PointerEvent) => {
    if (busy.current || (e.target as Element).closest("a")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x0: e.clientX, y0: e.clientY, id: e.pointerId, lx: e.clientX, lt: performance.now(), vx: 0, moved: false };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.moved && Math.hypot(dx, dy) < 6) return;
    d.moved = true;
    const now = performance.now();
    d.vx = (e.clientX - d.lx) / Math.max(1, now - d.lt);
    d.lx = e.clientX;
    d.lt = now;
    x.set(dx);
    y.set(dy * 0.5);
    rot.set(dx * 0.05);
    tilt(dx, dy);
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.moved) {
      setFlipped((f) => !f);
      return;
    }
    const w = area.current?.offsetWidth ?? 600;
    const dx = x.get();
    if (Math.abs(dx) > w * 0.22 || Math.abs(d.vx) > 0.55) {
      throwCard(Math.sign(dx || d.vx) || 1, d.vx);
    } else {
      animate(x, 0, SPRING_F);
      animate(y, 0, SPRING_F);
      animate(rot, 0, SPRING_F);
      tilt(0, 0);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      throwCard(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      back();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setFlipped((f) => !f);
    }
  };

  const close = useCallback(() => setOpen(null), []);
  const stack = items.slice(top, top + VISIBLE);

  return (
    <section id="deck" className="f-deckwrap" aria-labelledby="deck-h">
      <div className="f-wrap f-deck-grid">
        <div className="f-deck-intro">
          <h2 id="deck-h" className="f-h2">
            The deck
          </h2>
          <p className="f-deck-how">
            <span className="f-only-fine">Throw the top card off the deck. Click to flip it.</span>
            <span className="f-only-touch">Swipe the top card away. Tap to flip it.</span>
          </p>
        </div>

        <div
          ref={area}
          className="f-deck"
          tabIndex={0}
          role="group"
          aria-roledescription="card deck"
          aria-label="Project deck. Right arrow deals the next card, left arrow brings one back, Enter flips."
          onKeyDown={onKey}
        >
          <p ref={live} className="sr-only" aria-live="polite" />
          {top >= N && (
            <div className="f-deck-empty">
              <p>That&apos;s the whole deck.</p>
              <button type="button" className="f-btn f-btn-pearl" onClick={() => setTop(0)}>
                Gather the cards
              </button>
            </div>
          )}
          {[...stack].reverse().map((p) => {
            const d = items.indexOf(p) - top;
            const isTop = d === 0;
            return (
              <motion.div
                key={p.slug}
                className="f-deck-slot"
                initial={false}
                animate={{ y: d * 14, scale: 1 - d * 0.045, rotate: isTop ? 0 : seed(items.indexOf(p)) }}
                transition={reduce ? { duration: 0 } : SPRING_F}
                style={{ zIndex: VISIBLE - d }}
              >
                {isTop ? (
                  <motion.div
                    className="f-deck-hold"
                    style={{ x, y, rotate: rot, opacity: fade }}
                    onPointerDown={onDown}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerCancel={onUp}
                    data-cursor={flipped ? "Flip back" : "Drag"}
                  >
                    <motion.div layoutId={`deck-${p.slug}`} className="f-deck-layout" transition={{ duration: 0.85, ease: EASE_F }}>
                      <motion.div
                        className="f-flip"
                        animate={{ rotateY: flipped ? 180 : 0 }}
                        transition={reduce ? { duration: 0 } : { duration: 0.9, ease: EASE_F }}
                      >
                        <div
                          className="f-holo"
                          ref={(el) => {
                            holo.current.card = el;
                          }}
                        >
                          <div className="f-side f-side-front">
                            <CardFace p={p} />
                            <FoilLayers
                              bind={(k, el) => {
                                holo.current[k] = el;
                              }}
                              mask="frame"
                            />
                          </div>
                          <div className="f-side f-side-back">
                            <CardBack p={p} live={false} />
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                ) : (
                  <div className="f-deck-hold" aria-hidden="true">
                    <CardFace p={p} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="f-deck-info">
          <AnimatePresence mode="wait" initial={false}>
            {current && (
              <motion.div
                key={current.slug}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: EASE_F }}
              >
                <p className="f-kicker">
                  {String(top + 1).padStart(2, "0")} / {String(N).padStart(2, "0")} · {current.sectorLabel}
                </p>
                <h3 className="f-deck-title">{current.title}</h3>
                <p className="f-deck-desc">{current.description}</p>
                <dl className="f-dl">
                  <div>
                    <dt>Client</dt>
                    <dd>{current.client}</dd>
                  </div>
                  <div>
                    <dt>Years</dt>
                    <dd>{current.years}</dd>
                  </div>
                  {current.impact && (
                    <div>
                      <dt>Impact</dt>
                      <dd>{current.impact}</dd>
                    </div>
                  )}
                </dl>
                <div className="f-deck-actions">
                  <Magnetic href={current.link} external className="f-btn f-btn-pearl" cursor="Visit">
                    Visit live site ↗
                  </Magnetic>
                  <button type="button" className="f-btn" onClick={() => setOpen(current)} data-cursor="Open">
                    Full view
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="f-deck-controls" role="group" aria-label="Deck controls">
            <button type="button" className="f-round" onClick={back} disabled={top === 0} aria-label="Bring the last card back">
              ←
            </button>
            <button type="button" className="f-round" onClick={() => setFlipped((f) => !f)} disabled={!current} aria-pressed={flipped}>
              Flip
            </button>
            <button type="button" className="f-round" onClick={() => throwCard(1)} disabled={!current} aria-label="Deal the next card">
              →
            </button>
          </div>
        </div>
      </div>
      <AnimatePresence>{open && <CardView key={open.slug} item={open} layoutId={`deck-${open.slug}`} onClose={close} />}</AnimatePresence>
    </section>
  );
}
