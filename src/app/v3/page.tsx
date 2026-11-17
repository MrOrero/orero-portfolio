import { person, projects, sectors } from "@/content";
import Trace from "./_components/Trace";

export default function Page() {
  // Bio becomes log lines: one sentence per event.
  const lines = person.bio.split(/(?<=\.)\s+/);
  return (
    <>
      <main id="main">
        <Trace projects={projects} sectors={sectors} name={person.name} role={person.role} />
        <section className="t-logs" aria-labelledby="logs-h">
          <h2 id="logs-h" className="t-h2">
            <span className="t-dim">span.events</span> about
          </h2>
          <ol>
            {lines.map((l, i) => (
              <li key={i}>
                <span className="t-lvl" aria-hidden="true">
                  INFO
                </span>
                <span className="t-svc" aria-hidden="true">
                  orero
                </span>
                <span>{l}</span>
              </li>
            ))}
            <li>
              <span className="t-lvl" aria-hidden="true">
                INFO
              </span>
              <span className="t-svc" aria-hidden="true">
                stack
              </span>
              <span>{person.stack.join(", ")}</span>
            </li>
          </ol>
        </section>
      </main>
      <footer className="t-foot">
        <h2 className="t-h2">
          <span className="t-dim">exporters</span> contact
        </h2>
        <ul>
          {person.links.map((l) => (
            <li key={l.href}>
              <span className="t-dim" aria-hidden="true">
                → {l.label.toLowerCase()}
              </span>
              <a href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                {l.href.replace("mailto:", "").replace(/^https?:\/\/(www\.)?/, "")}
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </>
  );
}
