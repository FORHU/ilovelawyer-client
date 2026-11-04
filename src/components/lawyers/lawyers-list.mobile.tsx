"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { BottomSheet } from "@/components/mobile/bottom-sheet";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/cn";
import { useLawyerRequestForm } from "@/lib/lawyer-requests/api";
import { LANGUAGE_FILTERS, LAWYER_SORTS, MAX_CONSULTATION, gbp, type LawyerSort } from "@/lib/lawyers/marketplace";
import { UK_JURISDICTIONS, type UkJurisdiction } from "@/lib/types";
import { LawyerCardMobile } from "./lawyer-card.mobile";
import type { LawyersList } from "./use-lawyers-list";

const field = "h-11 rounded-full border border-line-input bg-white px-4 text-[14px] text-ink outline-none focus:border-ink-2";

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2.5 border-0 p-0">
      <legend className="mb-2.5 text-[12px] font-semibold uppercase tracking-[1.2px] text-muted">{title}</legend>
      {children}
    </fieldset>
  );
}

/** The phone's Find a lawyer: search and filters stay at the top while the cards scroll under
 * them. Filters live in a sheet, and the ones in use show as chips you can take off in one tap. */
export function LawyersListMobile({ v }: { v: LawyersList }) {
  const { activeCase, filters, set, clear, toggleLanguage, areas, areaName } = v;
  const [filtering, setFiltering] = useState(false);

  // What is narrowing the list, each with the one tap that removes it.
  const applied: { key: string; label: string; remove: () => void }[] = [];
  if (filters.area) applied.push({ key: "area", label: areaName ?? "Area", remove: () => set({ area: null }) });
  if (filters.jurisdiction) applied.push({ key: "jurisdiction", label: filters.jurisdiction, remove: () => set({ jurisdiction: null }) });
  if (filters.maxConsultation < MAX_CONSULTATION)
    applied.push({ key: "fee", label: `Up to ${gbp(filters.maxConsultation)}`, remove: () => set({ maxConsultation: MAX_CONSULTATION }) });
  for (const l of filters.languages) applied.push({ key: `lang-${l}`, label: l === "Other" ? "Other languages" : l, remove: () => toggleLanguage(l) });

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="px-4 pb-2 pt-4">
        <h1 className="font-display text-[28px] leading-tight">Find a lawyer</h1>
        <p className="mt-1 text-[14px] leading-[1.5] text-ink-2">Verified solicitors. Every fee is set by the lawyer and shown before you ask.</p>
      </div>

      <div className="sticky top-0 z-10 flex flex-col gap-2.5 border-b border-line bg-white px-4 pb-3 pt-2">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-2" aria-hidden="true" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Name, firm or town"
            aria-label="Search lawyers"
            enterKeyHint="search"
            className={cn(field, "w-full pl-10")}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltering(true)}
            aria-haspopup="dialog"
            data-no-tap
            className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-line-input bg-white px-4 text-[14px] font-medium text-ink active:bg-chip"
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            Filters
            {v.activeFilters > 0 && (
              <span className="rounded-full bg-ink px-1.5 py-0.5 text-[12px] font-medium leading-none text-white">
                {v.activeFilters}
                <span className="sr-only"> active</span>
              </span>
            )}
          </button>
          <label className="min-w-0 flex-1">
            <span className="sr-only">Sort</span>
            <select value={v.sort} onChange={(e) => v.setSort(e.target.value as LawyerSort)} className={cn(field, "w-full truncate")}>
              {LAWYER_SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {applied.length > 0 && (
          <ul aria-label="Filters in use" className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
            {applied.map((a) => (
              <li key={a.key} className="shrink-0">
                <button
                  type="button"
                  onClick={a.remove}
                  aria-label={`Remove filter: ${a.label}`}
                  data-no-tap
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-chip pl-3 pr-2.5 text-[13px] font-medium text-ink active:bg-line"
                >
                  {a.label}
                  <X size={13} aria-hidden="true" />
                </button>
              </li>
            ))}
            <li className="shrink-0">
              <button type="button" onClick={clear} data-no-tap className="inline-flex min-h-9 items-center px-2 text-[13px] font-medium text-gold">
                Clear all
              </button>
            </li>
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3 px-4 pb-6 pt-3">
        {v.error ? (
          <div className="flex flex-col gap-2">
            <ErrorBox message="Couldn't load lawyers." />
            <Button variant="soft" size="lg" className="self-start" onClick={() => void v.refetch()}>
              Try again
            </Button>
          </div>
        ) : v.isLoading ? (
          <div aria-hidden="true" className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[168px] animate-pulse rounded-card bg-chip" />
            ))}
          </div>
        ) : (
          <>
            <p className="text-[13px] text-ink-2" aria-live="polite">
              {v.total} {v.total === 1 ? "lawyer" : "lawyers"}
              {v.summary && ` for ${v.summary}`}
              {activeCase && v.followsCase ? ` · matched to “${activeCase.title}”` : ""}
            </p>

            {v.shown.length === 0 ? (
              <div className="flex flex-col items-start gap-3 rounded-card border border-dashed border-line-input p-5 text-[14px] text-ink-2">
                No lawyers match these filters.
                <Button variant="soft" size="lg" onClick={clear}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <ul className={cn("flex flex-col gap-3 transition-opacity", v.isPlaceholderData && "opacity-60")}>
                {v.shown.map((l) => (
                  <li key={l.id}>
                    <LawyerCardMobile lawyer={l} />
                  </li>
                ))}
              </ul>
            )}

            {v.hasNextPage && (
              <Button variant="soft" size="lg" className="w-full" disabled={v.isFetchingNextPage} onClick={() => void v.fetchNextPage()}>
                {v.isFetchingNextPage ? "Loading…" : "Show more"}
              </Button>
            )}

            {/* Matching is the alternative to picking, so it sits after the list, not in front of it. */}
            <section className="mt-2 flex flex-col gap-3 rounded-modal bg-navy-900 p-5 text-white">
              <h2 className="text-[16px] font-semibold">Not sure? Let us match you</h2>
              <p className="text-[13.5px] leading-[1.55] text-white/80">
                We send an anonymised summary to every matching lawyer. The first to review it sends you a quote.
              </p>
              {activeCase ? (
                <>
                  <label className="flex flex-col gap-1.5 text-[12.5px] text-white/80">
                    For which case
                    <select
                      value={activeCase.id}
                      onChange={(e) => v.pickCase(e.target.value)}
                      className="h-11 w-full rounded-full border border-white/30 bg-transparent px-4 text-[14px] text-white outline-none"
                    >
                      {v.cases.map((c) => (
                        <option key={c.id} value={c.id} className="text-ink">
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    disabled={!v.availability.canRequest}
                    onClick={() => useLawyerRequestForm.getState().openFor(activeCase.id)}
                    data-no-tap
                    className="h-12 rounded-full bg-white px-5 text-[14px] font-medium text-ink disabled:opacity-50"
                  >
                    Match me
                  </button>
                  {v.availability.reason && <p className="text-[12.5px] leading-[1.5] text-white/80">{v.availability.reason}</p>}
                </>
              ) : (
                <Link href="/cases/new" className="self-start text-[14px] font-medium text-white underline hover:text-white">
                  Start a case to get matched
                </Link>
              )}
            </section>

            <p className="text-[12px] leading-[1.6] text-ink-2">
              Fees are set by each lawyer and paid to them; your actual price is in the quote they send. Lawyers pay ilovelawyer a fee for each introduction. Ratings come
              from clients whose engagement has ended.
            </p>
          </>
        )}
      </div>

      <BottomSheet open={filtering} onClose={() => setFiltering(false)} title="Filters">
        <div className="flex flex-col gap-6 px-3 pb-2 pt-2">
          <FilterGroup title="Area of law">
            <div className="flex flex-wrap gap-2">
              <Chip selected={!filters.area} onClick={() => set({ area: null })} className="min-h-11">
                All areas
              </Chip>
              {areas.map((a) => (
                <Chip key={a.code} selected={filters.area === a.code} onClick={() => set({ area: a.code })} className="min-h-11">
                  {a.name}
                </Chip>
              ))}
            </div>
          </FilterGroup>
          <FilterGroup title="Where your case is">
            <div className="flex flex-wrap gap-2">
              <Chip selected={!filters.jurisdiction} onClick={() => set({ jurisdiction: null })} className="min-h-11">
                Anywhere in the UK
              </Chip>
              {UK_JURISDICTIONS.map((j) => (
                <Chip key={j} selected={filters.jurisdiction === j} onClick={() => set({ jurisdiction: j as UkJurisdiction })} className="min-h-11">
                  {j}
                </Chip>
              ))}
            </div>
          </FilterGroup>
          <FilterGroup title="First consultation up to">
            <input
              type="range"
              min={0}
              max={MAX_CONSULTATION}
              step={10}
              value={filters.maxConsultation}
              onChange={(e) => set({ maxConsultation: Number(e.target.value) })}
              aria-label="Highest first consultation fee"
              className="h-11 w-full accent-gold"
            />
            <span className="text-[14px] text-ink-2">{filters.maxConsultation >= MAX_CONSULTATION ? "Any fee" : gbp(filters.maxConsultation)}</span>
          </FilterGroup>
          <FilterGroup title="Speaks">
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_FILTERS.map((l) => (
                <Chip key={l} selected={filters.languages.includes(l)} onClick={() => toggleLanguage(l)} className="min-h-11">
                  {l === "Other" ? "Other languages" : l}
                </Chip>
              ))}
            </div>
          </FilterGroup>
        </div>
        {/* Filters apply as they are chosen, so this just closes the sheet on the result. */}
        <div className="sticky bottom-0 mt-3 flex gap-2 border-t border-line bg-white px-3 pb-1 pt-3">
          <Button variant="soft" size="lg" className="flex-1" onClick={clear}>
            Clear all
          </Button>
          <Button variant="dark" size="lg" className="flex-[1.6]" onClick={() => setFiltering(false)}>
            Show {v.total} {v.total === 1 ? "lawyer" : "lawyers"}
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
