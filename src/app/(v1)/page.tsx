import { person, projectsByDate, sectorById, years } from "@/content";
import { opt } from "@/lib/intro-key";
import { Hero } from "./_components/Hero";
import { Memo } from "./_components/Memo";
import { PrintRun } from "./_components/PrintRun";
import { Shell } from "./_components/Shell";
import { Tear } from "./_components/Tear";
import { Totals } from "./_components/Totals";
import type { RunItem } from "./_components/types";

const PORTRAIT = "/profile-picture.jpg";

// Years are approximate (see content/projects.ts, TODO confirm with Orero).
const span = (s: number, e: number) => (s === e ? String(s) : `${s}–${String(e).slice(2)}`);

export default function Page() {
  const items: RunItem[] = projectsByDate.map((p, i) => ({
    ...p,
    n: String(i + 1).padStart(2, "0"),
    sectorLabel: sectorById[p.sector].label,
    years: span(p.start, p.end),
  }));

  return (
    <Shell
      items={items.map((p) => ({ src: p.image, title: p.title }))}
      extra={[opt(PORTRAIT, 384), opt(PORTRAIT, 828)]}
      name={person.name}
    >
      <Hero
        first={person.first}
        last={person.last}
        role={person.role}
        line={person.short}
        span={`${years.from}–${years.to}`}
        count={items.length}
      />
      <main id="main">
        <PrintRun items={items} />
        <Totals stats={person.stats} />
        <Memo bio={person.bio} portrait={PORTRAIT} name={person.name} stack={person.stack} sectors={person.sectors} />
        <Tear name={person.name} email={person.email} links={person.links} />
      </main>
    </Shell>
  );
}
