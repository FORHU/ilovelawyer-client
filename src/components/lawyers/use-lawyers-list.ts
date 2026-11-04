"use client";

import { useEffect, useState } from "react";
import { useCaseAvailability } from "@/components/lawyers/use-case-availability";
import { useCaseAreasQuery } from "@/lib/cases/case-areas";
import { useCasesQuery } from "@/lib/cases/queries";
import {
  DEFAULT_FILTERS,
  MAX_CONSULTATION,
  useLawyersQuery,
  useMarketplaceCase,
  type LawyerFilters,
  type LawyerSort,
} from "@/lib/lawyers/marketplace";

/** `value` once it has stopped changing for `ms`: the search box asks the API once typing pauses. */
function useDebounced<T>(value: T, ms = 300) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return settled;
}

/** Everything the Find a lawyer list does, shared by its desktop and mobile views: the case it
 * follows, the filters and sort, and the lawyers they return. The views only decide the layout. */
export function useLawyersList() {
  const { data: cases = [] } = useCasesQuery();
  const { data: areas = [] } = useCaseAreasQuery();

  // Until the client chooses a filter, the list follows the case: its type of issue and place.
  const caseChoice = useMarketplaceCase((s) => s.caseId);
  const [overrides, setOverrides] = useState<Partial<LawyerFilters>>({});
  const [sort, setSort] = useState<LawyerSort>("match");

  const activeCase = cases.find((c) => c.id === caseChoice) ?? cases[0] ?? null;
  // The area options are the switched-on case areas, so a case whose area was switched off since
  // falls back to "All areas" instead of a filter the client can't see.
  const caseArea = areas.find((a) => a.code === activeCase?.areas[0]?.code)?.code ?? null;
  const caseJurisdiction = activeCase?.ukJurisdiction ?? null;
  const filters: LawyerFilters = { ...DEFAULT_FILTERS, area: caseArea, jurisdiction: caseJurisdiction, ...overrides };
  const followsCase = !!activeCase && filters.area === caseArea && filters.jurisdiction === caseJurisdiction;
  const availability = useCaseAvailability(activeCase?.id ?? null);
  const search = useDebounced(filters.search);
  const query = useLawyersQuery({ filters: { ...filters, search }, sort, caseArea });
  const shown = query.data?.pages.flatMap((p) => p.data) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  // Keep the chosen case for the lawyer profile's request panel.
  useEffect(() => {
    if (activeCase && activeCase.id !== caseChoice) useMarketplaceCase.getState().set(activeCase.id);
  }, [activeCase, caseChoice]);

  const set = (patch: Partial<LawyerFilters>) => setOverrides((o) => ({ ...o, ...patch }));
  const clear = () => setOverrides({ ...DEFAULT_FILTERS });
  const pickCase = (id: string) => {
    useMarketplaceCase.getState().set(id);
    setOverrides({});
  };
  const toggleLanguage = (l: string) =>
    set({ languages: filters.languages.includes(l) ? filters.languages.filter((x) => x !== l) : [...filters.languages, l] });

  const areaName = areas.find((a) => a.code === filters.area)?.name;
  const summary = [areaName?.toLowerCase(), filters.jurisdiction].filter(Boolean).join(" in ");
  const activeFilters =
    (filters.area ? 1 : 0) + (filters.jurisdiction ? 1 : 0) + (filters.maxConsultation < MAX_CONSULTATION ? 1 : 0) + filters.languages.length;

  return {
    cases,
    areas,
    activeCase,
    followsCase,
    availability,
    filters,
    set,
    clear,
    pickCase,
    toggleLanguage,
    sort,
    setSort,
    shown,
    total,
    summary,
    areaName,
    activeFilters,
    isLoading: query.isLoading,
    isPlaceholderData: query.isPlaceholderData,
    error: query.error,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}

export type LawyersList = ReturnType<typeof useLawyersList>;
