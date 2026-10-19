export type CaseArea = "Employment" | "Property" | "Family" | "Consumer" | "Other";
export const CASE_AREAS: CaseArea[] = ["Employment", "Property", "Family", "Consumer", "Other"];

export type Side = "CLAIMANT" | "RESPONDENT" | "";

export type PartyRole = "Opposing party" | "Witness" | "Other";
export const PARTY_ROLES: PartyRole[] = ["Opposing party", "Witness", "Other"];

export interface OtherParty {
  id: string;
  name: string;
  role: PartyRole;
}

export type ChatMessage =
  | { role: "user"; text: string }
  | { role: "ai"; text: string }
  | { role: "file"; text: string }
  | { role: "offer" };

export interface Case {
  id: number;
  title: string;
  area: CaseArea;
  where: string;
  side: Side;
  others: OtherParty[];
  files: string[];
  credits: number;
  chat: ChatMessage[];
}

export type LawyerStatus = "none" | "matching" | "accepted" | "closed";

export interface ThreadMessage {
  role: "user" | "lawyer" | "event";
  text: string;
  file?: boolean;
}

export function sideLabel(side: Side) {
  return side === "CLAIMANT"
    ? "Bringing the complaint"
    : side === "RESPONDENT"
      ? "Responding to one"
      : "Not set yet";
}
