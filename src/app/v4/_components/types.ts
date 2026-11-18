import type { Project } from "@/content";

/** A project as a test specimen. */
export type Spec = Project & { n: string; sectorLabel: string; sectorCode: string; years: string };
