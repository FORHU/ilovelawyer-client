"use client";

import { FileText } from "lucide-react";
import { cn } from "@/lib/cn";
import type { EngagementMessage } from "@/lib/client-handoff";
import { formatDateTime } from "@/lib/format";

/** One message in a thread with a lawyer: the client's on the right, the lawyer's on the left, and a
 * shared document as a small card. `large` is the phone's full-screen thread (15px text). */
export function LawyerMessage({ message, large = false }: { message: EngagementMessage; large?: boolean }) {
  const mine = message.author.side === "CLIENT";
  return (
    <li className={cn("flex flex-col gap-1", large ? "max-w-[88%]" : "max-w-[85%]", mine ? "items-end self-end" : "items-start self-start")}>
      <span className={cn("text-muted", large ? "text-[12px]" : "text-[11.5px]")}>
        {mine ? "You" : `${message.author.name} · Your lawyer`} · {formatDateTime(message.createdAt)}
      </span>
      {message.body && (
        <p
          className={cn(
            "whitespace-pre-wrap break-words rounded-card px-3.5 py-2",
            large ? "text-[15px] leading-[1.5]" : "text-[13px] leading-[1.6]",
            mine ? "bg-gold text-white" : "bg-subtle text-ink",
          )}
        >
          {message.body}
        </p>
      )}
      {message.document && (
        <div className="flex items-center gap-2.5 rounded-card border border-line px-3 py-2">
          <FileText size={16} className="shrink-0 text-muted" aria-hidden="true" />
          <div className="min-w-0">
            <div className={cn("truncate font-medium text-ink", large ? "text-[14px]" : "text-[13px]")}>{message.document.filename}</div>
            <div className="text-[11.5px] text-muted">
              Shared by {message.document.submittedBy.name} · {new Date(message.document.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
