import { useMutation, useQuery } from "@tanstack/react-query";
import { create } from "zustand";
import { useSession } from "@/lib/auth/session";
import type { UkJurisdiction } from "@/lib/types";

// The lawyer marketplace: browse verified lawyers and request one directly. ilovelawyer-api has no
// endpoint for either yet, so this module is the seam: the types are the shape the API should
// return, and listLawyers / getLawyer / requestLawyer are served from the mock list below. Swap
// their bodies for apiFetch calls (GET /api/client/lawyers, GET /api/client/lawyers/:id, and a
// lawyerId on POST /api/client/lawyer-requests) and nothing else changes.

export interface FeeRange {
  min: number;
  max: number;
}

export interface LawyerService {
  name: string;
  charge: "Fixed" | "Fixed range" | "Hourly";
  /** GBP, ex VAT. */
  price: FeeRange;
}

export interface LawyerReview {
  rating: number;
  matter: string;
  month: string;
  text: string;
}

export interface MarketplaceLawyer {
  id: string;
  name: string;
  title: string;
  firmName: string | null;
  town: string;
  /** Tailwind background class for the initials avatar. */
  tone: string;
  regulator: string;
  registrationNumber: string;
  verifiedAt: string;
  practiceAreas: string[];
  specialisms: string[];
  jurisdictions: UkJurisdiction[];
  languages: string[];
  bio: string;
  rating: number;
  reviewCount: number;
  /** Count of reviews at 5, 4, 3, 2, 1 stars. */
  ratingBreakdown: [number, number, number, number, number];
  reviews: LawyerReview[];
  /** Null when the first consultation is free: see freeConsultationMinutes. */
  firstConsultationFee: number | null;
  freeConsultationMinutes: number | null;
  fixedFees: FeeRange | null;
  hourly: FeeRange | null;
  services: LawyerService[];
  /** "4 hours", "a day". */
  repliesIn: string;
  /** Hours, for sorting. */
  repliesInHours: number;
}

