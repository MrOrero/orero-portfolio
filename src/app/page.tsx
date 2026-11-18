import { careerSpan, person, projectsByDate, sectorById, yearSpan } from "@/content";
import { opt } from "@/lib/intro-key";
import { About } from "./_components/About";
import { boxCode, type Cargo } from "./_components/Box";
import { Contact } from "./_components/Contact";
import { Doors } from "./_components/Doors";
import { Hero } from "./_components/Hero";
import { Manifest } from "./_components/Manifest";
import { Shell } from "./_components/Shell";
import { Voyage } from "./_components/Voyage";
import { Yard } from "./_components/Yard";

const PORTRAIT = "/profile-picture.jpg";

export default function Page() {
  const cargo: Cargo[] = projectsByDate.map((p, i) => ({
    ...p,
    n: String(i + 1).padStart(2, "0"),
    sectorLabel: sectorById[p.sector].label,
    sectorCode: sectorById[p.sector].code,
    years: yearSpan(p.start, p.end),
    code: boxCode(p.end, i + 1),
  }));
  // Every container side uses the 384 rendition; the portrait shows at 828.
  const urls = [...cargo.map((c) => opt(c.image, 384)), opt(PORTRAIT, 828)];
  
  return (
    <Shell cargo={cargo} urls={urls} name={person.name}>
      <Hero first={person.first} last={person.last} role={person.role} line={person.short} span={careerSpan} />
      <main id="main">
        <Voyage cargo={cargo} />
        <Doors code="SUPER SHIPPER · BAY 02" label="The yard" />
        <Yard cargo={cargo} />
        <Manifest cargo={cargo} />
        <About name={person.name} role={person.role} bio={person.bio} portrait={PORTRAIT} stack={person.stack} sectors={person.sectors} />
        <Contact name={person.name} email={person.email} links={person.links} span={careerSpan} />
      </main>
    </Shell>
  );
}
