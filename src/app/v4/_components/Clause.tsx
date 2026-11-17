"use client";

import { createContext, useContext, useState } from "react";

type Ctx = { open: string | null; toggle: (id: string) => void };
const C = createContext<Ctx>({ open: null, toggle: () => {} });

/**
 * A numbered clause with a margin. Defined terms in the text open their margin note.
 * Desktop: notes sit in the margin, and the active one is highlighted. Touch: notes are inline footnotes.
 */
export function Clause({
  n,
  title,
  id,
  children,
  notes,
}: {
  n: string;
  title: string;
  id: string;
  children: React.ReactNode;
  notes?: { id: string; term: string; body: React.ReactNode }[];
}) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <C.Provider value={{ open, toggle: (k) => setOpen((o) => (o === k ? null : k)) }}>
      <section className="c-clause" aria-labelledby={`${id}-h`} id={id}>
        <div className="c-text">
          <h2 id={`${id}-h`} className="c-h2">
            <span className="c-n">{n}</span> {title}
          </h2>
          {children}
        </div>
        {notes && (
          <aside className="c-margin" aria-label={`Notes to clause ${n}`}>
            {notes.map((note) => (
              <p key={note.id} id={`note-${note.id}`} className="c-note" data-open={open === note.id || undefined}>
                <span className="c-note-term">“{note.term}”</span> {note.body}
              </p>
            ))}
          </aside>
        )}
      </section>
    </C.Provider>
  );
}

export function Term({ id, children }: { id: string; children: React.ReactNode }) {
  const { open, toggle } = useContext(C);
  return (
    <button
      type="button"
      className="c-term"
      aria-expanded={open === id}
      aria-controls={`note-${id}`}
      onClick={() => toggle(id)}
    >
      {children}
    </button>
  );
}
