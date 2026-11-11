"use client";

import { Paperclip } from "lucide-react";
import { formatDay } from "@/lib/format";
import type { GmailSearchRow } from "@/lib/gmail/api";

/** "Ana Cruz <ana@example.com>" reads as "Ana Cruz"; a bare address stays as it is. */
export function displayName(from: string | null): string {
  if (!from) return "Unknown sender";
  const name = /^\s*"?([^"<]+?)"?\s*</.exec(from)?.[1];
  return name?.trim() || from;
}

/** One email in a list (search results or "Suggest by AI"): sender, date, subject and preview,
 * plus `extra` below them (the AI's reason). Opens the email on click. */
export function MessageRow({ row, onOpen, extra }: { row: GmailSearchRow; onOpen: (id: string) => void; extra?: React.ReactNode }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(row.id)}
        className="flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-subtle focus-visible:bg-subtle focus-visible:outline-none"
      >
        <span className="flex items-baseline gap-3">
          <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink">{displayName(row.from)}</span>
          {row.attachmentNames.length > 0 && (
            <Paperclip size={13} aria-label={`${row.attachmentNames.length} attachments`} className="shrink-0 text-ink-2" />
          )}
          {row.date && <span className="shrink-0 text-[12px] tabular-nums text-ink-2">{formatDay(row.date)}</span>}
        </span>
        <span className="truncate text-[13.5px] text-ink">{row.subject || "(no subject)"}</span>
        <span className="line-clamp-2 text-[12.5px] leading-[1.5] text-ink-2">{row.snippet}</span>
        {extra}
      </button>
    </li>
  );
}
