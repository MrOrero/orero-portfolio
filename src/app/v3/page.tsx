import { person, projectsByDate, sectorById, years } from "@/content";
import { opt } from "@/lib/intro-key";
import { About } from "./_components/About";
import { boxCode, type Cargo } from "./_components/Box";
import { Contact } from "./_components/Contact";
import { Doors } from "./_components/Doors";
import { Hero } from "./_components/Hero";
import { Manifest } from "./_components/Manifest";
import { Shell } from "./_components/Shell";
import { Voyage, type HullStat } from "./_components/Voyage";
import { Yard } from "./_components/Yard";

const PORTRAIT = "/profile-picture.jpg";
// Years are approximate (see content/projects.ts, TODO confirm with Orero).
const span = (s: number, e: number) => (s === e ? String(s) : `${s}–${String(e).slice(2)}`);

// Which project each stated figure belongs to, so it is painted under that year's bay.
const STAT_HOME: Record<string, string> = { lent: "moniepoint", businesses: "moniepoint", countries: "contract-collab", monthly: "betacare" };

export default function Page() {
  const cargo: Cargo[] = projectsByDate.map((p, i) => ({
    ...p,
    n: String(i + 1).padStart(2, "0"),
    sectorLabel: sectorById[p.sector].label,
    sectorCode: sectorById[p.sector].code,
    years: span(p.start, p.end),
    code: boxCode(p.end, i + 1),
  }));
  const stats: HullStat[] = person.stats.map((s) => ({
    id: s.id,
    label: s.label,
    text: `${s.prefix ?? ""}${s.value.toLocaleString("en-US")}${s.suffix ?? ""}`,
    year: cargo.find((c) => c.slug === STAT_HOME[s.id])?.end ?? years.to,
  }));
  // Every container side uses the 384 rendition; the portrait shows at 828.
  const urls = [...cargo.map((c) => opt(c.image, 384)), opt(PORTRAIT, 828)];
  const yearSpan = `${years.from}–${String(years.to).slice(2)}`;

  return (
    <Shell cargo={cargo} urls={urls} name={person.name}>
      <Hero first={person.first} last={person.last} role={person.role} line={person.short} span={yearSpan} />
      <main id="main">
        <Voyage cargo={cargo} stats={stats} />
        <Doors code="ORZ · BAY 02" label="The yard" />
        <Yard cargo={cargo} />
        <Manifest cargo={cargo} />
        <About name={person.name} role={person.role} bio={person.bio} portrait={PORTRAIT} stack={person.stack} sectors={person.sectors} />
        <Contact name={person.name} email={person.email} links={person.links} span={yearSpan} />
      </main>
    </Shell>
  );
}
