import { checkPayment, sendPasswordReset, showCredits, showLawyerRequests } from "./actions-api";
import type { SupportActionCard, SupportActionKey } from "./types";

export interface ActionResult {
  ok: boolean;
  /** What the assistant says about it before the flow carries on. */
  text?: string;
  card?: SupportActionCard;
}

/** Exporting data and deleting the account need the client's say-so (a password, a confirmation),
 * so the chat shows their own step for them instead of running them. */
export const INTERACTIVE_ACTIONS: readonly SupportActionKey[] = ["EXPORT_MY_DATA", "DELETE_MY_ACCOUNT"];

export const isInteractiveAction = (key: SupportActionKey) => INTERACTIVE_ACTIONS.includes(key);

const UNAVAILABLE: ActionResult = { ok: false, text: "I can't do that from here just yet." };

/** Runs one of the flow's ACTION steps for the signed-in client. A failure says nothing itself:
 * the flow's own failure step explains it, so an error's wording never reaches the chat. */
export async function executeAction(key: SupportActionKey): Promise<ActionResult> {
  try {
    switch (key) {
      case "CHECK_PAYMENT": {
        const { payments } = await checkPayment();
        return payments.length > 0
          ? { ok: true, text: "Here are your payments from the last 30 days.", card: { kind: "PAYMENTS", payments } }
          : { ok: true, text: "I can't see any payments from the last 30 days." };
      }
      case "SHOW_CREDITS": {
        const { cases } = await showCredits();
        return cases.length > 0
          ? { ok: true, text: "Here are the Chat Credits on each of your cases.", card: { kind: "CREDITS", cases } }
          : { ok: true, text: "You don't have any cases with Chat Credits yet." };
      }
      case "SHOW_LAWYER_REQUESTS": {
        const { requests } = await showLawyerRequests();
        return requests.length > 0
          ? { ok: true, text: "Here are your lawyer requests.", card: { kind: "REQUESTS", requests } }
          : { ok: true, text: "You haven't asked for a lawyer on any case yet." };
      }
      case "SEND_PASSWORD_RESET": {
        const result = await sendPasswordReset();
        return result.sent
          ? { ok: true }
          : { ok: true, text: "You sign in with Google, so there's no password to reset. Use Sign in with Google." };
      }
      default:
        return UNAVAILABLE;
    }
  } catch {
    return { ok: false };
  }
}
