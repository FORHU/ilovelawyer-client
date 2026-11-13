import type { SupportActionKey } from "./types";

export interface ActionResult {
  ok: boolean;
  /** What the assistant says about it before the flow carries on. */
  text?: string;
}

/** Does what a flow's ACTION step asks of the account (re-check a payment, show credits…). Not
 * built yet: every action answers that it can't be done from the chat, and the flow carries on
 * down its failure path. */
export async function executeAction(key: SupportActionKey): Promise<ActionResult> {
  void key;
  return { ok: false, text: "I can't do that from here just yet." };
}