export const LAWYERS: MarketplaceLawyer[] = [
  {
    id: "priya-natarajan",
    name: "Priya Natarajan",
    title: "Solicitor",
    firmName: "Northbridge Employment Law",
    town: "Manchester",
    tone: "bg-[#1f4e8c]",
    regulator: "Solicitors Regulation Authority",
    registrationNumber: "[SRA number]",
    verifiedAt: "2026-09-03",
    practiceAreas: ["Employment", "Discrimination"],
    specialisms: ["Employment", "Unfair dismissal", "Discrimination", "Settlement agreements"],
    jurisdictions: ["England and Wales"],
    languages: ["English", "Tamil"],
    bio: "[Lawyer's own bio.] I help employees who've been dismissed, side-lined or pushed out, including after raising concerns about pay or discrimination. Most of my clients have never needed a lawyer before, so I explain the options in plain English and tell you what it will cost before we start.",
    rating: 4.9,
    reviewCount: 31,
    ratingBreakdown: [28, 3, 0, 0, 0],
    reviews: [
      { rating: 5, matter: "Employment", month: "Sep 2026", text: "[Sample review] Clear about cost from the first call and explained my options without jargon." },
      { rating: 5, matter: "Settlement agreement", month: "Aug 2026", text: "[Sample review] Reviewed my agreement within two days and got the reference wording changed." },
    ],
    firstConsultationFee: 60,
    freeConsultationMinutes: null,
    fixedFees: { min: 400, max: 1500 },
    hourly: { min: 160, max: 220 },
    services: [
      { name: "First consultation (45 min, video)", charge: "Fixed", price: { min: 60, max: 60 } },
      { name: "Settlement agreement review", charge: "Fixed", price: { min: 400, max: 400 } },
      { name: "Tribunal claim preparation (ET1)", charge: "Fixed range", price: { min: 900, max: 1500 } },
      { name: "Ongoing advice and representation", charge: "Hourly", price: { min: 160, max: 220 } },
    ],
    repliesIn: "4 hours",
    repliesInHours: 4,
  },
  {
    id: "daniel-okafor",
    name: "Daniel Okafor",
    title: "Solicitor",
    firmName: "Okafor & Co Solicitors",
    town: "Leeds",
    tone: "bg-[#1f6b42]",
    regulator: "Solicitors Regulation Authority",
    registrationNumber: "[SRA number]",
    verifiedAt: "2026-08-12",
    practiceAreas: ["Employment", "Consumer"],
    specialisms: ["Employment", "Consumer", "Contract disputes"],
    jurisdictions: ["England and Wales"],
    languages: ["English", "Yoruba"],
    bio: "[Lawyer's own bio.] I act for employees and consumers in disputes where the other side is a larger business. I start with a free half-hour call so you can decide whether I'm the right fit before spending anything.",
    rating: 4.7,
    reviewCount: 18,
    ratingBreakdown: [14, 4, 0, 0, 0],
    reviews: [
      { rating: 5, matter: "Consumer", month: "Sep 2026", text: "[Sample review] Got my refund claim moving with one letter. Fees were exactly as quoted." },
      { rating: 4, matter: "Employment", month: "Jul 2026", text: "[Sample review] Honest about the risks, which I appreciated." },
    ],
    firstConsultationFee: null,
    freeConsultationMinutes: 30,
    fixedFees: { min: 350, max: 900 },
    hourly: { min: 140, max: 190 },
    services: [
      { name: "First consultation (30 min, phone or video)", charge: "Fixed", price: { min: 0, max: 0 } },
      { name: "Letter before claim", charge: "Fixed", price: { min: 350, max: 350 } },
      { name: "Small claims preparation", charge: "Fixed range", price: { min: 500, max: 900 } },
      { name: "Ongoing advice and representation", charge: "Hourly", price: { min: 140, max: 190 } },
    ],
    repliesIn: "a day",
    repliesInHours: 24,
  },
  {
    id: "marcus-lee",
    name: "Marcus Lee",
    title: "Solicitor",
    firmName: "Harbourside Legal",
    town: "London",
    tone: "bg-[#252525]",
    regulator: "Solicitors Regulation Authority",
    registrationNumber: "[SRA number]",
    verifiedAt: "2026-07-21",
    practiceAreas: ["Employment", "Immigration"],
    specialisms: ["Employment", "Immigration", "Sponsored workers"],
    jurisdictions: ["England and Wales"],
    languages: ["English", "Cantonese"],
    bio: "[Lawyer's own bio.] I advise employees and sponsored workers on dismissal, visas and the points where the two overlap. Fixed fees for most work.",
    rating: 4.5,
    reviewCount: 40,
    ratingBreakdown: [26, 10, 3, 1, 0],
    reviews: [
      { rating: 5, matter: "Immigration", month: "Oct 2026", text: "[Sample review] Calm, quick, and kept me updated at every step." },
      { rating: 4, matter: "Employment", month: "Aug 2026", text: "[Sample review] Good advice; replies could be a little faster on busy weeks." },
    ],
    firstConsultationFee: 90,
    freeConsultationMinutes: null,
    fixedFees: { min: 600, max: 2000 },
    hourly: { min: 200, max: 280 },
    services: [
      { name: "First consultation (45 min, video)", charge: "Fixed", price: { min: 90, max: 90 } },
      { name: "Visa application review", charge: "Fixed range", price: { min: 600, max: 1200 } },
      { name: "Unfair dismissal claim", charge: "Fixed range", price: { min: 1200, max: 2000 } },
      { name: "Ongoing advice and representation", charge: "Hourly", price: { min: 200, max: 280 } },
    ],
    repliesIn: "6 hours",
    repliesInHours: 6,
  },
  {
    id: "fiona-macleod",
    name: "Fiona MacLeod",
    title: "Solicitor",
    firmName: "Thistle Legal",
    town: "Edinburgh",
    tone: "bg-[#7a3b8f]",
    regulator: "Law Society of Scotland",
    registrationNumber: "[Law Society number]",
    verifiedAt: "2026-06-30",
    practiceAreas: ["Housing", "Family"],
    specialisms: ["Housing", "Landlord and tenant", "Family"],
    jurisdictions: ["Scotland"],
    languages: ["English"],
    bio: "[Lawyer's own bio.] I act for tenants and families across Scotland, from deposit disputes to separation. I'll tell you early on whether a claim is worth bringing.",
    rating: 4.8,
    reviewCount: 22,
    ratingBreakdown: [19, 3, 0, 0, 0],
    reviews: [{ rating: 5, matter: "Housing", month: "Sep 2026", text: "[Sample review] Got my deposit back in full, with a clear plan from day one." }],
    firstConsultationFee: 45,
    freeConsultationMinutes: null,
    fixedFees: { min: 300, max: 1200 },
    hourly: { min: 150, max: 210 },
    services: [
      { name: "First consultation (30 min, video)", charge: "Fixed", price: { min: 45, max: 45 } },
      { name: "Deposit dispute", charge: "Fixed range", price: { min: 300, max: 600 } },
      { name: "Ongoing advice and representation", charge: "Hourly", price: { min: 150, max: 210 } },
    ],
    repliesIn: "5 hours",
    repliesInHours: 5,
  },
  {
    id: "ciaran-mcauley",
    name: "Ciarán McAuley",
    title: "Solicitor",
    firmName: "McAuley Hughes",
    town: "Belfast",
    tone: "bg-[#8a6200]",
    regulator: "Law Society of Northern Ireland",
    registrationNumber: "[Law Society number]",
    verifiedAt: "2026-05-14",
    practiceAreas: ["Consumer", "Employment"],
    specialisms: ["Consumer", "Employment"],
    jurisdictions: ["Northern Ireland"],
    languages: ["English"],
    bio: "[Lawyer's own bio.] I help people in Northern Ireland with consumer and workplace disputes. Fixed fees wherever possible.",
    rating: 4.6,
    reviewCount: 12,
    ratingBreakdown: [8, 3, 1, 0, 0],
    reviews: [{ rating: 5, matter: "Consumer", month: "Aug 2026", text: "[Sample review] Straight answers and a fair fixed fee." }],
    firstConsultationFee: 50,
    freeConsultationMinutes: null,
    fixedFees: { min: 350, max: 1000 },
    hourly: { min: 130, max: 180 },
    services: [
      { name: "First consultation (30 min, phone)", charge: "Fixed", price: { min: 50, max: 50 } },
      { name: "Faulty goods claim", charge: "Fixed range", price: { min: 350, max: 700 } },
      { name: "Ongoing advice and representation", charge: "Hourly", price: { min: 130, max: 180 } },
    ],
    repliesIn: "8 hours",
    repliesInHours: 8,
  },
];

