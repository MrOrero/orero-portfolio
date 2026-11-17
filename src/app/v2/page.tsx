import { person, projectsByDate } from "@/content";
import Arrivals from "./_components/Arrivals";
import Board from "./_components/Board";
import Clock from "./_components/Clock";
import Hero from "./_components/Hero";

export default function Page() {
  return (
    <>
      <header className="d-head" data-tone="board">
        <div className="d-bar">
          <span className="d-title">
            Departures <span lang="fr">Départs</span>
          </span>
          <Clock />
        </div>
        <Hero />
        <p className="d-role">
          {person.role} <span aria-hidden="true">·</span> carrying products from first commit to production since 2020
        </p>
      </header>
      <main id="main" data-tone="board" className="d-main">
        <h2 className="sr-only">Projects</h2>
        <Board projects={projectsByDate} />
        <p className="d-legend">
          Point at a flight to read its remarks. Select one to get a boarding pass.
        </p>
      </main>
      <section className="d-info" data-tone="gate" aria-labelledby="info-h">
        <h2 id="info-h">Passenger information</h2>
        <p>{person.bio}</p>
        <p className="d-stack">{person.stack.join("  /  ")}</p>
      </section>
      <footer className="d-foot" data-tone="board">
        <h2 className="d-foot-h">Arrivals</h2>
        <p className="d-foot-sub">Inbound messages are welcome on every channel.</p>
        <Arrivals />
      </footer>
    </>
  );
}
