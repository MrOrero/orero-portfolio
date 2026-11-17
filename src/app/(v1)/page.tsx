import { person, projects, sectorById, years } from "@/content";
import Statement from "./_components/Statement";

export default function Page() {
  // A statement reads oldest to newest: the balance builds up to today.
  const rows = [...projects].sort((a, b) => a.start - b.start || a.end - b.end);
  return (
    <>
      <header className="l-head" data-tone="paper">
        <div className="l-wrap">
          <p className="l-kicker">
            <span>Statement of account</span>
            <span>
              Period {years.from}–{years.to}
            </span>
          </p>
          <h1 className="l-name">
            <span>{person.first}</span> <span>{person.last}</span>
          </h1>
          <dl className="l-holder">
            <div>
              <dt>Account holder</dt>
              <dd>{person.name}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{person.role}</dd>
            </div>
            <div>
              <dt>Currency</dt>
              <dd>Shipped software</dd>
            </div>
            <div>
              <dt>Entries</dt>
              <dd>{projects.length}</dd>
            </div>
          </dl>
          <p className="l-memo">
            <span className="l-memo-label">Memo</span>
            {person.short}
          </p>
          <p className="l-cue">Entries post as you scroll. The running balance below keeps the total.</p>
        </div>
      </header>
      <main id="main">
        <Statement
          rows={rows.map((p) => ({ ...p, sectorLabel: sectorById[p.sector].label }))}
          bio={person.bio}
        />
      </main>
      <footer className="l-foot" data-tone="paper">
        <div className="l-wrap">
          <h2 className="l-h2">Remit to</h2>
          <ul className="l-remit">
            {person.links.map((l) => (
              <li key={l.href}>
                <span>{l.label}</span>
                <a href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                  {l.href.replace("mailto:", "").replace(/^https?:\/\/(www\.)?/, "")}
                </a>
              </li>
            ))}
          </ul>
          <p className="l-fine">
            This statement is a record of work shipped by {person.name}. Figures are as stated by the clients and products
            listed. Errors and omissions excepted.
          </p>
        </div>
      </footer>
    </>
  );
}
