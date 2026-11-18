import { person, projectsByDate, sectorById, years } from "@/content";
import { opt } from "@/lib/intro-key";
import { About } from "./_components/About";
import type { DeckItem } from "./_components/Card";
import { Contact } from "./_components/Contact";
import { Deal } from "./_components/Deal";
import { Deck } from "./_components/Deck";
import { Hero } from "./_components/Hero";
import { Shell } from "./_components/Shell";
import { StatFlip } from "./_components/StatFlip";

const PORTRAIT = "/profile-picture.jpg";
// Years are approximate (see content/projects.ts, TODO confirm with Orero).
const span = (s: number, e: number) => (s === e ? String(s) : `${s}–${String(e).slice(2)}`);

export default function Page() {
  const items: DeckItem[] = projectsByDate.map((p, i) => ({
    ...p,
    n: String(i + 1).padStart(4, "0"),
    sectorLabel: sectorById[p.sector].label,
    years: span(p.start, p.end),
  }));
  // Every card face uses the 384 and 640 renditions; the portrait shows at 828.
  const urls = [...items.flatMap((p) => [opt(p.image, 640), opt(p.image, 384)]), opt(PORTRAIT, 828)];

  return (
    <Shell urls={urls} titles={items.map((p) => p.title)} name={person.name}>
      <Hero
        first={person.first}
        last={person.last}
        role={person.role}
        line={person.short}
        span={`${years.from}–${String(years.to).slice(2)}`}
        count={items.length}
      />
      <main id="main">
        <Deal items={items} />
        <Deck items={items} />
        <StatFlip stats={person.stats} />
        <About name={person.name} role={person.role} bio={person.bio} portrait={PORTRAIT} stack={person.stack} sectors={person.sectors} />
        <Contact name={person.name} role={person.role} email={person.email} links={person.links} />
      </main>
    </Shell>
  );
}
