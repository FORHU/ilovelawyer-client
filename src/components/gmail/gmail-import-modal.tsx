"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Download, Paperclip, Search } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ErrorBox } from "@/components/ui/banner";
import { useSession } from "@/lib/auth/session";
import { formatBytes, formatDateTime } from "@/lib/format";
import { downloadGmailAttachment, type GmailAttachment, type GmailMessage } from "@/lib/gmail/api";
import { useGmailMessage, useGmailSearch, useSuggestGmailMutation } from "@/lib/gmail/queries";
import { AddToCasePanel } from "./add-to-case-panel";
import { useAgreeToEmailImportMutation, useEmailImportConsent } from "@/lib/gmail/consent";
import { ConnectGmailButton, EmailImportConsentPoints } from "./connect-gmail-button";
import { EmailBodyFrame } from "./email-body-frame";
import { MessageRow } from "./message-row";
import { SuggestCard, SuggestionsView } from "./suggestions-view";

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

function NotConnected() {
  return (
    <div className="flex flex-col gap-4 py-2">
      <p className="text-[14px] leading-[1.6] text-ink-2">
        Connect your Gmail to find emails about this case, like messages from the other side, letters and the files attached to them.
      </p>
      <ConnectGmailButton />
    </div>
  );
}

/** Connected, but without email-import consent for the current text (#989): connected before it
 * was asked for, or the text has changed since. Nothing is read until the client agrees. */
function ConsentGate() {
  const agree = useAgreeToEmailImportMutation();
  return (
    <div className="flex flex-col gap-4 py-2">
      <p className="text-[14px] leading-[1.6] text-ink-2">Before we read your Gmail, please confirm you’re happy with how it works:</p>
      <EmailImportConsentPoints />
      {agree.error && <ErrorBox message={(agree.error as Error).message} />}
      <div className="flex flex-col items-start gap-2">
        <Button variant="dark" onClick={() => agree.mutate()} disabled={agree.isPending}>
          {agree.isPending ? "Saving…" : "I agree, continue"}
        </Button>
        <p className="text-[12px] text-muted">Not happy with this? Disconnect Gmail in Settings › Connected accounts.</p>
      </div>
    </div>
  );
}

function SearchView({
  state,
  onOpen,
  onSuggest,
  hasSuggestions,
}: {
  state: SearchState;
  onOpen: (id: string) => void;
  onSuggest: () => void;
  hasSuggestions: boolean;
}) {
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
      <SuggestCard onSuggest={onSuggest} hasResults={hasSuggestions} />
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
            <MessageRow key={row.id} row={row} onOpen={onOpen} />
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

function MessageDetails({ caseId, message }: { caseId: string; message: GmailMessage }) {
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
      <EmailBodyFrame html={message.htmlBody} text={message.textBody} />
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
      <AddToCasePanel caseId={caseId} message={message} />
    </div>
  );
}

function MessageView({ caseId, id, onBack }: { caseId: string; id: string; onBack: () => void }) {
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
        // Keyed by email so "Show images", the ticks and "Added" never carry over to the next one.
        <MessageDetails key={data.id} caseId={caseId} message={data} />
      )}
    </div>
  );
}

/**
 * Find emails for a case in the client's Gmail (EPIC #982, #983): connect, search or let the AI
 * suggest emails about the case (#984, #988), open an email, download its attachments, and add the
 * email (as a PDF) and chosen attachments to the case (#986/#987). A centred panel on web, a
 * bottom sheet on a phone (Modal).
 */
export function GmailImportModal({ caseId, open, onClose }: { caseId: string; open: boolean; onClose: () => void }) {
  const connected = useSession((s) => !!s.user?.gmailConnected);
  const gmailEmail = useSession((s) => s.user?.gmailEmail);
  const consented = useEmailImportConsent();
  const [openId, setOpenId] = useState<string | null>(null);
  const search = useSearchState();
  // "Suggest by AI" (#984): its results live here, like the search, so going back from an email
  // lands on them, and they stay until the client asks again.
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggest = useSuggestGmailMutation(caseId);
  const openSuggestions = () => {
    setShowSuggestions(true);
    if (!suggest.data && !suggest.isPending) suggest.mutate();
  };

  // A disconnect or reconnect starts over from the search, never on an email from the old grant.
  const [wasConnected, setWasConnected] = useState(connected);
  if (connected !== wasConnected) {
    setWasConnected(connected);
    setOpenId(null);
    setShowSuggestions(false);
  }
  // Suggestions from the old grant go too (outside render: reset notifies the mutation's observers).
  const resetSuggest = suggest.reset;
  useEffect(() => {
    resetSuggest();
  }, [connected, resetSuggest]);

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
      {!connected ? (
        <NotConnected />
      ) : consented === undefined ? (
        <p className="py-6 text-center text-[13px] text-ink-2">Loading…</p>
      ) : !consented ? (
        <ConsentGate />
      ) : openId ? (
        <MessageView caseId={caseId} id={openId} onBack={() => setOpenId(null)} />
      ) : showSuggestions ? (
        <SuggestionsView suggest={suggest} onBack={() => setShowSuggestions(false)} onOpen={setOpenId} />
      ) : (
        <SearchView state={search} onOpen={setOpenId} onSuggest={openSuggestions} hasSuggestions={!!suggest.data} />
      )}
    </Modal>
  );
}
