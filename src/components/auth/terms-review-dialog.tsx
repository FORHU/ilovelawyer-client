"use client";

import { useEffect, useRef, useState } from "react";
import { Ban, ChevronDown } from "lucide-react";
import { getClientTerms } from "@/lib/auth/terms";
import { currentTenantCode } from "@/lib/tenant/resolve-host";

// A couple of pixels of slack: some browsers report fractional scroll heights
// that never quite reach 0 even when the content is fully visible.
const SCROLL_END_THRESHOLD_PX = 4;

/** Terms of Service the user must scroll to the end of before they can agree. */
export function TermsReviewDialog({
  open,
  onOpenChange,
  onAgree,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgree: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [reachedEnd, setReachedEnd] = useState(false);
  // The governing law follows the site's Tenant, read from the host. Only while open, which never
  // happens during server rendering, so the server and first client render agree.
  const terms = getClientTerms(open ? currentTenantCode() : null);

  // Native <dialog> gives the focus trap, Escape and an inert background.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Re-require a full read each time the dialog opens, and check once up front
  // in case the content is short enough to need no scrolling at all.
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    setReachedEnd(!!el && el.scrollHeight - el.clientHeight <= SCROLL_END_THRESHOLD_PX);
  }, [open]);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight <= SCROLL_END_THRESHOLD_PX) {
      setReachedEnd(true);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={() => onOpenChange(false)}
      onClick={(e) => {
        if (e.target === dialogRef.current) onOpenChange(false);
      }}
      aria-labelledby="terms-title"
      className="m-auto max-h-[85vh] w-[calc(100%-2rem)] max-w-2xl flex-col rounded-lg border border-line bg-surface p-0 text-ink shadow-modal backdrop:bg-black/50 open:flex"
    >
      <header className="flex flex-col gap-1.5 border-b border-line px-6 pb-4 pt-6">
        <h2 id="terms-title" className="font-display text-2xl font-normal">
          {terms.title}
        </h2>
        <p className="text-sm text-muted">{terms.effectiveDate}</p>
      </header>

      <div ref={scrollRef} onScroll={handleScroll} className="flex flex-col overflow-y-auto px-6 py-4">
        {terms.sections.map((section) => (
          <section key={section.number} className="flex flex-col gap-2 border-b border-line py-5 last:border-b-0">
            <p className="text-[11px] font-medium uppercase tracking-[1.5px] text-muted">
              {section.number} — {section.title}
            </p>

            <div className="flex flex-col gap-2 text-sm leading-relaxed text-muted">
              {section.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {section.bullets && (
              <ul className="flex flex-col gap-1.5">
                {section.bullets.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            )}

            {section.prohibited && (
              <ul className="flex flex-col gap-1.5">
                {section.prohibited.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted">
                    <Ban className="mt-0.5 size-3.5 shrink-0 text-red-500" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            )}

            {section.quote && (
              <blockquote className="border-l-2 border-primary bg-black/[0.03] py-2 pl-4 text-sm italic leading-relaxed text-muted">
                {section.quote}
              </blockquote>
            )}
          </section>
        ))}
      </div>

      <footer className="flex items-center justify-end border-t border-line px-6 py-4">
        {reachedEnd ? (
          <button
            type="button"
            onClick={() => {
              onAgree();
              onOpenChange(false);
            }}
            className="cursor-pointer rounded-md bg-navy-950 px-5 py-2.5 text-xs font-medium uppercase tracking-[1px] text-white transition-colors hover:bg-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-950/40 focus-visible:ring-offset-2"
          >
            I&apos;ve Read and Agree
          </button>
        ) : (
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <ChevronDown className="size-3.5 animate-bounce" aria-hidden />
            Scroll to the bottom to continue
          </p>
        )}
      </footer>
    </dialog>
  );
}