export interface LawyerFilters {
  /** Practice area name; null for all. */
  area: string | null;
  jurisdiction: UkJurisdiction | null;
  charging: "any" | "fixed" | "hourly";
  /** Highest first-consultation fee in GBP. */
  maxConsultation: number;
  languages: string[];
  search: string;
}

export type LawyerSort = "match" | "rating" | "price" | "reply";
export const LAWYER_SORTS: { value: LawyerSort; label: string }[] = [
  { value: "match", label: "Best match for your case" },
  { value: "rating", label: "Highest rated" },
  { value: "price", label: "Lowest consultation fee" },
  { value: "reply", label: "Fastest reply" },
];

export const MAX_CONSULTATION = 150;
export const LANGUAGE_FILTERS = ["English", "Welsh", "Other"] as const;

export const DEFAULT_FILTERS: LawyerFilters = {
  area: null,
  jurisdiction: null,
  charging: "any",
  maxConsultation: MAX_CONSULTATION,
  languages: [],
  search: "",
};

const norm = (s: string) => s.trim().toLowerCase();

function matchesLanguage(l: MarketplaceLawyer, wanted: string[]) {
  if (wanted.length === 0) return true;
  return wanted.some((w) => (w === "Other" ? l.languages.some((x) => x !== "English" && x !== "Welsh") : l.languages.includes(w)));
}

