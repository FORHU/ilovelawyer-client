// An account with no cases lands on the chat that creates one, not on an empty Cases page. "Lands"
// means the first page of the signed-in session (sign-in, or a reload of /cases); coming back to
// Cases from the chat later shows the page as it is. AppShell records the first page and ends the
// landing at the first move to another page; CasesPage reads it.

let firstPath: string | null = null;
let ended = false;

/** Records the session's first page. Only the first call counts. */
export function markLanding(pathname: string) {
  firstPath ??= pathname;
}

/** Whether the signed-in session is still on the page it opened with, and that page is Cases. */
export function isLanding() {
  return !ended && firstPath === "/cases";
}

export function endLanding() {
  ended = true;
}

/** Forgets the session, so the next sign-in has its own landing. */
export function resetLanding() {
  firstPath = null;
  ended = false;
}
