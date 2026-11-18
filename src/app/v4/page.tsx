import { person, projectsByDate, sectorById, years } from "@/content";
import { opt } from "@/lib/intro-key";
import { About } from "./_components/About";
import { Contact } from "./_components/Contact";
import { Hero } from "./_components/Hero";
import { PullTest } from "./_components/PullTest";
import { Readings } from "./_components/Readings";
import { Results } from "./_components/Results";
import { Shell } from "./_components/Shell";
import { Specimens } from "./_components/Specimens";
import type { Spec } from "./_components/types";

const PORTRAIT = "/profile-picture.jpg";
// Years are approximate (see content/projects.ts, TODO confirm with Orero).
const span = (s: number, e: number) => (s === e ? String(s) : `${s}–${String(e).slice(2)}`);

export default function Page() {
  const specs: Spec[] = projectsByDate.map((p, i) => ({
    ...p,
    n: String(i + 1).padStart(2, "0"),
    sectorLabel: sectorById[p.sector].label,
    sectorCode: sectorById[p.sector].code,
    years: span(p.start, p.end),
  }));
  // Project pictures first, in title order (the intro counts these), then the portrait.
  const urls = [...specs.map((s) => opt(s.image, 384)), opt(PORTRAIT, 828)];

  return (
    <Shell urls={urls} titles={specs.map((s) => s.title)} name={person.name}>
      <Hero first={person.first} last={person.last} role={person.role} line={person.short} />
      <main id="main">
        <Results specs={specs} />
        <PullTest word={person.first} />
        <Readings stats={person.stats} />
        <Specimens specs={specs} />
        <About name={person.name} role={person.role} bio={person.bio} portrait={PORTRAIT} stack={person.stack} sectors={person.sectors} />
        <Contact name={person.name} email={person.email} links={person.links} span={`${years.from}–${String(years.to).slice(2)}`} />
      </main>
    </Shell>
  );
}
