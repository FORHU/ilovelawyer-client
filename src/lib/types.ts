/** A kind of problem a case can be about ("Type of issue"). Admins manage the list
 * (GET /api/client/case-areas, lib/cases/case-areas.ts); a case has one or more, by code, and
 * lawyer matching uses them later. */
export interface CaseArea {
  code: string;
  name: string;
}

/** "Employment, Consumer" */
export function areasLabel(areas: CaseArea[]) {
  return areas.map((a) => a.name).join(", ");
}

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
  /** Bytes. Null when the upload didn't say. */
  size: number | null;
  uploadedAt: string;
  /** Same as uploadedAt; the API keeps it for older apps. */
  createdAt: string;
}

/** A case as the API returns it (GET /api/client/cases/:id). */
export interface Case {
  id: string;
  title: string;
  /** One or more, in the list's order. May include one an admin has since switched off. */
  areas: CaseArea[];
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
  /** The case documents sent with the client's message, by id. Always empty on the AI's. Look
   * these up against the case's own `documents` list for the name/status to show — the message
   * list doesn't resolve them inline (see ilovelawyer-api's IntakeChatSvc.listMessages). */
  documentIds: string[];
  createdAt: string;
}

/** The Overview tab's content and status (GET /api/client/cases/:id/intake). Mirrors
 * ilovelawyer-api's src/types/client-intake.ts — change both together. Deliberately has no
 * points that help/hurt the case, no computed deadline, no outlook or win likelihood: this is an
 * intake record, not a case assessment (docs/adr/0018-client-app-is-intake-not-advice.md, in the
 * API repo). A deadline here is only ever one the client or a document actually stated. */
export type IntakeStatus = "EMPTY" | "RUNNING" | "READY" | "FAILED" | "STALE";

export type IntakeSourceKind = "CASE_DETAILS" | "CLIENT" | "DOCUMENT";

export interface IntakeSource {
  kind: IntakeSourceKind;
  /** Set for CLIENT: the chat message this came from. */
  messageId: string | null;
  /** Set for DOCUMENT: which file, and the page when known. */
  documentId: string | null;
  documentName: string | null;
  page: number | null;
}

export interface IntakeItem {
  id: string;
  text: string;
  sources: IntakeSource[];
}

export interface IntakeEvent extends IntakeItem {
  date: string | null;
  datePrecision: "DAY" | "MONTH" | "YEAR" | "UNKNOWN";
}

export interface IntakePerson extends IntakeItem {
  name: string;
  /** How they're involved, e.g. "the employer", "a witness". */
  role: string;
}

/** A deadline, hearing date or time limit exactly as stated — never computed. */
export interface IntakeDeadline extends IntakeItem {
  date: string | null;
}

export interface IntakeGap {
  id: string;
  question: string;
  why: string;
}

/** Two or more sources disagreeing on a fact, date or detail. */
export interface IntakeConflict {
  id: string;
  description: string;
  sources: IntakeSource[];
}

export interface IntakeCompleteness {
  criteria: { key: string; label: string; met: boolean }[];
  ready: boolean;
}

export interface CaseIntake {
  generatedAt: string | null;
  status: IntakeStatus;
  updates: { allowed: boolean; leftToday: number };
  /** AI-written, neutral — always shown labelled as an AI summary, never as settled fact. */
  summary: string | null;
  people: IntakePerson[];
  timeline: IntakeEvent[];
  facts: IntakeItem[];
  goals: IntakeItem[];
  concerns: IntakeItem[];
  questionsForLawyer: IntakeItem[];
  deadlines: IntakeDeadline[];
  missing: IntakeGap[];
  conflicts: IntakeConflict[];
  /** From Lawyer Readiness when that check is enabled; null when it's off or hasn't run. */
  completeness: IntakeCompleteness | null;
}

export function sideLabel(side: Side | null) {
  return side === "CLAIMANT"
    ? "Bringing the complaint"
    : side === "RESPONDENT"
      ? "Responding to one"
      : "Not set yet";
}
