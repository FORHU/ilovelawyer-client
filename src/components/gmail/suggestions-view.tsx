"use client";

import { ArrowLeft, RotateCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import type { useSuggestGmailMutation } from "@/lib/gmail/queries";
import { MessageRow } from "./message-row";

type SuggestMutation = ReturnType<typeof useSuggestGmailMutation>;

/** What the AI reads, said before it runs (EPIC #982, #989). */
export const SUGGEST_PRIVACY_NOTE =
  "The AI uses what it knows about your case to search your Gmail, then reads only the sender, subject and a short preview of what it finds. Nothing is added to your case until you choose it.";

/** The invitation at the top of the search view. */
export function SuggestCard({ onSuggest, hasResults }: { onSuggest: () => void; hasResults: boolean }) {
  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-subtle px-4 py-3.5 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 gap-3">
        <Sparkles size={16} aria-hidden className="mt-0.5 shrink-0 text-gold" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-[13.5px] font-semibold text-ink">Let AI find emails about this case</p>
          <p className="text-[12px] leading-[1.5] text-ink-2">{SUGGEST_PRIVACY_NOTE}</p>
        </div>
      </div>
      <Button variant="dark" onClick={onSuggest} className="shrink-0 self-start sm:self-center">
        <Sparkles size={14} aria-hidden />
        {hasResults ? "See AI suggestions" : "Suggest by AI"}
      </Button>
    </section>
  );
}

/**
 * "Suggest by AI" results (#984, #988): the emails the case's Intake judged relevant, most
 * clearly related first, each with the AI's reason. Opening one leads to the same email view and
 * "Add to this case" as a search result. The results stay until the client runs it again.
 */
export function SuggestionsView({ suggest, onBack, onOpen }: { suggest: SuggestMutation; onBack: () => void; onOpen: (id: string) => void }) {
  const matches = suggest.data?.matches ?? [];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="quiet" onClick={onBack} className="!px-0">
          <ArrowLeft size={14} aria-hidden />
          Back to search
        </Button>
        {!suggest.isPending && (
          <Button variant="soft" size="sm" onClick={() => suggest.mutate()} className="!h-[34px] !px-3.5">
            <RotateCw size={13} aria-hidden />
            Suggest again
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Sparkles size={16} aria-hidden className="text-gold" />
        <h3 className="text-[15px] font-semibold text-ink">Suggested by AI</h3>
      </div>

      {suggest.isPending ? (
        <p className="py-6 text-center text-[13px] leading-[1.6] text-ink-2">
          Looking through your Gmail for emails about this case…
          <br />
          This can take up to half a minute.
        </p>
      ) : suggest.error ? (
        <ErrorBox message={(suggest.error as Error).message} />
      ) : matches.length === 0 ? (
        <p className="py-6 text-center text-[13px] leading-[1.6] text-ink-2">
          The AI didn’t find emails about this case
          {suggest.data?.searched ? ` among the ${suggest.data.searched} it looked at` : ""}. Try searching yourself, or tell the AI more about who’s involved.
        </p>
      ) : (
        <>
          <p className="text-[12px] text-muted">
            {matches.length} of the {suggest.data!.searched} emails it looked at. The AI can miss emails or include unrelated ones, so check before adding.
          </p>
          <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-white">
            {matches.map((m) => (
              <MessageRow
                key={m.id}
                row={m}
                onOpen={onOpen}
                extra={
                  <span className="mt-1 flex items-start gap-2 text-[12.5px] leading-[1.5]">
                    <span
                      className={`shrink-0 rounded-full px-2 py-px text-[11px] font-medium ${
                        m.relevance === "high" ? "bg-success-bg text-success" : "bg-subtle text-ink-2"
                      }`}
                    >
                      {m.relevance === "high" ? "Likely related" : "Possibly related"}
                    </span>
                    <span className="text-ink">{m.reason}</span>
                  </span>
                }
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
