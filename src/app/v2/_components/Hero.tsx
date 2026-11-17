"use client";
import Flap from "./Flap";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/motion";
import { person } from "@/content";

export default function Hero() {
  const reduced = usePrefersReducedMotion();
  const touch = useMediaQuery("(hover: none)");
  return (
    <h1 className="d-name">
      <Flap text={person.first} width={5} steps={touch ? 2 : 12} reduced={reduced} interactive />
      <Flap text={person.last} width={5} delay={260} steps={touch ? 2 : 12} reduced={reduced} interactive />
    </h1>
  );
}
