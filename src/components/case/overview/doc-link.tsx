"use client";

import type { Case } from "@/lib/types";

/** A document name that opens the Documents tab on that file. Falls back to plain, unlinked text
 * for a document since removed from the case — the overview's content can be a little behind a
 * deletion until the next Update. */
export function DocLink({ c, documentId, onOpen }: { c: Case; documentId: string | null; onOpen: (id: string) => void }) {
  if (!documentId) return null;
  const doc = c.documents.find((d) => d.id === documentId);
  if (!doc) return null;
  return (
    <button
      type="button"
      onClick={() => onOpen(documentId)}
      className="break-words text-left text-[12px] text-gold underline decoration-from-font underline-offset-2 hover:text-gold-hover"
    >
      {doc.name}
    </button>
  );
}
