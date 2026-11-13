// The Support Chat's content, as ilovelawyer-api serves it (GET /api/client/support/content and the
// public GET /api/support/content). Copied from ilovelawyer-api/src/types/support-content.ts: keep
// the two in step.

export type SupportActionKey =
  | "CHECK_PAYMENT"
  | "SHOW_CREDITS"
  | "SHOW_LAWYER_REQUESTS"
  | "SEND_PASSWORD_RESET"
  | "RESEND_CODE"
  | "EXPORT_MY_DATA"
  | "DELETE_MY_ACCOUNT"
  | "OPEN_TICKET";

export type SupportAudience = "SIGNED_IN" | "SIGNED_OUT";

export type SupportTarget =
  | { kind: "STEP"; stepId: string }
  | { kind: "FLOW"; flowId: string }
  | { kind: "LINK"; href: string; label?: string }
  | { kind: "TALK_TO_PERSON" }
  | { kind: "END" };

export interface SupportChoiceOption {
  label: string;
  target: SupportTarget;
}

export type SupportStep =
  | { id: string; type: "MESSAGE"; text: string; next?: SupportTarget }
  | { id: string; type: "CHOICES"; text?: string; style: "BUTTONS" | "QUICK_REPLIES"; options: SupportChoiceOption[] }
  | { id: string; type: "ACTION"; actionKey: SupportActionKey; onSuccess: SupportTarget; onFailure: SupportTarget }
  | { id: string; type: "DID_THAT_HELP" };

export interface SupportFlow {
  id: string;
  title: string;
  audience: SupportAudience | "BOTH";
  /** Words and phrases typed text is matched against. */
  triggers: string[];
  /** Offered after "Did that help?" is answered No. */
  relatedFlowIds: string[];
  startStepId: string;
  steps: Record<string, SupportStep>;
}

export interface SupportMenuCard {
  id: string;
  title: string;
  subtitle?: string;
  flowId: string;
  enabled: boolean;
}

export interface SupportSettings {
  assistantName: string;
  avatarUrl: string | null;
  /** May contain {firstName}. */
  greeting: string;
  responseTimeLine: string;
}

export interface PublishedSupportContent {
  version: number;
  publishedAt: string;
  settings: SupportSettings;
  /** The enabled menu cards for the audience, in order. */
  menu: SupportMenuCard[];
  /** Only the flows available to the audience. */
  flows: Record<string, SupportFlow>;
  actions: { key: SupportActionKey; label: string; safetyCopy?: string[] }[];
}

/** What a conversation reports (POST /api/client/support/outcomes). Never the client's own words
 * except UNMATCHED text, which the API strips of emails, phone numbers and postcodes. */
export interface SupportOutcomeEvent {
  kind: "FLOW_STARTED" | "HELPED_YES" | "HELPED_NO" | "ESCALATED" | "UNMATCHED";
  flowId?: string;
  contentVersion?: number;
  text?: string;
}
