"use client";

import { useState } from "react";
import { CheckCircle2, FileText, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { offeredExtensions, useLimitsQuery } from "@/lib/cases/limits";
import { formatBytes } from "@/lib/format";
import type { GmailAttachment, GmailMessage } from "@/lib/gmail/api";
import { useImportGmailToCaseMutation } from "@/lib/gmail/queries";

const extensionOf = (name: string) => (name.includes(".") ? name.split(".").pop()!.toLowerCase() : "");

function Option({
  checked,
  disabled,
  onChange,
  icon,
  title,
  detail,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <label className={`flex items-start gap-3 px-4 py-3 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-subtle"}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-ink"
      />
      <span className="mt-0.5 shrink-0 text-ink-2">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] text-ink">{title}</span>
        <span className="block text-[12px] leading-[1.45] text-ink-2">{detail}</span>
      </span>
    </label>
  );
}

/**
 * Adds the open email to the case (EPIC #982, #986/#987): the email itself as a PDF, and the
 * attachments the client ticks, each as its own document. Nothing is copied until "Add to case".
 * Pictures shown inside the email (logos, signatures) aren't offered; attachments of a type a
 * case can't take are shown but can't be ticked. Mount with a `key` per message.
 */
export function AddToCasePanel({ caseId, message }: { caseId: string; message: GmailMessage }) {
  const { data: limits } = useLimitsQuery();
  const supported = new Set(offeredExtensions(limits));
  const files = message.attachments.filter((a) => !a.inline);
  const canAdd = (a: GmailAttachment) => supported.has(extensionOf(a.filename));

  const [includeEmail, setIncludeEmail] = useState(true);
  // Every attachment a case can take starts ticked; the client unticks what isn't relevant.
  const [picked, setPicked] = useState<Set<string>>(() => new Set(files.filter(canAdd).map((a) => a.partId)));
  const importMutation = useImportGmailToCaseMutation(caseId);

  const chosen = files.filter((a) => picked.has(a.partId) && canAdd(a));
  const count = (includeEmail ? 1 : 0) + chosen.length;

  const toggle = (partId: string, on: boolean) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (on) next.add(partId);
      else next.delete(partId);
      return next;
    });

  const add = () => importMutation.mutate({ messageId: message.id, includeEmail, attachmentPartIds: chosen.map((a) => a.partId) });

  if (importMutation.isSuccess) {
    const added = importMutation.data.documents;
    return (
      <section className="flex flex-col gap-2 rounded-card border border-line bg-white px-4 py-3.5">
        <p className="flex items-center gap-2 text-[13.5px] font-semibold text-ink">
          <CheckCircle2 size={16} aria-hidden className="shrink-0 text-success" />
          Added {added.length} {added.length === 1 ? "document" : "documents"} to this case
        </p>
        <ul className="flex flex-col gap-0.5 pl-6 text-[12.5px] text-ink-2">
          {added.map((d) => (
            <li key={d.id} className="truncate">
              {d.name}
            </li>
          ))}
        </ul>
        <p className="pl-6 text-[12px] text-muted">They’re in Documents now, and the AI can use them once they’ve been read.</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h4 className="text-[13px] font-semibold text-ink">Add to this case</h4>
        <p className="text-[12px] leading-[1.5] text-ink-2">Only what you tick is copied into the case, each as its own document.</p>
      </div>
      <div className="flex flex-col divide-y divide-line rounded-card border border-line bg-white">
        <Option
          checked={includeEmail}
          onChange={setIncludeEmail}
          icon={<FileText size={14} aria-hidden />}
          title="The email, as a PDF"
          detail="From, To, Cc, Bcc, date, subject and the full text"
        />
        {files.map((a) => (
          <Option
            key={a.partId}
            checked={canAdd(a) && picked.has(a.partId)}
            disabled={!canAdd(a)}
            onChange={(on) => toggle(a.partId, on)}
            icon={<Paperclip size={14} aria-hidden />}
            title={a.filename}
            detail={canAdd(a) ? formatBytes(a.size) : `${formatBytes(a.size)} · This file type can’t be added to a case`}
          />
        ))}
      </div>
      {importMutation.error && <ErrorBox message={(importMutation.error as Error).message} />}
      <Button variant="dark" onClick={add} disabled={count === 0 || importMutation.isPending} className="self-start">
        {importMutation.isPending ? "Adding…" : count === 0 ? "Add to case" : `Add ${count} to case`}
      </Button>
    </section>
  );
}