export function filterLawyers(all: MarketplaceLawyer[], f: LawyerFilters, sort: LawyerSort, caseArea?: string | null): MarketplaceLawyer[] {
  const q = norm(f.search);
  const out = all.filter((l) => {
    if (f.area && !l.practiceAreas.some((a) => norm(a) === norm(f.area!))) return false;
    if (f.jurisdiction && !l.jurisdictions.includes(f.jurisdiction)) return false;
    if (f.charging === "fixed" && !l.fixedFees) return false;
    if (f.charging === "hourly" && !l.hourly) return false;
    if (f.maxConsultation < MAX_CONSULTATION && (l.firstConsultationFee ?? 0) > f.maxConsultation) return false;
    if (!matchesLanguage(l, f.languages)) return false;
    if (q && !`${l.name} ${l.firmName ?? ""} ${l.town}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const fee = (l: MarketplaceLawyer) => l.firstConsultationFee ?? 0;
  const fit = (l: MarketplaceLawyer) => (caseArea && l.practiceAreas.some((a) => norm(a) === norm(caseArea)) ? 1 : 0);
  const by: Record<LawyerSort, (a: MarketplaceLawyer, b: MarketplaceLawyer) => number> = {
    match: (a, b) => fit(b) - fit(a) || b.rating - a.rating,
    rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
    price: (a, b) => fee(a) - fee(b),
    reply: (a, b) => a.repliesInHours - b.repliesInHours,
  };
  return out.sort(by[sort]);
}

export const gbp = (n: number) => `£${n.toLocaleString("en-GB")}`;
export const range = (r: FeeRange) => (r.min === r.max ? gbp(r.min) : `${gbp(r.min)}–${gbp(r.max)}`);
export const consultationLabel = (l: MarketplaceLawyer) =>
  l.firstConsultationFee === null ? `Free ${l.freeConsultationMinutes ?? 30} min` : gbp(l.firstConsultationFee);

const delay = <T>(value: T, ms = 250) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

export function listLawyers() {
  return delay(LAWYERS);
}

export function getLawyer(id: string) {
  return delay(LAWYERS.find((l) => l.id === id) ?? null);
}

/** Whether a request can go to one named lawyer. False until the API supports it: the mock below
 * would otherwise show "Request sent" for a request nobody receives. */
export const DIRECT_REQUEST_AVAILABLE = false;

/** The case picked on the marketplace, so a lawyer's profile requests for the same case. */
export const useMarketplaceCase = create<{ caseId: string | null; set: (caseId: string | null) => void }>((set) => ({
  caseId: null,
  set: (caseId) => set({ caseId }),
}));

/** Sends the client's case to this one lawyer only. Mock: succeeds. */
export function requestLawyer(input: { lawyerId: string; caseId: string }) {
  void input;
  return delay({ ok: true as const }, 600);
}

export function useLawyersQuery() {
  const userId = useSession((s) => s.user?.id);
  return useQuery({ queryKey: ["marketplace-lawyers", userId], queryFn: listLawyers, enabled: !!userId, staleTime: 1000 * 60 * 5 });
}

export function useLawyerQuery(id: string) {
  const userId = useSession((s) => s.user?.id);
  return useQuery({ queryKey: ["marketplace-lawyer", userId, id], queryFn: () => getLawyer(id), enabled: !!userId, staleTime: 1000 * 60 * 5 });
}

export function useRequestLawyerMutation() {
  return useMutation({ mutationFn: requestLawyer });
}
