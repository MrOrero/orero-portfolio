"use client";

import { MotionConfig } from "motion/react";
import { Cursor } from "./Cursor";
import { Intro, type IntroItem } from "./Intro";

/** Client wrapper: reduced-motion for every motion component, the intro, the cursor. */
export function Shell({
  items,
  extra,
  name,
  children,
}: {
  items: IntroItem[];
  extra: string[];
  name: string;
  children: React.ReactNode;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <Intro items={items} extra={extra} name={name}>
        {children}
      </Intro>
      <Cursor />
    </MotionConfig>
  );
}
