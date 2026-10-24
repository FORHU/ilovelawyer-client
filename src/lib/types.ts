/** The kinds of problem a case can be about. The values are the API's (Case.practiceArea), and
 * lawyer matching uses them later. */
export type CaseArea = "EMPLOYMENT" | "PROPERTY" | "FAMILY" | "CONSUMER" | "OTHER";
export const CASE_AREAS: CaseArea[] = ["EMPLOYMENT", "PROPERTY", "FAMILY", "CONSUMER", "OTHER"];
export const AREA_LABELS: Record<CaseArea, string> = {
  EMPLOYMENT: "Employment",
  PROPERTY: "Property",
  FAMILY: "Family",
  CONSUMER: "Consumer",
  OTHER: "Other",
};

/** The three UK legal systems. A lawyer is qualified in one or more of them. */
export type UkJurisdiction = "England and Wales" | "Scotland" | "Northern Ireland";
export const UK_JURISDICTIONS: UkJurisdiction[] = ["England and Wales", "Scotland", "Northern Ireland"];
/** What the wizard asks: one of the three, or outside the UK (no UK jurisdiction). */
export type CaseRegion = UkJurisdiction | "OUTSIDE_UK";

export function regionLabel(ukJurisdiction: UkJurisdiction | null) {
  return ukJurisdiction ?? "Outside the UK";
}

export type Side = "CLAIMANT" | "RESPONDENT" | "";

export type PartyRole = "Opposing party" | "Witness" | "Other";
export const PARTY_ROLES: PartyRole[] = ["Opposing party", "Witness", "Other"];

export interface OtherParty {
  id: string;
  name: string;
  role: PartyRole;
}

/** READY once the AI can read it. */
export type DocumentStatus = "PENDING" | "READY" | "FAILED";

export interface CaseDocument {
  id: string;
  name: string;
  status: DocumentStatus;
  createdAt: string;
}

/** A case as the API returns it (GET /api/client/cases/:id). */
export interface Case {
  id: string;
  title: string;
  area: CaseArea;
  ukJurisdiction: UkJurisdiction | null;
  where: string;
  /** What happened and what the client wants (lib/cases/notes.ts). Empty when not given. */
  notes: string;
  side: "CLAIMANT" | "RESPONDENT" | null;
  others: OtherParty[];
  documents: CaseDocument[];
  /** Chat credits left. Each message to the AI uses one. */
  credits: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  /** On the client's own messages: whether the AI's answer arrived. */
  replyStatus: "PENDING" | "DONE" | "FAILED" | "CANCELLED" | null;
  createdAt: string;
}

/** The Overview tab's content and status (GET /api/client/cases/:id/overview). Mirrors
 * ilovelawyer-api's src/types/client-overview.ts — change both together; the API's contract test
 * fails on any field added or dropped. Deliberately has no outlook, win likelihood, strategy or
 * attack/defense fields; those stay in the lawyer app. */
export type OverviewPane = "strategy" | "findings" | "missingEvidence";
/** keyDates is only ever READY or EMPTY. */
export type SectionStatus = "EMPTY" | "RUNNING" | "READY" | "FAILED" | "STALE";

export interface OverviewTimelineEntry {
  id: string;
  date: string | null;
  label: string;
  /** Both null when the entry has no source document, or it's no longer on the case. */
  sourceDocumentId: string | null;
  sourceDocumentName: string | null;
}

/** A procedural deadline. CONFIRMED once anyone has confirmed it. */
export interface OverviewKeyDate {
  id: string;
  label: string;
  date: string;
  status: "CONFIRMED" | "ESTIMATED";
}

export interface OverviewGatherItem {
  id: string;
  title: string;
  why: string;
}

/** A point that helps or may hurt the case. */
export interface OverviewPoint {
  id: string;
  title: string;
  detail: string | null;
}

export interface CaseOverview {
  generatedAt: string | null;
  /** The live job; null when nothing is running. */
  job: { startedAt: string; panesDone: OverviewPane[] } | null;
  /** READY documents added or removed since generatedAt; null when nothing changed. */
  changedSince: { added: number; removed: number } | null;
  updates: { allowed: boolean; leftToday: number };
  sections: {
    summary: SectionStatus;
    timeline: SectionStatus;
    /** Absent for a case outside the UK, with keyDates. */
    keyDates?: SectionStatus;
    toGather: SectionStatus;
    helps: SectionStatus;
    mayHurt: SectionStatus;
  };
  summary: string | null;
  timeline: OverviewTimelineEntry[];
  keyDates?: OverviewKeyDate[];
  toGather: OverviewGatherItem[];
  helps: OverviewPoint[];
  mayHurt: OverviewPoint[];
}

export function sideLabel(side: Side | null) {
  return side === "CLAIMANT"
    ? "Bringing the complaint"
    : side === "RESPONDENT"
      ? "Responding to one"
      : "Not set yet";
}
