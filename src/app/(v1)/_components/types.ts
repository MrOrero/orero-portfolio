import type { Project } from "@/content";

/** A project as it prints on the receipt. */
export type RunItem = Project & { n: string; sectorLabel: string; years: string };
