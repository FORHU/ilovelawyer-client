"use client";

import { useState } from "react";
import { BottomSheet, SheetRow } from "@/components/mobile/bottom-sheet";
import { useDevice } from "@/components/device/device-provider";
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
  const device = useDevice();
  if (!sources.length) return null;
  if (device === "mobile") return <SourceChip sources={sources} onOpenChat={onOpenChat} onOpenDocument={onOpenDocument} tone={tone} />;
  const link =`underline decoration-from-font underline-offset-2 ${tone === "warn" ? "text-warn-ink hover:text-gold-hover" : "text-gold hover:text-gold-hover"}`;
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

/** The phone's version: where it came from as one chip with a 44px tap area, and every source in a
 * sheet (the desktop's "+N more" is a hover tooltip, which a finger can't read). A source that is
 * only the case form has nowhere to go, so it stays plain text. */
function SourceChip({
  sources,
  onOpenChat,
  onOpenDocument,
  tone,
}: {
  sources: IntakeSource[];
  tone: "default" | "warn";
  onOpenChat: () => void;
  onOpenDocument: (documentId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const openable = sources.filter((x) => x.kind === "CLIENT" || x.documentId);
  const color = tone === "warn" ? "text-warn-ink" : "text-ink-2";
  if (!openable.length) return <span className={`text-[12.5px] ${color}`}>{labelFor(sources[0]!)}</span>;

  const go = (x: IntakeSource) => {
    setOpen(false);
    if (x.kind === "CLIENT") onOpenChat();
    else if (x.documentId) onOpenDocument(x.documentId);
  };

  return (
    <>
      {/* The negative margin keeps the line compact while the button is 44px to tap. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-no-tap
        className={`-my-3 inline-flex min-h-11 max-w-full items-center gap-1 self-start text-left text-[12.5px] ${tone === "warn" ? "text-warn-ink" : "text-gold"}`}
      >
        <span className="truncate underline decoration-from-font underline-offset-2">{labelFor(sources[0]!)}</span>
        {sources.length > 1 && <span className={`shrink-0 ${color}`}>+{sources.length - 1} more</span>}
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Where this came from">
        {sources.map((x, i) =>
          x.kind === "CLIENT" || x.documentId ? (
            <SheetRow key={i} onSelect={() => go(x)}>
              {labelFor(x)}
            </SheetRow>
          ) : (
            <div key={i} className="flex min-h-[52px] items-center px-3 text-[16px] text-ink-2">
              {labelFor(x)}
            </div>
          ),
        )}
      </BottomSheet>
    </>
  );
}
