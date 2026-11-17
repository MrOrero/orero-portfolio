"use client";
import { useState } from "react";
import Flap from "./Flap";
import { person } from "@/content";
import { usePrefersReducedMotion } from "@/lib/motion";

export default function Arrivals() {
  const reduced = usePrefersReducedMotion();
  const [hot, setHot] = useState<number | null>(null);
  return (
    <ul className="d-arrivals">
      {person.links.map((l, i) => (
        <li key={l.href}>
          <a
            href={l.href}
            target={l.href.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            onPointerEnter={() => setHot(i)}
            onPointerLeave={() => setHot(null)}
            onFocus={() => setHot(i)}
            onBlur={() => setHot(null)}
          >
            <Flap text={l.label} width={8} steps={reduced ? 0 : 4} reduced={reduced} />
            <span className="d-arr-addr">{l.href.replace("mailto:", "").replace(/^https?:\/\/(www\.)?/, "")}</span>
            <Flap text={hot === i ? "GO NOW" : "OPEN"} width={6} steps={reduced ? 0 : 4} reduced={reduced} className="d-arr-status" />
          </a>
        </li>
      ))}
    </ul>
  );
}
