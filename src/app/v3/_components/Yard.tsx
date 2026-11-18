"use client";

import Matter from "matter-js";
import { AnimatePresence } from "motion/react";
import { useReduced } from "@/lib/motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Box, type Cargo } from "./Box";
import { BoxView } from "./BoxView";
import { Words } from "./Words";

const { Engine, Bodies, Body, Composite, Constraint, Sleeping } = Matter;
const WALL = 200;
const DROP_EVERY = 110;
const CLICK_PX = 6;

type Grab = { id: number; con: Matter.Constraint; x0: number; y0: number; moved: boolean };

/**
 * The yard. Every container is a rigid body: they fall in when the yard comes
 * into view, and you can grab one, swing it and throw it into the stack. A
 * press without a drag opens it. Keyboard: Tab to a container, arrows shove it,
 * Enter opens it. The simulation sleeps when everything has settled and stops
 * entirely off screen. With reduced motion the yard is a tidy grid.
 */
export function Yard({ cargo }: { cargo: Cargo[] }) {
  const stage = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLLIElement | null)[]>([]);
  const reduce = useReduced();
  const [open, setOpen] = useState<Cargo | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const api = useRef<{ shake: () => void; restack: () => void; shove: (i: number, key: string) => boolean; grab: (i: number, e: React.PointerEvent) => void } | null>(null);
  const dragged = useRef(false);

  useEffect(() => {
    const el = stage.current;
    if (!el || reduce) return;
    const engine = Engine.create({ enableSleeping: true, gravity: { x: 0, y: 1.1 } });
    const world = engine.world;
    let W = 0;
    let H = 0;
    let bw = 0;
    let bh = 0;
    let walls: Matter.Body[] = [];
    const bodies: (Matter.Body | null)[] = cargo.map(() => null);
    let frame = 0;
    let visible = false;
    let dropTimer = 0;
    let grab: Grab | null = null;

    const build = () => {
      W = el.clientWidth;
      H = el.clientHeight;
      const first = els.current[0];
      bw = first?.offsetWidth ?? 200;
      bh = first?.offsetHeight ?? 86;
      if (walls.length) Composite.remove(world, walls);
      const o = { isStatic: true, friction: 0.8 };
      walls = [
        Bodies.rectangle(W / 2, H + WALL / 2, W + WALL * 2, WALL, o),
        Bodies.rectangle(-WALL / 2, H / 2 - H, WALL, H * 4, o),
        Bodies.rectangle(W + WALL / 2, H / 2 - H, WALL, H * 4, o),
      ];
      Composite.add(world, walls);
      for (const b of bodies) {
        if (!b) continue;
        Sleeping.set(b, false);
        Body.setPosition(b, { x: Math.min(W - bw / 2, Math.max(bw / 2, b.position.x)), y: Math.min(H - bh / 2, b.position.y) });
      }
    };

    const paint = () => {
      bodies.forEach((b, i) => {
        const node = els.current[i];
        if (!b || !node) return;
        node.style.transform = `translate3d(${(b.position.x - bw / 2).toFixed(1)}px,${(b.position.y - bh / 2).toFixed(1)}px,0) rotate(${b.angle.toFixed(4)}rad)`;
      });
    };

    const settled = () => !grab && bodies.every((b) => b && b.isSleeping);
    const loop = () => {
      frame = 0;
      Engine.update(engine, 1000 / 60);
      paint();
      if (visible && !settled()) frame = requestAnimationFrame(loop);
    };
    const wake = () => {
      if (visible && !frame) frame = requestAnimationFrame(loop);
    };

    const drop = (i: number) => {
      const cols = Math.max(1, Math.floor(W / (bw * 1.05)));
      const x = bw / 2 + ((i % cols) + 0.5) * ((W - bw) / cols) + (Math.random() - 0.5) * bw * 0.3;
      const b = Bodies.rectangle(x, -bh * (1.2 + Math.floor(i / cols) * 1.4), bw, bh, {
        chamfer: { radius: 3 },
        friction: 0.7,
        frictionStatic: 1,
        restitution: 0.08,
        density: 0.003,
        angle: (Math.random() - 0.5) * 0.5,
        sleepThreshold: 40,
      });
      bodies[i] = b;
      Composite.add(world, b);
      els.current[i]?.setAttribute("data-on", "");
      wake();
    };
    const dropAll = () => {
      let i = 0;
      clearInterval(dropTimer);
      dropTimer = window.setInterval(() => {
        if (i >= cargo.length) return clearInterval(dropTimer);
        drop(i);
        i += 1;
      }, DROP_EVERY);
    };

    const local = (e: { clientX: number; clientY: number }) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onMove = (e: PointerEvent) => {
      if (!grab) return;
      const p = local(e);
      if (Math.hypot(e.clientX - grab.x0, e.clientY - grab.y0) > CLICK_PX) grab.moved = true;
      grab.con.pointA = p;
      const b = bodies[grab.id];
      if (b) Sleeping.set(b, false);
      wake();
    };
    const onUp = () => {
      if (!grab) return;
      Composite.remove(world, grab.con);
      dragged.current = grab.moved;
      grab = null;
      delete document.documentElement.dataset.sHolding;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      wake();
    };

    api.current = {
      grab(i, e) {
        const b = bodies[i];
        if (!b) return;
        const p = local(e);
        const off = Matter.Vector.rotate(Matter.Vector.sub(p, b.position), -b.angle);
        const con = Constraint.create({ pointA: p, bodyB: b, pointB: off, stiffness: 0.18, damping: 0.08, length: 0 });
        Composite.add(world, con);
        Sleeping.set(b, false);
        grab = { id: i, con, x0: e.clientX, y0: e.clientY, moved: false };
        dragged.current = false;
        document.documentElement.dataset.sHolding = "";
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
        wake();
      },
      shove(i, key) {
        const b = bodies[i];
        if (!b) return false;
        const v = { ArrowLeft: { x: -9, y: -4 }, ArrowRight: { x: 9, y: -4 }, ArrowUp: { x: 0, y: -16 }, ArrowDown: { x: 0, y: 6 } }[key];
        if (!v) return false;
        Sleeping.set(b, false);
        Body.setVelocity(b, v);
        Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.15);
        wake();
        return true;
      },
      shake() {
        for (const b of bodies) {
          if (!b) continue;
          Sleeping.set(b, false);
          Body.setVelocity(b, { x: (Math.random() - 0.5) * 14, y: -8 - Math.random() * 12 });
          Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.3);
        }
        wake();
      },
      restack() {
        clearInterval(dropTimer);
        bodies.forEach((b, i) => {
          if (b) Composite.remove(world, b);
          bodies[i] = null;
          els.current[i]?.removeAttribute("data-on");
        });
        dropAll();
      },
    };

    build();
    let started = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !started && entry.intersectionRatio > 0.2) {
          started = true;
          dropAll();
        }
        if (visible) wake();
        else if (frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      },
      { threshold: [0, 0.25] },
    );
    io.observe(el);

    let lastW = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      build();
      wake();
    };
    window.addEventListener("resize", onResize);

    return () => {
      api.current = null;
      io.disconnect();
      clearInterval(dropTimer);
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      onUp();
      Engine.clear(engine);
      Composite.clear(world, false);
    };
  }, [cargo, reduce]);

  return (
    <section id="yard" className="s-yard" aria-labelledby="s-yard-title">
      <div className="s-wrap s-yard-head">
        <p className="s-kicker">02 · The yard</p>
        <Words id="s-yard-title" className="s-h2" text="Pick one up. They're heavier than they look." />
        <p className="s-lede">
          Grab a container and throw it, or press one to open it. On a keyboard, Tab to a container, use the arrows to shove it and Enter to open it.
        </p>
        <div className="s-yard-tools">
          <button type="button" className="s-btn" onClick={() => api.current?.shake()} data-cursor="Shake" disabled={!!reduce}>
            Shake the yard
          </button>
          <button type="button" className="s-btn" onClick={() => api.current?.restack()} data-cursor="Restack" disabled={!!reduce}>
            Restack
          </button>
        </div>
      </div>
      <div ref={stage} className="s-yard-stage" data-static={reduce ? "" : undefined}>
        <ul className="s-yard-list">
          {cargo.map((c, i) => (
            <li
              key={c.slug}
              ref={(node) => {
                els.current[i] = node;
              }}
              className="s-yard-item"
            >
              <button
                type="button"
                className="s-box-btn"
                data-cursor="Grab"
                aria-label={`${c.title}, ${c.sectorLabel}, ${c.years}. Open`}
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  api.current?.grab(i, e);
                }}
                onKeyDown={(e) => {
                  if (api.current?.shove(i, e.key)) e.preventDefault();
                }}
                onClick={() => {
                  if (dragged.current) {
                    dragged.current = false;
                    return;
                  }
                  setOpen(c);
                }}
              >
                <Box c={c} />
              </button>
            </li>
          ))}
        </ul>
        <span className="s-yard-ground" aria-hidden="true" />
      </div>
      <AnimatePresence>{open && <BoxView key={open.slug} c={open} onClose={close} />}</AnimatePresence>
    </section>
  );
}
