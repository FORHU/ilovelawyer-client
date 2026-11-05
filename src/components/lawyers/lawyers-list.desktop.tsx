"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";
import { LawyerCard } from "./lawyer-card";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { Eyebrow } from "@/components/ui/misc";
import { cn } from "@/lib/cn";
import { LANGUAGE_FILTERS, LAWYER_SORTS, MAX_CONSULTATION, gbp, type LawyerSort } from "@/lib/lawyers/marketplace";
import { useLawyerRequestForm } from "@/lib/lawyer-requests/api";
import { UK_JURISDICTIONS, type UkJurisdiction } from "@/lib/types";
import type { LawyersList } from "./use-lawyers-list";

const select =
  "h-[42px] rounded-full border border-line-input bg-white px-4 text-[13.5px] text-ink outline-none focus:border-ink-2";

function Option({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-[10px] border px-3 py-2 text-left text-[13.5px] transition-colors",
        active ? "border-ink bg-white font-medium text-ink" : "border-transparent text-ink-2 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Eyebrow muted>{title}</Eyebrow>
      {children}
    </div>
  );
}

export function LawyersListDesktop({ v }: { v: LawyersList }) {
  const { cases, areas, activeCase, followsCase, availability, filters, set, clear, pickCase, toggleLanguage, sort, setSort, shown, total, summary, activeFilters } = v;
  const { isLoading, isPlaceholderData, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = v;
  // Below lg the filters stack above the list, so they fold away until asked for.
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-5 py-8 md:px-10">
        <header className="flex flex-col gap-2">
          <Eyebrow muted>Lawyer marketplace</Eyebrow>
          <h1 className="font-display text-[34px] leading-tight">Find a lawyer</h1>
          <p className="text-[15px] text-ink-2">
            Verified solicitors in England and Wales, Scotland and Northern Ireland. Every fee is set by the lawyer and shown before you ask.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <section className="flex flex-col gap-2 rounded-modal border border-line bg-white p-6">
            <h2 className="text-base font-semibold">Pick a lawyer yourself</h2>
            <p className="text-sm leading-[1.6] text-ink-2">
              Browse below and request one. Only that lawyer gets your request for 24 hours. If they can’t take it up, it goes to other matching lawyers automatically.
            </p>
          </section>
          <section className="flex flex-col gap-3 rounded-modal bg-navy-900 p-6 text-white">
            <h2 className="text-base font-semibold">Not sure? Let us match you</h2>
            <p className="text-sm leading-[1.6] text-white/80">
              We send an anonymised summary to every matching lawyer. The first to review it sends you a quote.
            </p>
            {activeCase ? (
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="match-case" className="text-[13px] text-white/80">
                  For
                </label>
                <select
                  id="match-case"
                  value={activeCase.id}
                  onChange={(e) => pickCase(e.target.value)}
                  className="h-10 min-w-0 max-w-[260px] flex-1 rounded-full border border-white/30 bg-transparent px-3.5 text-[13px] text-white outline-none"
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id} className="text-ink">
                      {c.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!availability.canRequest}
                  onClick={() => useLawyerRequestForm.getState().openFor(activeCase.id)}
                  className="h-10 rounded-full bg-white px-5 text-[13px] font-medium text-ink disabled:opacity-50"
                >
                  Match me
                </button>
                {availability.reason && <p className="w-full text-xs leading-[1.5] text-white/80">{availability.reason}</p>}
              </div>
            ) : (
              <Link href="/cases/new" className="self-start text-[13px] font-medium text-white underline hover:text-white">
                Start a case to get matched
              </Link>
            )}
          </section>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[272px_minmax(0,1fr)]">
          <aside className="flex flex-col rounded-card border border-line bg-subtle lg:sticky lg:top-8 lg:max-h-[calc(100dvh-4rem)] lg:overflow-hidden">
            <div className="flex shrink-0 items-center justify-between gap-3 p-5 max-lg:py-1.5">
              <h2 className="hidden text-[15px] font-semibold lg:block">Filters</h2>
              <button
                type="button"
                aria-expanded={filtersOpen}
                aria-controls="lawyer-filters"
                onClick={() => setFiltersOpen((o) => !o)}
                data-no-tap
                className="flex min-h-11 items-center gap-2 text-[15px] font-semibold lg:hidden"
              >
                Filters
                {activeFilters > 0 && (
                  <span className="rounded-full bg-ink px-2 py-0.5 text-[12px] font-medium leading-none text-white">
                    {activeFilters}
                    <span className="sr-only"> active</span>
                  </span>
                )}
                <ChevronDown size={18} aria-hidden="true" className={cn("text-ink-2 transition-transform", filtersOpen && "rotate-180")} />
              </button>
              <button
                type="button"
                onClick={() => clear()}
                data-no-tap
                className="flex min-h-11 items-center text-[13px] font-medium text-gold hover:text-gold-hover lg:min-h-0"
              >
                Clear all
              </button>
            </div>
            <div id="lawyer-filters" className={cn("min-h-0 flex-col gap-5 px-5 pb-5 lg:overflow-y-auto lg:overscroll-contain", filtersOpen ? "flex" : "hidden lg:flex")}>
              <Group title="Area of law">
                <Option active={!filters.area} onClick={() => set({ area: null })}>
                  All areas
                </Option>
                {areas.map((a) => (
                  <Option key={a.code} active={filters.area === a.code} onClick={() => set({ area: a.code })}>
                    {a.name}
                  </Option>
                ))}
              </Group>
              <Group title="Where your case is">
                <Option active={!filters.jurisdiction} onClick={() => set({ jurisdiction: null })}>
                  Anywhere in the UK
                </Option>
                {UK_JURISDICTIONS.map((j) => (
                  <Option key={j} active={filters.jurisdiction === j} onClick={() => set({ jurisdiction: j as UkJurisdiction })}>
                    {j}
                  </Option>
                ))}
              </Group>
              <Group title="First consultation up to">
                <input
                  type="range"
                  min={0}
                  max={MAX_CONSULTATION}
                  step={10}
                  value={filters.maxConsultation}
                  onChange={(e) => set({ maxConsultation: Number(e.target.value) })}
                  aria-label="Highest first consultation fee"
                  className="accent-gold"
                />
                <span className="text-[13px] text-ink-2">{filters.maxConsultation >= MAX_CONSULTATION ? "Any fee" : gbp(filters.maxConsultation)}</span>
              </Group>
              <Group title="Speaks">
                {LANGUAGE_FILTERS.map((l) => (
                  <label key={l} className="flex cursor-pointer items-center gap-2.5 text-[13.5px]">
                    <input type="checkbox" checked={filters.languages.includes(l)} onChange={() => toggleLanguage(l)} className="size-4 accent-ink" />
                    {l === "Other" ? "Other languages" : l}
                  </label>
                ))}
              </Group>
            </div>
          </aside>

          <section className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px] flex-1">
                <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-2" aria-hidden />
                <input
                  value={filters.search}
                  onChange={(e) => set({ search: e.target.value })}
                  placeholder="Name, firm or town"
                  aria-label="Search lawyers"
                  className={cn(select, "w-full pl-10")}
                />
              </div>
              <label className="flex items-center gap-2 text-[13px] text-ink-2">
                Sort
                <select value={sort} onChange={(e) => setSort(e.target.value as LawyerSort)} className={select}>
                  {LAWYER_SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {error ? (
              <div className="flex flex-col gap-2">
                <ErrorBox message="Couldn't load lawyers." />
                <Button variant="soft" size="sm" className="self-start" onClick={() => void refetch()}>
                  Try again
                </Button>
              </div>
            ) : isLoading ? (
              <div aria-hidden className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-[300px] animate-pulse rounded-card bg-chip" />
                ))}
              </div>
            ) : (
              <>
                <p className="text-sm text-ink-2" aria-live="polite">
                  {total} {total === 1 ? "lawyer" : "lawyers"}
                  {summary && ` for ${summary}`}
                  {activeCase && followsCase ? ` — matched to your case “${activeCase.title}”` : ""}
                </p>
                {shown.length === 0 ? (
                  <div className="flex flex-col items-start gap-3 rounded-card border border-dashed border-line-input p-6 text-sm text-ink-2">
                    No lawyers match these filters.
                    <Button variant="soft" size="sm" onClick={() => clear()}>
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  // One column, two from xl. A short or odd last row is centred in the column instead of
                  // stranded at its left. min-w-0 lets a card shrink to the screen on a phone.
                  <div className={cn("flex flex-wrap justify-center gap-4 transition-opacity", isPlaceholderData && "opacity-60")}>
                    {shown.map((l) => (
                      <div key={l.id} className="flex w-full min-w-0 xl:w-[calc(50%-0.5rem)]">
                        <LawyerCard lawyer={l} />
                      </div>
                    ))}
                  </div>
                )}
                {hasNextPage && (
                  <Button variant="soft" size="sm" className="self-center" disabled={isFetchingNextPage} onClick={() => void fetchNextPage()}>
                    {isFetchingNextPage ? "Loading…" : "Show more"}
                  </Button>
                )}
                <p className="text-[12.5px] leading-[1.6] text-ink-2">
                  Fees are set by each lawyer and paid to them; your actual price is in the quote they send. Lawyers pay ilovelawyer a fee for each introduction. Ratings come
                  from clients whose engagement has ended.
                </p>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
