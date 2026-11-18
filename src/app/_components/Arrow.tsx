/**
 * Outbound-link arrow, drawn rather than typed: iOS renders the "↗" character as a
 * colour emoji. Sized to the text (1em) and painted in the text colour.
 */
export function Arrow() {
  return (
    <svg className="s-arrow" viewBox="0 0 16 16" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" aria-hidden="true">
      <path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6" />
    </svg>
  );
}
