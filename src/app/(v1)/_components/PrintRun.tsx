"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useReduced } from "@/lib/motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { opt } from "@/lib/intro";
import { useMediaQuery } from "@/lib/motion";
import { DitherImage } from "./DitherImage";
import { EASE_R, FEED_STEP } from "./ease";
import { Magnetic } from "./Magnetic";
import { ProjectView } from "./ProjectView";
import type { RunItem } from "./types";

/** Share of the feed already printed when the scene starts, so the header shows at once. */
const LEAD = 0.55;

/**
 * The print run. The scene pins; scrolling feeds the receipt out of a printer at
 * the bottom of the screen, in whole dot rows, one project per item. The item at
 * the tear bar is the current one: on desktop the terminal's display shows it in
 * colour beside the paper; on a phone it develops in place.
 *
 * All geometry is measured at rest (mount, resize, fonts); scroll only writes a
 * transform and, when it changes, the current index.
 */
export function PrintRun({ items }: { items: RunItem[] }) {
  const section = useRef<HTMLElement>(null);
  const feed = useRef<HTMLDivElement>(null);
  const paper = useRef<HTMLDivElement>(null);
  const itemEls = useRef<(HTMLElement | null)[]>([]);
  const geo = useRef({ start: 0, travel: 0, read: 0, tops: [] as number[] });
  const [travel, setTravel] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState<{ slug: string; from: "item" | "lcd" } | null>(null);
  const desk = useMediaQuery("(min-width: 1024px)");
  const reduce = useReduced();
  const pinned = !reduce && travel !== null;

  const measure = useCallback(() => {
    const f = feed.current;
    const p = paper.current;
    if (!f || !p) return;
    const feedH = f.clientHeight;
    const slot = feedH - (f.querySelector<HTMLElement>(".r-printer")?.offsetHeight ?? 0);
    const paperH = p.offsetHeight;
    const lead = slot * LEAD;
    const start = slot - lead;
    const read = feedH * 0.4;
    const tops = itemEls.current.map((el) => (el ? el.offsetTop + el.offsetHeight * 0.3 : 0));
    // Feed until the paper's end is out and the last item has reached the tear bar.
    const t = Math.max(0, paperH - lead + slot * 0.2, start + (tops.at(-1) ?? 0) - read + 60);
    geo.current = { start, travel: t, read, tops };
    setTravel(t);
  }, []);

  useLayoutEffect(() => {
    if (reduce) return;
    measure();
    const ro = new ResizeObserver(measure);
    if (paper.current) ro.observe(paper.current);
    if (feed.current) ro.observe(feed.current);
    return () => ro.disconnect();
  }, [measure, reduce]);

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const apply = useCallback(
    (v: number) => {
      const p = paper.current;
      if (!p || reduce) return;
      const g = geo.current;
      const raw = g.start - v * g.travel;
      const y = Math.round(raw / FEED_STEP) * FEED_STEP;
      p.style.transform = `translate3d(0, ${y}px, 0)`;
      // The current item is the last one whose middle has fed past the tear bar.
      let idx = 0;
      for (let i = 0; i < g.tops.length; i++) if (g.tops[i] + y <= g.read + 40) idx = i;
      setCurrent((c) => (c === idx ? c : idx));
    },
    [reduce],
  );
  useMotionValueEvent(scrollYProgress, "change", apply);
  // Place the paper once geometry changes, on the next frame (never inside a render pass).
  useEffect(() => {
    if (travel === null) return;
    const id = requestAnimationFrame(() => apply(scrollYProgress.get()));
    return () => cancelAnimationFrame(id);
  }, [travel, apply, scrollYProgress]);

  const item = items[current];
  const opened = open && items.find((i) => i.slug === open.slug);
  const close = useCallback(() => setOpen(null), []);

  return (
    <section
      ref={section}
      id="work"
      aria-labelledby="work-h"
      className={`r-run ${pinned ? "is-pinned" : "is-static"}`}
      style={pinned ? { height: `calc(100svh + ${travel}px)` } : undefined}
    >
      <div className="r-run-stage">
        {desk && pinned && (
          <div className="r-lcd" aria-live="polite">
            <p className="r-lcd-top">
              <span>Display</span>
              <span>
                {item.n} / {String(items.length).padStart(2, "0")}
              </span>
            </p>
            <button
              type="button"
              className="r-lcd-shot"
              onClick={() => setOpen({ slug: item.slug, from: "lcd" })}
              data-cursor="Reprint"
              aria-label={`Open ${item.title}`}
            >
              <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                  key={item.slug}
                  layoutId={`lcd-${item.slug}`}
                  className="r-lcd-img"
                  initial={{ clipPath: "inset(0 0 100% 0)" }}
                  animate={{ clipPath: "inset(0 0 0% 0)" }}
                  exit={{ opacity: 0, transition: { duration: 0.2, delay: 0.3 } }}
                  transition={{ duration: 0.55, ease: EASE_R }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- preloaded optimiser URL. */}
                  <img src={opt(item.image, 1200)} alt="" draggable={false} />
                </motion.div>
              </AnimatePresence>
            </button>
            <div className="r-lcd-cap">
              <div className="r-roll">
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.p
                    key={item.slug}
                    className="r-lcd-title"
                    initial={{ y: "100%" }}
                    animate={{ y: "0%" }}
                    exit={{ y: "-100%" }}
                    transition={{ duration: 0.45, ease: EASE_R }}
                  >
                    {item.title}
                  </motion.p>
                </AnimatePresence>
              </div>
              <p className="r-lcd-meta">
                {item.client} · {item.sectorLabel} · {item.years}
                {item.impact ? ` · ${item.impact}` : ""}
              </p>
              <div className="r-lcd-actions">
                <Magnetic href={item.link} external className="r-key r-key-paper" cursor="Visit">
                  Visit live site ↗
                </Magnetic>
                <button type="button" className="r-key r-key-ghost" onClick={() => setOpen({ slug: item.slug, from: "lcd" })} data-cursor="Reprint">
                  Full view
                </button>
              </div>
            </div>
          </div>
        )}

        <div ref={feed} className="r-feed">
          <div ref={paper} className="r-paper">
            <div className="r-paper-head">
              <h2 id="work-h">Work</h2>
              <p>
                {items.length} items, newest first. <span className="r-only-fine">Hover a print to develop it.</span>
                <span className="r-only-touch">Tap a print to open it.</span>
              </p>
              <div className="r-rule" aria-hidden="true" />
            </div>
            <ol className="r-items">
              {items.map((p, i) => (
                <li
                  key={p.slug}
                  ref={(el) => {
                    itemEls.current[i] = el;
                  }}
                  className="r-item"
                  data-current={(pinned && current === i) || undefined}
                >
                  <p className="r-item-head">
                    <span>#{p.n}</span>
                    <span>{p.years}</span>
                  </p>
                  <h3 className="r-item-title">{p.title}</h3>
                  <button
                    type="button"
                    className="r-item-shot"
                    onClick={() => setOpen({ slug: p.slug, from: "item" })}
                    data-cursor="Reprint"
                    aria-label={`Open ${p.title}`}
                  >
                    <motion.div layoutId={`item-${p.slug}`} transition={{ duration: 0.7, ease: EASE_R }}>
                      <DitherImage
                        src={p.image}
                        alt={`Screenshot of ${p.title}`}
                        cols={desk ? 150 : 130}
                        developed={reduce || (!desk && pinned && current === i)}
                      />
                    </motion.div>
                  </button>
                  <p className="r-item-desc">{p.description}</p>
                  <dl className="r-lines">
                    <div>
                      <dt>Client</dt>
                      <dd>{p.client}</dd>
                    </div>
                    <div>
                      <dt>Sector</dt>
                      <dd>{p.sectorLabel}</dd>
                    </div>
                    {p.impact && (
                      <div>
                        <dt>Impact</dt>
                        <dd>{p.impact}</dd>
                      </div>
                    )}
                  </dl>
                  <a className="r-item-link" href={p.link} target="_blank" rel="noreferrer" data-cursor="Visit">
                    Visit live site ↗<span className="sr-only"> ({p.title})</span>
                  </a>
                </li>
              ))}
            </ol>
            <p className="r-paper-end" aria-hidden="true">
              *** End of items ***
            </p>
          </div>
          <div className="r-printer" aria-hidden="true">
            <span className="r-printer-slot" />
            <span className="r-printer-led" />
            <span className="r-printer-label">Feed</span>
          </div>
          <div className="r-tearbar" aria-hidden="true" />
        </div>
      </div>

      <AnimatePresence>
        {opened && open && <ProjectView key={open.slug} item={opened} layoutId={`${open.from}-${open.slug}`} total={items.length} onClose={close} />}
      </AnimatePresence>
    </section>
  );
}
