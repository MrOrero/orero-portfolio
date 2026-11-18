"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useReduced } from "@/lib/motion";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { clamp, easeOut } from "@/lib/motion";
import { CardFace, type DeckItem } from "./Card";
import { CardView } from "./CardView";
import { EASE_F } from "./ease";

type Pose = { x: number; y: number; w: number };

// A fixed scatter per card, so the deck looks handled but never jumps between renders.
const seedRot = (i: number) => ((i * 37) % 11) - 5;
const landRot = (i: number) => (((i * 53) % 7) - 3) * 0.6;

/**
 * The career, dealt. The scene pins; scrolling deals the deck oldest first, each
 * card arcing from the deck into its year. Slots are laid out by CSS (columns on
 * desktop, rows on a phone) and measured at rest; scroll only writes transforms.
 */
export function Deal({ items }: { items: DeckItem[] }) {
  // Oldest first: the hand builds up to today.
  const order = useMemo(() => [...items].sort((a, b) => a.end - b.end || a.start - b.start), [items]);
  const years = useMemo(() => [...new Set(order.map((p) => p.end))], [order]);
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const deck = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const slots = useRef<(HTMLElement | null)[]>([]);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const geo = useRef<{ from: Pose; to: Pose[] } | null>(null);
  const [open, setOpen] = useState<DeckItem | null>(null);
  const reduce = useReduced();
  const N = order.length;

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });

  const apply = useCallback(
    (p: number) => {
      const g = geo.current;
      if (!g) return;
      let dealt = 0;
      for (let i = 0; i < N; i++) {
        const el = cards.current[i];
        const to = g.to[i];
        if (!el || !to) continue;
        const start = (i / N) * 0.8;
        const e = reduce ? 1 : easeOut(clamp((p - start) / 0.2));
        if (e >= 1) dealt += 1;
        // Waiting in the deck: stacked, slightly scattered, smaller.
        const fx = g.from.x + (N - i) * 0.6;
        const fy = g.from.y - (N - i) * 0.9;
        const s = (g.from.w / to.w) * (1 - e) + e;
        const x = fx + (to.x - fx) * e;
        const y = fy + (to.y - fy) * e - Math.sin(Math.PI * e) * 120;
        const r = seedRot(i) * (1 - e) + landRot(i) * e + Math.sin(Math.PI * e) * 14;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(3)})`;
        el.style.zIndex = String(e > 0 ? 100 + i : N - i);
        el.dataset.landed = e >= 1 ? "" : undefined;
        if (e < 1) delete el.dataset.landed;
      }
      if (counter.current) counter.current.textContent = String(dealt).padStart(2, "0");
    },
    [N, reduce],
  );

  const measure = useCallback(() => {
    const st = stage.current;
    const dk = deck.current;
    if (!st || !dk) return;
    const sr = st.getBoundingClientRect();
    const dr = dk.getBoundingClientRect();
    const to = slots.current.map((s) => {
      const r = s!.getBoundingClientRect();
      return { x: r.left - sr.left, y: r.top - sr.top, w: r.width };
    });
    // Every card is laid out at its slot's width; the deck scales it down.
    cards.current.forEach((c, i) => {
      if (c) c.style.width = `${to[i].w}px`;
    });
    geo.current = { from: { x: dr.left - sr.left, y: dr.top - sr.top, w: dr.width }, to };
    apply(scrollYProgress.get());
  }, [apply, scrollYProgress]);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (stage.current) ro.observe(stage.current);
    return () => ro.disconnect();
  }, [measure]);
  useMotionValueEvent(scrollYProgress, "change", apply);
  useEffect(() => {
    document.fonts?.ready.then(measure);
  }, [measure]);

  const close = useCallback(() => setOpen(null), []);
  let idx = 0;

  return (
    <section ref={section} id="deal" className="f-deal" aria-labelledby="deal-h">
      <div ref={stage} className="f-deal-stage">
        <div className="f-wrap f-deal-head">
          <h2 id="deal-h" className="f-h2">
            Dealt by year
          </h2>
          <p className="f-deal-count" aria-hidden="true">
            <span ref={counter}>00</span>/{String(N).padStart(2, "0")}
          </p>
          <p className="f-note">Years are approximate. Click any card for the full view.</p>
        </div>

        <ol className="f-wrap f-years">
          {years.map((y) => {
            const group = order.filter((p) => p.end === y);
            return (
              <li key={y} className="f-year">
                <p className="f-year-label">
                  <span>{y}</span>
                  <small>{group.length}</small>
                </p>
                <div className="f-year-slots">
                  {group.map((p) => {
                    const i = idx++;
                    return (
                      <span
                        key={p.slug}
                        className="f-slot"
                        ref={(el) => {
                          slots.current[i] = el;
                        }}
                      />
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ol>

        <div ref={deck} className="f-deck-origin" aria-hidden="true" />

        <ul className="f-deal-cards">
          {order.map((p, i) => (
            <li
              key={p.slug}
              className="f-deal-card"
              ref={(el) => {
                cards.current[i] = el;
              }}
            >
              <button type="button" onClick={() => setOpen(p)} data-cursor="Open" aria-label={`${p.title}, ${p.years}. Open full view`}>
                <motion.div layoutId={`deal-${p.slug}`} transition={{ duration: 0.85, ease: EASE_F }}>
                  <div className="f-lift">
                    <CardFace p={p} w={384} />
                  </div>
                </motion.div>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <AnimatePresence>{open && <CardView key={open.slug} item={open} layoutId={`deal-${open.slug}`} onClose={close} />}</AnimatePresence>
    </section>
  );
}
