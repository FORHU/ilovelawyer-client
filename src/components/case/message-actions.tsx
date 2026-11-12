"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionMenu } from "@/components/ui/action-menu";
import { cn } from "@/lib/cn";
import { deleteQuestion } from "@/lib/cases/chat-actions";
import type { ChatMessage } from "@/lib/types";
import type { Consultation } from "./use-consultation";

/** The "…" beside a chat message: Delete, dimmed while the AI is answering (see canDeleteMessage).
 * On a wide screen it shows when the message is hovered or focused (or its menu is open), so a long
 * chat isn't a column of buttons; on a phone, where there is no hover, it is always there. The
 * message it sits in must be a `group`. */
export function MessageMenu({ m, consultation, className }: { m: ChatMessage; consultation: Consultation; className?: string }) {
  return (
    <ActionMenu
      quiet
      label={m.role === "user" ? "More actions for your message" : "More actions for this answer"}
      className={cn(
        "shrink-0 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 md:has-[[aria-expanded=true]]:opacity-100",
        className,
      )}
      items={[
        {
          label: "Delete",
          icon: <Trash2 size={14} aria-hidden />,
          danger: true,
          disabled: !consultation.canDelete(m),
          onSelect: () => consultation.setConfirmingId(m.id),
        },
      ]}
    />
  );
}

/** Asks before deleting, saying what goes with it. Sits under its message at the chat's full
 * width (not inside the narrow bubble column), same look as the Documents tab's remove question. */
export function DeleteConfirm({ m, consultation }: { m: ChatMessage; consultation: Consultation }) {
  const { confirmingId, setConfirmingId, removeMessage, deleting } = consultation;
  if (confirmingId !== m.id) return null;
  return (
    <div
      role="group"
      aria-label="Confirm delete"
      className="flex flex-col gap-3 rounded-xl border border-error-line bg-error-bg px-4 py-3 sm:flex-row sm:items-center"
      onKeyDown={(e) => {
        if (e.key === "Escape") setConfirmingId(null);
      }}
    >
      <p className="flex-1 text-[13px] leading-[1.5] text-error-ink">{deleteQuestion(m)}</p>
      <div className="flex shrink-0 gap-2 max-sm:[&>*]:flex-1">
        <Button variant="soft" size="sm" autoFocus onClick={() => setConfirmingId(null)} disabled={deleting} className="max-md:!h-11">
          Cancel
        </Button>
        <Button
          variant="danger"
          size="sm"
          className="!normal-case !text-[13px] !font-semibold tracking-normal max-md:!h-11"
          disabled={deleting}
          onClick={() => removeMessage(m.id)}
        >
          {deleting ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </div>
  );
}
