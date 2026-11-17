"use client";
import { useEffect, useState } from "react";
import Flap from "./Flap";
import { usePrefersReducedMotion } from "@/lib/motion";

export default function Clock() {
  const reduced = usePrefersReducedMotion();
  const [t, setT] = useState("");
  useEffect(() => {
    const f = () => setT(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
    f();
    const id = setInterval(f, 10000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="d-clock">
      <span className="d-clock-label">Your time</span>
      <Flap text={t} width={5} steps={3} reduced={reduced} />
    </span>
  );
}
