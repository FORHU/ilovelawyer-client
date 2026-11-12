import type { CancelMessageResponse, ChatMessage } from "@/lib/types";

/** The client's message whose answer is still being written, if any: what Stop stops. */
export function pendingTurnId(messages: ChatMessage[]): string | null {
  return messages.findLast((m) => m.role === "user" && m.replyStatus === "PENDING")?.id ?? null;
}

/** Whether a message can be deleted right now. Nothing can be while the AI is answering. */
export function canDeleteMessage(m: ChatMessage, thinking: boolean): boolean {
  return !thinking && !(m.role === "user" && m.replyStatus === "PENDING");
}

/** What to tell the client after Stop. Empty when it simply worked: the chat shows that itself. */
export function stopNotice(res: CancelMessageResponse): string {
  if (res.replyStatus === "DONE") return "That answer had already finished.";
  if (res.replyStatus === "FAILED") return "That answer had already failed. Your credit was given back.";
  return "";
}

/** The confirm question for deleting `m`. */
export function deleteQuestion(m: ChatMessage): string {
  return m.role === "user"
    ? "Delete this message and its answer? This can't be undone. You won't get the credit back."
    : "Delete this answer? This can't be undone.";
}
