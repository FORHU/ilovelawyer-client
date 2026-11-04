import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { create } from "zustand";
import { ApiError, apiFetch } from "@/lib/api/fetch";
import { useSession } from "@/lib/auth/session";
import type { Money } from "@/lib/client-handoff";
import { money } from "@/lib/pricing";
import type { Case, UkJurisdiction } from "@/lib/types";

// The lawyer marketplace: browse verified lawyers (GET /api/client/lawyers, filtered and sorted
// there), open one's profile (GET /api/client/lawyers/:id), and request them by name: the request
// form (useLawyerRequestForm.openFor(caseId, lawyer)) sends a lawyerId on POST
// /api/client/lawyer-requests, so only they are offered it for 24 hours, then every matching lawyer.

/** "SRA" | "LSS" | "LSNI": who regulates a solicitor. */
export type LawyerRegulator = "SRA" | "LSS" | "LSNI";

/** A lawyer in the marketplace list (GET /api/client/lawyers): the public profile the client sees on
 * a quote, plus their town and their clients' ratings. */
export interface ClientLawyer {
  id: string;
  name: string;
  avatarUrl: string | null;
  /** Null for a solo lawyer. */
  firmName: string | null;
  /** Their firm's city. */
  town: string | null;
  regulator: LawyerRegulator | null;
  registrationNumber: string | null;
  /** By name, in the site's order. */
  practiceAreas: string[];
  /** The case area codes they take. */
  caseAreas: string[];
  qualifiedJurisdictions: UkJurisdiction[];
  languages: string[];
  bio: string;
  /** 0: free. Null: no first consultation offered. */
  firstConsultationFee: Money | null;
  verifiedAt: string | null;
  /** Average of their clients' ratings, one decimal; null with no reviews. */
  rating: number | null;
  reviewCount: number;
}

export interface LawyerFilters {
  /** Case area code; null for all. */
  area: string | null;
  jurisdiction: UkJurisdiction | null;
  /** Highest first-consultation fee in GBP; MAX_CONSULTATION for any. */
  maxConsultation: number;
  languages: string[];
  search: string;
}

export type LawyerSort = "match" | "rating" | "price";
export const LAWYER_SORTS: { value: LawyerSort; label: string }[] = [
  { value: "match", label: "Best match for your case" },
  { value: "rating", label: "Highest rated" },
  { value: "price", label: "Lowest consultation fee" },
];

export const MAX_CONSULTATION = 150;
export const LANGUAGE_FILTERS = ["English", "Welsh", "Other"] as const;

export const DEFAULT_FILTERS: LawyerFilters = {
  area: null,
  jurisdiction: null,
  maxConsultation: MAX_CONSULTATION,
  languages: [],
  search: "",
};

export const gbp = (n: number) => `£${n.toLocaleString("en-GB")}`;
/** A listed lawyer's first consultation: "Free", "£60", or "Not offered". */
export const firstConsultationLabel = (l: ClientLawyer) =>
  l.firstConsultationFee === null ? "Not offered" : l.firstConsultationFee.amountMinor === 0 ? "Free" : money(l.firstConsultationFee);

const TONES = ["bg-[#1f4e8c]", "bg-[#1f6b42]", "bg-[#252525]", "bg-[#7a3b8f]", "bg-[#8a6200]", "bg-[#8c2f39]"];
/** The initials avatar's colour, the same for a lawyer every time. */
export function toneFor(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return TONES[Math.abs(h) % TONES.length];
}

const PAGE_SIZE = 20;

/** What the list is asked for: the filters, the sort, and the client's case's area for sort=match. */
export interface LawyerListParams {
  filters: LawyerFilters;
  sort: LawyerSort;
  caseArea: string | null;
}

export function listLawyers({ filters, sort, caseArea }: LawyerListParams, page: number) {
  const q = new URLSearchParams({ sort, page: String(page), limit: String(PAGE_SIZE) });
  if (filters.area) q.set("area", filters.area);
  if (caseArea) q.set("caseArea", caseArea);
  if (filters.jurisdiction) q.set("jurisdiction", filters.jurisdiction);
  if (filters.maxConsultation < MAX_CONSULTATION) q.set("maxConsultationMinor", String(filters.maxConsultation * 100));
  filters.languages.forEach((l) => q.append("languages", l));
  if (filters.search.trim()) q.set("q", filters.search.trim());
  return apiFetch<{ total: number; data: ClientLawyer[] }>(`/api/client/lawyers?${q}`);
}

/** One lawyer's profile (GET /api/client/lawyers/:id): what the list shows, plus how their ratings
 * spread and their clients' latest comments. */
export interface ClientLawyerProfile extends ClientLawyer {
  /** Taking new requests now. A lawyer who isn't is still shown, so an old link opens. */
  available: boolean;
  /** How many ratings at 5, 4, 3, 2 and 1 stars. */
  ratingBreakdown: [number, number, number, number, number];
  /** Latest ratings with a comment, newest first, shown without the client's name. */
  reviews: { rating: number; comment: string; caseAreas: string[]; createdAt: string }[];
}

/** The profile, or null when the lawyer isn't listed (404). */
export async function getLawyer(id: string): Promise<ClientLawyerProfile | null> {
  try {
    return await apiFetch<ClientLawyerProfile>(`/api/client/lawyers/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** Whether the lawyer takes cases like this one: its area (any of them) and its part of the UK. The
 * API checks the same when the request is sent (LAWYER_NOT_A_MATCH). */
export function takesCase(lawyer: Pick<ClientLawyer, "caseAreas" | "qualifiedJurisdictions">, c: Pick<Case, "areas" | "ukJurisdiction">) {
  return !!c.ukJurisdiction && lawyer.qualifiedJurisdictions.includes(c.ukJurisdiction) && c.areas.some((a) => lawyer.caseAreas.includes(a.code));
}

/** The case picked on the marketplace, so a lawyer's profile requests for the same case. */
export const useMarketplaceCase = create<{ caseId: string | null; set: (caseId: string | null) => void }>((set) => ({
  caseId: null,
  set: (caseId) => set({ caseId }),
}));

/** The marketplace list, a page at a time. The last page stays on screen while a filter change loads. */
export function useLawyersQuery(params: LawyerListParams) {
  const userId = useSession((s) => s.user?.id);
  return useInfiniteQuery({
    queryKey: ["marketplace-lawyers", userId, params],
    queryFn: ({ pageParam }) => listLawyers(params, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => (pages.length * PAGE_SIZE < last.total ? pages.length + 1 : undefined),
    enabled: !!userId,
    staleTime: 1000 * 60,
    placeholderData: keepPreviousData,
  });
}

export function useLawyerQuery(id: string) {
  const userId = useSession((s) => s.user?.id);
  return useQuery({ queryKey: ["marketplace-lawyer", userId, id], queryFn: () => getLawyer(id), enabled: !!userId, staleTime: 1000 * 60 });
}
