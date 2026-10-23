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

export type LawyerStatus = "none" | "matching" | "accepted" | "closed";

export interface ThreadMessage {
  role: "user" | "lawyer" | "event";
  text: string;
  file?: boolean;
}

export function sideLabel(side: Side | null) {
  return side === "CLAIMANT"
    ? "Bringing the complaint"
    : side === "RESPONDENT"
      ? "Responding to one"
      : "Not set yet";
}
