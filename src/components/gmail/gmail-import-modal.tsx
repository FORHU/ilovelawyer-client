"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, Download, Paperclip, Search } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ErrorBox } from "@/components/ui/banner";
import { useSession } from "@/lib/auth/session";
import { formatBytes, formatDateTime, formatDay } from "@/lib/format";
import { downloadGmailAttachment, type GmailAttachment, type GmailMessage } from "@/lib/gmail/api";
import { useGmailMessage, useGmailSearch } from "@/lib/gmail/queries";
import { ConnectGmailButton } from "./connect-gmail-button";
import { EmailBodyFrame } from "./email-body-frame";

/** Quick filters, as the Gmail search operators they add to the typed search. */
const FILTERS = [
  { id: "attachments", label: "Has attachments", operator: "has:attachment" },
  { id: "year", label: "Last 12 months", operator: "newer_than:1y" },
  { id: "promotions", label: "Hide promotions", operator: "-category:promotions -category:social" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

const DEFAULT_FILTERS: FilterId[] = ["promotions"];

/** What the client typed, searched and filtered by. Held by GmailImportModal, above the search and
 * message views, so going back from an email lands on the same results. */
function useSearchState() {
  const [typed, setTyped] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [filters, setFilters] = useState<Set<FilterId>>(() => new Set(DEFAULT_FILTERS));
  return { typed, setTyped, submitted, setSubmitted, filters, setFilters };
}

type SearchState = ReturnType<typeof useSearchState>;

/** "Ana Cruz <ana@example.com>" reads as "Ana Cruz"; a bare address stays as it is. */
function displayName(from: string | null): string {
  if (!from) return "Unknown sender";
  const name = /^\s*"?([^"<]+?)"?\s*</.exec(from)?.[1];
  return name?.trim() || from;
}

function NotConnected() {
  return (
    <div className="flex flex-col gap-4 py-2">
      <p className="text-[14px] leading-[1.6] text-ink-2">
        Connect your Gmail to find emails about this case, like messages from the other side, letters and the files attached to them.
      </p>
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[13px] leading-[1.55] text-ink-2">
        <li>Read-only. We can’t send, change or delete your email.</li>
        <li>We only look at your inbox when you search here.</li>
        <li>Nothing is added to your case until you choose it.</li>
      </ul>
      <ConnectGmailButton />
    </div>
  );
}

function SearchView({ state, onOpen }: { state: SearchState; onOpen: (id: string) => void }) {
  const { typed, setTyped, submitted, setSubmitted, filters, setFilters } = state;

  const q = [submitted, ...FILTERS.filter((f) => filters.has(f.id)).map((f) => f.operator)].filter(Boolean).join(" ");
  const search = useGmailSearch(q);
  const rows = search.data?.pages.flatMap((p) => p.messages) ?? [];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(typed.trim());
  };
  const toggle = (id: FilterId) =>
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="flex gap-2">
        <label className="relative flex min-w-0 flex-1 items-center">
          <Search size={15} aria-hidden className="pointer-events-none absolute left-3.5 text-ink-2" />
          <input
            id="gmail-search"
            type="search"
            aria-label="Search your Gmail"
            placeholder="Name, email address or words, e.g. landlord deposit"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="h-[42px] w-full rounded-full border border-line-input bg-white pl-[38px] pr-3.5 text-[14px] outline-none focus-visible:border-gold"
          />
        </label>
        <Button type="submit" variant="dark" className="!h-[42px] !px-5">
          Search
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Chip key={f.id} small selected={filters.has(f.id)} onClick={() => toggle(f.id)}>
            {f.label}
          </Chip>
        ))}
      </div>
      <p className="text-[12px] text-muted">
        Gmail search words work here too, such as <code className="font-mono">from:</code>, <code className="font-mono">subject:</code> and{" "}
        <code className="font-mono">before:2025/06/01</code>.
      </p>

      {search.error && <ErrorBox message={(search.error as Error).message} />}

      {search.isPending && !search.error ? (
        <p className="py-6 text-center text-[13px] text-ink-2">Searching your Gmail…</p>
      ) : rows.length === 0 && !search.error ? (
        <p className="py-6 text-center text-[13px] text-ink-2">No emails match. Try fewer words or turn off a filter.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-white">
          {rows.map((row) => (
            <li key={row.id}>
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
              </button>
            </li>
          ))}
        </ul>
      )}

      {search.hasNextPage && (
        <Button variant="soft" onClick={() => search.fetchNextPage()} disabled={search.isFetchingNextPage} className="self-center">
          {search.isFetchingNextPage ? "Loading…" : "Show more"}
        </Button>
      )}
    </div>
  );
}

function HeaderRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid grid-cols-[56px_1fr] gap-3 text-[13px] leading-[1.5]">
      <dt className="text-ink-2">{label}</dt>
      <dd className="min-w-0 break-words text-ink">{value ?? <span className="text-muted">Not available</span>}</dd>
    </div>
  );
}

function AttachmentRow({ messageId, attachment }: { messageId: string; attachment: GmailAttachment }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const download = async () => {
    setBusy(true);
    setError(null);
    try {
      await downloadGmailAttachment(messageId, attachment);
    } catch (err) {
      setError((err as Error).message || "Couldn't download this file.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <li className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-center gap-3">
        <Paperclip size={14} aria-hidden className="shrink-0 text-ink-2" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] text-ink">{attachment.filename}</span>
          <span className="text-[12px] text-ink-2">
            {formatBytes(attachment.size)}
            {attachment.inline && " · shown in the email"}
          </span>
        </span>
        <Button variant="soft" size="sm" onClick={download} disabled={busy} className="!h-[34px] !px-3.5">
          <Download size={13} aria-hidden />
          {busy ? "Downloading…" : "Download"}
        </Button>
      </div>
      {error && <ErrorBox message={error} />}
    </li>
  );
}

function MessageDetails({ message }: { message: GmailMessage }) {
  const files = [...message.attachments].sort((a, b) => Number(a.inline) - Number(b.inline));
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-display text-[22px] leading-[1.25] tracking-[-0.01em] text-ink">{message.subject || "(no subject)"}</h3>
      <dl className="flex flex-col gap-1 rounded-card border border-line bg-white px-4 py-3">
        <HeaderRow label="From" value={message.from} />
        <HeaderRow label="To" value={message.to} />
        {message.cc && <HeaderRow label="Cc" value={message.cc} />}
        <HeaderRow label="Bcc" value={message.bcc} />
        <HeaderRow label="Date" value={message.date ? formatDateTime(message.date) : message.dateHeader} />
      </dl>
      {/* Keyed by email so "Show images" never carries over to the next one opened. */}
      <EmailBodyFrame key={message.id} html={message.htmlBody} text={message.textBody} />
      {files.length > 0 && (
        <section className="flex flex-col gap-2">
          <h4 className="text-[13px] font-semibold text-ink">
            {files.length} {files.length === 1 ? "attachment" : "attachments"}
          </h4>
          <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-white">
            {files.map((a) => (
              <AttachmentRow key={a.partId} messageId={message.id} attachment={a} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function MessageView({ id, onBack }: { id: string; onBack: () => void }) {
  const { data, error, isPending } = useGmailMessage(id);
  return (
    <div className="flex flex-col gap-4">
      <Button variant="quiet" onClick={onBack} className="self-start !px-0">
        <ArrowLeft size={14} aria-hidden />
        Back to results
      </Button>
      {error ? (
        <ErrorBox message={(error as Error).message} />
      ) : isPending ? (
        <p className="py-6 text-center text-[13px] text-ink-2">Opening email…</p>
      ) : (
        <MessageDetails message={data} />
      )}
    </div>
  );
}

/**
 * Find emails for a case in the client's Gmail (EPIC #982, #983): connect, search, open an email
 * and download its attachments. Adding an email to the case comes in a later step. A centred
 * panel on web, a bottom sheet on a phone (Modal).
 */
export function GmailImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const connected = useSession((s) => !!s.user?.gmailConnected);
  const gmailEmail = useSession((s) => s.user?.gmailEmail);
  const [openId, setOpenId] = useState<string | null>(null);
  const search = useSearchState();

  // A disconnect or reconnect starts over from the search, never on an email from the old grant.
  const [wasConnected, setWasConnected] = useState(connected);
  if (connected !== wasConnected) {
    setWasConnected(connected);
    setOpenId(null);
  }

  // Reopening starts on the results (the search itself is kept), not on the last email viewed.
  const close = () => {
    setOpenId(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="xl"
      title="Find emails in Gmail"
      subtitle={connected && gmailEmail ? `Searching ${gmailEmail}` : undefined}
    >
      {!connected ? <NotConnected /> : openId ? <MessageView id={openId} onBack={() => setOpenId(null)} /> : <SearchView state={search} onOpen={setOpenId} />}
    </Modal>
  );
}
