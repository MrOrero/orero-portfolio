"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "@/content";
import { person, sectorById } from "@/content";
import { DUR, EASE, useMediaQuery, usePrefersReducedMotion } from "@/lib/motion";
import Flap from "./Flap";

const W = { time: 4, flight: 6, dest: 21, remarks: 26, gate: 3, status: 8 };

/** Split a description into board-width pages, the way real boards alternate messages. */
function pages(text: string, width: number) {
  const out: string[] = [];
  let line = "";
  for (const word of text.toUpperCase().split(/\s+/)) {
    if ((line + " " + word).trim().length > width) {
      out.push(line.trim());
      line = word;
    } else line += " " + word;
  }
  if (line.trim()) out.push(line.trim());
  return out;
}

type Row = Project & { flight: string; status: "BOARDING" | "DEPARTED"; gate: string };

export default function Board({ projects }: { projects: Project[] }) {
  const reduced = usePrefersReducedMotion();
  const touch = useMediaQuery("(max-width: 899px), (hover: none)");
  const steps = reduced ? 0 : touch ? 1 : 7;
  const rowGap = touch ? 25 : 60; // ms between rows in the opening cascade
  const [hover, setHover] = useState<number | null>(null);
  const [idle, setIdle] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [boarding, setBoarding] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const lastMove = useRef(0);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);

  const rows: Row[] = useMemo(
    () =>
      projects.map((p, i) => ({
        ...p,
        flight: `OZ ${String(projects.length - i).padStart(3, "0")}`,
        status: p.end >= 2025 ? "BOARDING" : "DEPARTED",
        gate: sectorById[p.sector].code,
      })),
    [projects],
  );

  // The hovered row alternates through its description; idle rows occasionally do too.
  const focusRow = hover ?? idle;
  useEffect(() => {
    setPage(0);
    if (focusRow === null || steps === 0) return;
    const id = setInterval(() => setPage((p) => p + 1), 2200);
    return () => clearInterval(id);
  }, [focusRow, steps]);

  useEffect(() => {
    if (reduced || touch) return;
    const id = setInterval(() => {
      if (performance.now() - lastMove.current < 4000) return setIdle(null);
      setIdle((cur) => (cur === null ? Math.floor(Math.random() * rows.length) : null));
    }, 3600);
    return () => clearInterval(id);
  }, [reduced, touch, rows.length]);

  const remark = (r: Row, i: number) => {
    if (focusRow === i) {
      const ps = pages(r.description, W.remarks);
      return ps[page % ps.length];
    }
    return r.impact ?? r.client;
  };

  const close = useCallback(() => {
    const i = boarding;
    setBoarding(null);
    if (i !== null) triggers.current[i]?.focus();
  }, [boarding]);

  useEffect(() => {
    if (boarding === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [boarding, close]);

  return (
    <>
      <div
        className="d-board"
        role="table"
        aria-label="Departures: projects, newest first"
        onPointerMove={(e) => {
          if (e.pointerType === "mouse") lastMove.current = performance.now();
        }}
        onPointerLeave={() => setHover(null)}
      >
        <div className="d-row d-headrow" role="row">
          <span role="columnheader" className="c-time">Time</span>
          <span role="columnheader" className="c-flight">Flight</span>
          <span role="columnheader" className="c-dest">Destination</span>
          <span role="columnheader" className="c-rem">Remarks</span>
          <span role="columnheader" className="c-gate">Gate</span>
          <span role="columnheader" className="c-status">Status</span>
        </div>
        {rows.map((r, i) => (
          <div
            key={r.slug}
            role="row"
            className="d-row"
            data-hot={focusRow === i || boarding === i || open === i || undefined}
            onPointerEnter={(e) => e.pointerType === "mouse" && setHover(i)}
          >
            <span role="cell" className="c-time">
              <Flap text={String(r.end)} width={W.time} delay={i * rowGap} steps={steps} reduced={reduced} />
            </span>
            <span role="cell" className="c-flight">
              <Flap text={r.flight} width={W.flight} delay={i * rowGap + 80} steps={steps} reduced={reduced} />
            </span>
            <span role="cell" className="c-dest">
              <button
                type="button"
                ref={(el) => {
                  triggers.current[i] = el;
                }}
                className="d-trigger"
                aria-expanded={touch ? open === i : boarding === i}
                aria-controls={touch ? `d-inline-${r.slug}` : "d-pass"}
                onFocus={() => !touch && setHover(i)}
                onBlur={() => setHover((h) => (h === i ? null : h))}
                onClick={() => (touch ? setOpen(open === i ? null : i) : setBoarding(i))}
              >
                <Flap text={r.title} width={W.dest} delay={i * rowGap + 160} steps={steps} reduced={reduced} />
              </button>
            </span>
            <span role="cell" className="c-rem">
              <Flap text={remark(r, i)} width={W.remarks} delay={focusRow === i ? 0 : i * rowGap + 300} steps={steps} reduced={reduced} />
            </span>
            <span role="cell" className="c-gate">
              <Flap text={r.gate} width={W.gate} delay={i * rowGap + 420} steps={steps} reduced={reduced} />
            </span>
            <span role="cell" className={`c-status s-${r.status.toLowerCase()}`}>
              <Flap text={r.status} width={W.status} delay={i * rowGap + 480} steps={steps} reduced={reduced} />
            </span>
            {touch && open === i && (
              <div id={`d-inline-${r.slug}`} className="d-inline" role="cell">
                <div className="d-inline-img">
                  <Image src={r.image} alt={`${r.title} screenshot`} fill sizes="100vw" />
                </div>
                <p>{r.description}</p>
                <p className="d-inline-meta">
                  {r.client} · {sectorById[r.sector].label} · {r.start === r.end ? r.start : `${r.start}–${r.end}`}
                </p>
                <a href={r.link} target="_blank" rel="noreferrer" className="d-go">
                  Go to {r.title} <span aria-hidden="true">↗</span>
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {!touch && boarding !== null && (
          <Pass key={rows[boarding].slug} row={rows[boarding]} onClose={close} reduced={reduced} />
        )}
      </AnimatePresence>
    </>
  );
}

function Pass({ row, onClose, reduced }: { row: Row; onClose: () => void; reduced: boolean }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeRef.current?.focus(), []);
  return (
    <motion.aside
      id="d-pass"
      className="d-pass"
      role="dialog"
      aria-modal="false"
      aria-label={`Boarding pass: ${row.title}`}
      initial={reduced ? { opacity: 0 } : { x: "105%" }}
      animate={reduced ? { opacity: 1 } : { x: 0 }}
      exit={reduced ? { opacity: 0 } : { x: "105%" }}
      transition={{ duration: DUR.base, ease: EASE }}
    >
      <div className="p-top">
        <span>Boarding pass</span>
        <button ref={closeRef} type="button" onClick={onClose} className="p-close">
          Close <span aria-hidden="true">✕</span>
        </button>
      </div>
      <dl className="p-grid">
        <div>
          <dt>Passenger</dt>
          <dd>You</dd>
        </div>
        <div>
          <dt>Flight</dt>
          <dd>{row.flight}</dd>
        </div>
        <div className="p-wide">
          <dt>To</dt>
          <dd className="p-to">{row.title}</dd>
        </div>
        <div>
          <dt>Operated for</dt>
          <dd>{row.client}</dd>
        </div>
        <div>
          <dt>Gate</dt>
          <dd>{row.gate}</dd>
        </div>
        <div>
          <dt>Year</dt>
          <dd>{row.start === row.end ? row.start : `${row.start}–${String(row.end).slice(2)}`}</dd>
        </div>
        <div>
          <dt>Pilot</dt>
          <dd>{person.first}</dd>
        </div>
      </dl>
      <div className="p-perf" aria-hidden="true" />
      <div className="p-img">
        <Image src={row.image} alt={`${row.title} screenshot`} fill sizes="420px" />
      </div>
      <p className="p-desc">{row.description}</p>
      {row.impact && <p className="p-impact">{row.impact}</p>}
      <a href={row.link} target="_blank" rel="noreferrer" className="p-go">
        Depart to {row.title} <span aria-hidden="true">↗</span>
      </a>
    </motion.aside>
  );
}
