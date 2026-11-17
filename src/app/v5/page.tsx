import { person, projectsByDate, sectors } from "@/content";
import Switchboard from "./_components/Switchboard";

export default function Page() {
  // Only sectors that have work in them get a jack.
  const used = sectors.filter((s) => projectsByDate.some((p) => p.sector === s.id));
  return (
    <>
      <header className="s-plate">
        <div className="s-screws" aria-hidden="true" />
        <p className="s-plate-kicker">Exchange no. 1 · {used.length} sectors · {projectsByDate.length} lines</p>
        <h1 className="s-name">{person.name}</h1>
        <p className="s-plate-role">
          {person.role}. One operator, connected to whichever sector needs building.
        </p>
      </header>
      <main id="main" className="s-main">
        <Switchboard projects={projectsByDate} sectors={used} />
      </main>
      <section className="s-directory" aria-labelledby="dir-h">
        <h2 id="dir-h">Directory</h2>
        <p>{person.bio}</p>
        <ul className="s-trunks" aria-label="Contact">
          {person.links.map((l) => (
            <li key={l.href}>
              <span className="s-dim">Trunk · {l.label}</span>
              <a href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                {l.href.replace("mailto:", "").replace(/^https?:\/\/(www\.)?/, "")}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
