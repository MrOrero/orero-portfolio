import Image from "next/image";
import { person, projectsByDate, sectorById } from "@/content";
import { Clause, Term } from "./_components/Clause";
import { OreroSignature, Seal, SignaturePad } from "./_components/Signatures";

export default function Page() {
  return (
    <main id="main" className="c-doc">
      <header className="c-title">
        <p className="c-kicker">Agreement for the building of software</p>
        <h1 className="c-h1">{person.name}</h1>
        <p className="c-between">
          made between <strong>{person.name}</strong> (the <Q>Engineer</Q>) and <strong>you</strong>, whoever is reading this
          (the <Q>Client</Q>).
        </p>
        <div className="c-seal-top">
          <Seal still />
        </div>
      </header>

      <section className="c-recitals" aria-labelledby="rec-h">
        <h2 id="rec-h" className="c-small-h">
          Recitals
        </h2>
        <p>
          <span className="c-whereas">Whereas</span> the Engineer builds products end to end, and most of them are the systems that
          move money, contracts and people for organisations that cannot afford for them to break;
        </p>
        <p>
          <span className="c-whereas">And whereas</span> much of that work is in-house software, used every day by people who never
          see who built it;
        </p>
        <p>
          <span className="c-whereas">Now therefore</span> the parties agree as follows.
        </p>
      </section>

      <Clause
        n="1."
        title="Parties and definitions"
        id="parties"
        notes={[
          { id: "engineer", term: "Engineer", body: <>{person.role}. Co-founder of Yadsale. Formerly Engineering Lead at NXT.</> },
          { id: "endtoend", term: "End to end", body: <>From the interface people touch to the services and data behind it. No hand-offs.</> },
        ]}
      >
        <p>
          1.1 The <Term id="engineer">Engineer</Term> is {person.name}, a {person.role.toLowerCase()} who works{" "}
          <Term id="endtoend">end to end</Term> in TypeScript, Node.js, React and Next.js, with Java and Spring Boot when the work calls for it.
        </p>
        <p>1.2 The Client is the reader, and any organisation the reader represents.</p>
      </Clause>

      <Clause
        n="2."
        title="Scope of services"
        id="scope"
        notes={[
          { id: "sectors", term: "Sectors", body: <>{person.sectors.join(", ")}, and events for ESPN, Capital One and Nickelodeon.</> },
          { id: "instruments", term: "Instruments", body: <>{person.stack.join(", ")}.</> },
        ]}
      >
        <p>
          2.1 The Engineer shall design, build and ship software across the <Term id="sectors">Sectors</Term>, using the{" "}
          <Term id="instruments">Instruments</Term>.
        </p>
        <p>2.2 Without limiting clause 2.1, the services include payments and lending, contract lifecycle, telehealth, registration and identity, and event logistics.</p>
      </Clause>

      <Clause n="3." title="Representations" id="reps">
        <p className="c-lede">The Engineer represents that the following figures are true, as stated by the products concerned.</p>
        {person.stats.map((s, i) => (
          <p key={s.id}>
            3.{i + 1} {s.label}:{" "}
            <strong className="c-figure">
              {s.prefix}
              {s.value.toLocaleString("en-US")}
              {s.suffix}
            </strong>
            .
          </p>
        ))}
      </Clause>

      <section className="c-clause c-schedule" aria-labelledby="sched-h" id="schedule">
        <div className="c-text">
          <h2 id="sched-h" className="c-h2">
            <span className="c-n">4.</span> Prior works <span className="c-sched">(Schedule A)</span>
          </h2>
          <p className="c-lede">The works listed below form part of this agreement as evidence of capability. Exhibits are attached in the margin.</p>
        </div>
        <ol className="c-works">
          {projectsByDate.map((p, i) => (
            <li key={p.slug} className="c-work">
              <div className="c-text">
                <h3 className="c-h3">
                  <span className="c-n">A.{i + 1}</span> {p.title}
                </h3>
                <p className="c-work-meta">
                  for {p.client} · {sectorById[p.sector].label} · {p.start === p.end ? p.start : `${p.start}–${p.end}`}
                </p>
                <p>{p.description}</p>
                {p.impact && <p className="c-impact">{p.impact}</p>}
                <a href={p.link} target="_blank" rel="noreferrer" className="c-exhibit-link">
                  Inspect the work <span aria-hidden="true">↗</span>
                </a>
              </div>
              <figure className="c-exhibit">
                <div className="c-exhibit-img">
                  <Image src={p.image} alt={`${p.title} screenshot`} fill sizes="(max-width: 899px) 90vw, 240px" />
                </div>
                <figcaption>Exhibit A.{i + 1}</figcaption>
              </figure>
            </li>
          ))}
        </ol>
      </section>

      <section className="c-clause c-exec" aria-labelledby="exec-h" id="execution">
        <div className="c-text">
          <h2 id="exec-h" className="c-h2">
            <span className="c-n">5.</span> Execution
          </h2>
          <p>
            5.1 This agreement takes effect when the Client signs below. Signing commits the Client to nothing except a conversation
            with the Engineer at{" "}
            <a href={`mailto:${person.email}`} className="c-inline-link">
              {person.email}
            </a>
            .
          </p>
          <div className="c-sigs">
            <div className="c-sigblock">
              <OreroSignature />
              <p className="c-witness">The Engineer</p>
            </div>
            <div className="c-sigblock">
              <SignaturePad />
            </div>
          </div>
          <p className="c-also">
            Also reachable at{" "}
            {person.links
              .filter((l) => l.href.startsWith("http"))
              .map((l, i) => (
                <span key={l.href}>
                  {i > 0 && " and "}
                  <a href={l.href} target="_blank" rel="noreferrer" className="c-inline-link">
                    {l.label}
                  </a>
                </span>
              ))}
            .
          </p>
        </div>
      </section>
    </main>
  );
}

function Q({ children }: { children: React.ReactNode }) {
  return <span className="c-defined">“{children}”</span>;
}
