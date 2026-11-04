// What someone typed into the landing page's search box, carried through sign-up into the new-case
// chat so they don't retype it. It may describe a sensitive legal matter, so it stays in this tab's
// sessionStorage and never goes in a URL, where logs and analytics would see it.

const KEY = "ilovelawyer.search-prefill";
/** More than anyone types into a hero search box; keeps a pasted document out of storage. */
const MAX_LENGTH = 2000;

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** The tab's storage, or nothing where it can't be used (the server, or a browser blocking it). */
function tabStorage(): Store | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

/** Keeps the text for after sign-in. Blank clears it, so an abandoned search can't resurface. */
export function saveSearchText(text: string, store = tabStorage()) {
  const trimmed = text.trim().slice(0, MAX_LENGTH);
  try {
    if (trimmed) store?.setItem(KEY, trimmed);
    else store?.removeItem(KEY);
  } catch {
    // Storage full or blocked: they just retype it in the chat.
  }
}

export function readSearchText(store = tabStorage()) {
  try {
    return store?.getItem(KEY) ?? null;
  } catch {
    return null;
  }
}

export function clearSearchText(store = tabStorage()) {
  try {
    store?.removeItem(KEY);
  } catch {
    // Nothing to clear if storage is blocked.
  }
}
