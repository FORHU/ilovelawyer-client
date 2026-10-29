"use client";

import type { IntakeSource } from "@/lib/types";

/** What one source reads as: "You entered" (the case form), "You said" (opens the chat at that
 * point — the Interview tab has no per-message anchor yet, so this switches tabs only), or
 * "From {document}, p.N" (opens that file in Documents). A document whose name we don't have
 * (removed from the case since) falls back to "From a document". */
function labelFor(s: IntakeSource): string {
  if (s.kind === "CASE_DETAILS") return "You entered";
  if (s.kind === "CLIENT") return "You said";
  const doc = s.documentName ?? "a document";
  return s.page ? `From ${doc}, p.${s.page}` : `From ${doc}`;
}

/**
 * Shows where one intake item came from — the case form you filled in, something you said in
 * the Interview, or a document — so nothing on this page reads as an established fact you never
 * actually stated. The first source is the main label; further sources (a fact confirmed in both
 * the chat and a document, say) show as "+N more" rather than repeating the whole list.
 */
export function SourceBadge({
  sources,
  onOpenChat,
  onOpenDocument,
  tone = "default",
}: {
  tone?: "default" | "warn";
  sources: IntakeSource[];
  onOpenChat: () => void;
  onOpenDocument: (documentId: string) => void;
}) {
  if (!sources.length) return null;
  const link = `underline decoration-from-font underline-offset-2 ${tone === "warn" ? "text-warn-ink hover:text-gold-hover" : "text-gold hover:text-gold-hover"}`;
  const [first, ...rest] = sources;

  return (
    <span className={`inline-flex flex-wrap items-center gap-1 text-[12px] ${tone === "warn" ? "text-warn-ink" : "text-ink-2"}`}>
      {first!.kind === "CASE_DETAILS" ? (
        <span>{labelFor(first!)}</span>
      ) : first!.kind === "CLIENT" ? (
        <button
          type="button"
          onClick={onOpenChat}
          className={link}
        >
          {labelFor(first!)}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => first!.documentId && onOpenDocument(first!.documentId)}
          className={`break-words text-left ${link}`}
        >
          {labelFor(first!)}
        </button>
      )}
      {rest.length > 0 && <span className="text-ink-2" title={rest.map(labelFor).join("; ")}>+{rest.length} more</span>}
    </span>
  );
}
