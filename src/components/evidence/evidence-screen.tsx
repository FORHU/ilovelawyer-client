"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, FileText, Image as ImageIcon, Loader2, Lock, Mail, Mic, Plus, Sparkles, WifiOff } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { ChatBar, ChatScreen } from "@/components/mobile/chat";
import { FilePicker } from "@/components/ui/file-picker";
import { useDevice } from "@/components/device/device-provider";
import { useT } from "@/components/site/language-provider";
import { cn } from "@/lib/cn";
import { msg } from "@/lib/i18n/msg";
import { SOURCE_ACCEPT, SOURCE_ACTION, checklistOf, type EvidenceSuggestion } from "@/lib/cases/evidence";
import type { CaseDocument } from "@/lib/types";
import { GmailImportModal } from "@/components/gmail/gmail-import-modal";
import { StepPage, StepTopRow } from "@/components/steps/step-page";
import { MemoRecorder } from "./memo-recorder";
import { useEvidence, type EvidenceController } from "./use-evidence";

/** The evidence step after the questions (/cases/:id/evidence): proof suggested from the client's
 * story and answers, added by photo or file, each with a short note the AI drafts and the client can
 * change. Phone and desktop share the screen; on a phone Done sits in a bar at the bottom. */
export function EvidenceScreen({ caseId }: { caseId: string }) {
  const e = useEvidence(caseId);
  const t = useT();
  const mobile = useDevice() === "mobile";
  const caseHref = `/cases/${caseId}`;

  const header = (
    <header className="flex shrink-0 flex-col gap-2.5 px-4 pt-3 pb-2 md:px-0 md:pt-6">
      <StepTopRow
        caseHref={caseHref}
        aside={<span className="text-[11px] font-semibold uppercase tracking-[1.2px] text-ink-2 tabular-nums">{t("{count} added", { count: e.documents.length })}</span>}
      />
      <h1 className="font-display text-[26px] leading-[1.15] tracking-[-0.02em] md:text-[30px]">{e.finished ? t("Your case is ready") : t("Add your proof")}</h1>
    </header>
  );

  const body = e.finished ? <AllSet e={e} /> : <Collect e={e} />;
  const bar = e.finished ? <AllSetActions e={e} caseHref={caseHref} /> : <CollectActions e={e} caseHref={caseHref} />;

  if (mobile) {
    return (
      <ChatScreen>
        {header}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 py-4">{body}</div>
        </div>
        <ChatBar>{bar}</ChatBar>
      </ChatScreen>
    );
  }
  return (
    <StepPage header={header} bar={bar}>
      {body}
    </StepPage>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[1.2px] text-ink-2">{title}</h2>
      {children}
    </section>
  );
}

/** Adding proof: the suggestions, + Add proof, and what's in the case. */
function Collect({ e }: { e: EvidenceController }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-6">
      <p className="flex items-center gap-2 text-[13.5px] text-ink-2">
        <Lock size={14} className="shrink-0" aria-hidden="true" />
        {t("Only you can see these until you choose a lawyer.")}
      </p>
      {!e.online && (
        <p role="status" className="flex items-center gap-2 rounded-xl border border-warn-line bg-warn-bg px-3.5 py-2.5 text-[13.5px] text-warn-ink">
          <WifiOff size={16} className="shrink-0" aria-hidden="true" />
          {t("You’re offline. You can add proof when you’re back online.")}
        </p>
      )}

      <Section title={t("Suggested for your case")}>
        {e.evidence.isPending ? (
          <p role="status" className="flex items-center gap-2.5 text-[14px] text-ink-2">
            <Loader2 size={16} className="text-gold motion-safe:animate-spin" aria-hidden="true" />
            {t("Finding what would help your case…")}
          </p>
        ) : e.evidence.isError ? (
          <div className="flex flex-wrap items-center gap-3 text-[14px] text-ink-2">
            <span role="alert">{t("We couldn’t suggest anything just now. You can still add what you have.")}</span>
            <Button variant="soft" size="sm" onClick={() => void e.evidence.refetch()} disabled={e.evidence.isFetching}>
              {t("Try again")}
            </Button>
          </div>
        ) : (
          // Two across on a wide screen, so the suggestions don't run down the page.
          <ul className="grid gap-2.5 lg:grid-cols-2">
            {e.suggestions.map((s) => (
              <SuggestionCard key={s.id} s={s} e={e} />
            ))}
          </ul>
        )}
      </Section>

      <Section title={t("Add other proof")}>
        <div className="grid gap-2 sm:grid-cols-3">
          <FilePicker onPick={(files) => e.upload(files)}>
            {(open) => (
              <AddButton onClick={open} disabled={!e.online} icon={<Plus size={16} aria-hidden="true" />}>
                {t("Photos or files")}
              </AddButton>
            )}
          </FilePicker>
          <AddButton onClick={() => e.openMemo(null)} disabled={!e.online} icon={<Mic size={16} aria-hidden="true" />}>
            {t("Voice memo")}
          </AddButton>
          <AddButton onClick={() => e.openEmail(null)} disabled={!e.online} icon={<Mail size={16} aria-hidden="true" />}>
            {t("Emails from Gmail")}
          </AddButton>
        </div>
      </Section>

      {e.memoFor !== undefined && <MemoRecorder onAdd={e.addMemo} onClose={e.closeMemo} adding={e.addingMemo} />}
      <GmailImportModal caseId={e.caseId} open={e.emailFor !== undefined} onClose={e.closeEmail} suggestionId={e.emailFor ?? undefined} />

      {(e.rejected.length > 0 || e.error) && (
        <div role="alert" className="flex flex-col gap-1 text-[13.5px] text-error">
          {e.rejected.map((r) => (
            <p key={r}>{r}</p>
          ))}
          {e.error && <p>{e.error}</p>}
        </div>
      )}

      {(e.uploading.length > 0 || e.failed.length > 0 || e.documents.length > 0) && (
        <Section title={t("In your case")}>
          <ul className="flex flex-col gap-2.5">
            {e.uploading.map((u, i) => (
              <li key={`up-${u.name}-${i}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3 text-[14px]">
                <Loader2 size={16} className="shrink-0 text-gold motion-safe:animate-spin" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{u.name}</span>
                <span className="text-[12.5px] text-ink-2">{t("Uploading…")}</span>
              </li>
            ))}
            {e.failed.map((f, i) => (
              <li key={`failed-${f.file.name}-${i}`} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl border border-error-line bg-error-bg px-3.5 py-3 text-[14px]">
                <span className="min-w-0 flex-1 truncate font-medium">{f.file.name}</span>
                <span className="text-[12.5px] text-error-ink">{t("Didn’t upload.")}</span>
                <Button variant="soft" size="sm" onClick={() => e.retry(f)} disabled={!e.online}>
                  {t("Try again")}
                </Button>
                <Button variant="quiet" size="sm" onClick={() => e.forget(f)}>
                  {t("Remove")}
                </Button>
              </li>
            ))}
            {e.documents.map((d) => (
              <DocumentRow key={d.id} doc={d} e={e} />
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

const SOURCE_ICON = { photos: ImageIcon, files: FileText, email: Mail, memo: Mic } as const;

/** One way to add proof that isn't on the suggested list. */
function AddButton({ onClick, disabled, icon, children }: { onClick: () => void; disabled: boolean; icon: ReactNode; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-no-tap
      className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-dashed border-line-input px-3 text-[14px] font-medium text-ink transition-colors hover:border-line-hover disabled:opacity-40"
    >
      {icon}
      {children}
    </button>
  );
}

function SuggestionCard({ s, e }: { s: EvidenceSuggestion; e: EvidenceController }) {
  const t = useT();
  const Icon = SOURCE_ICON[s.source];
  const filledBy = s.documentId ? e.documents.find((d) => d.id === s.documentId) : null;
  return (
    <li className={cn("flex flex-col gap-2 rounded-2xl border px-4 py-3.5", s.state === "DISMISSED" ? "border-line bg-subtle" : "border-line bg-surface")}>
      <div className="flex items-start gap-2.5">
        <Icon size={17} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className={cn("text-[15px] font-semibold leading-snug", s.state === "DISMISSED" && "text-ink-2")}>{s.title}</p>
          {s.why && <p className="text-[13.5px] leading-[1.45] text-ink-2">{s.why}</p>}
        </div>
        {s.state === "ADDED" && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-[12px] font-semibold text-success-ink">
            <Check size={12} aria-hidden="true" />
            {t("Added")}
          </span>
        )}
      </div>
      {s.state === "ADDED" && filledBy && <p className="truncate pl-7 text-[12.5px] text-ink-2">{filledBy.name}</p>}
      {s.state === "OPEN" && (
        <div className="flex flex-wrap items-center gap-2 pl-7">
          {s.source === "email" || s.source === "memo" ? (
            <>
              {/* Emails come from Gmail and memos are recorded here; a screenshot or a recording on
                  the device is always a way too. */}
              <Button variant="soft" size="sm" onClick={() => (s.source === "email" ? e.openEmail(s.id) : e.openMemo(s.id))} disabled={!e.online}>
                {t(SOURCE_ACTION[s.source])}
              </Button>
              <FilePicker accept={SOURCE_ACCEPT[s.source]} onPick={(files) => e.upload(files, s.id)}>
                {(open) => (
                  <Button variant="quiet" size="sm" onClick={open} disabled={!e.online}>
                    {t("Add a file instead")}
                  </Button>
                )}
              </FilePicker>
            </>
          ) : (
            <FilePicker accept={SOURCE_ACCEPT[s.source]} onPick={(files) => e.upload(files, s.id)}>
              {(open) => (
                <Button variant="soft" size="sm" onClick={open} disabled={!e.online}>
                  {t(SOURCE_ACTION[s.source])}
                </Button>
              )}
            </FilePicker>
          )}
          <Button variant="quiet" size="sm" onClick={() => e.setDismissed(s.id, true)} disabled={e.dismissing}>
            {t("I don’t have this")}
          </Button>
        </div>
      )}
      {s.state === "DISMISSED" && (
        <div className="flex flex-wrap items-center gap-2 pl-7 text-[13px] text-ink-2">
          <span>{t("You don’t have this. Your lawyer can ask about it.")}</span>
          <Button variant="quiet" size="sm" onClick={() => e.setDismissed(s.id, false)} disabled={e.dismissing}>
            {t("Undo")}
          </Button>
        </div>
      )}
    </li>
  );
}

const PHOTO = msg("Photo");
const RECORDING = msg("Recording");
const KIND_OF: Record<string, string> = { jpg: PHOTO, jpeg: PHOTO, png: PHOTO, webp: PHOTO, heic: PHOTO, mp3: RECORDING, m4a: RECORDING, wav: RECORDING, webm: RECORDING, mp4: msg("Video") };
const kindOf = (name: string) => KIND_OF[name.split(".").pop()?.toLowerCase() ?? ""] ?? msg("Document");

/** One document in the case: what it is, its note (drafted, the client's, or none yet), and changing
 * or removing it. */
function DocumentRow({ doc, e }: { doc: CaseDocument; e: EvidenceController }) {
  const t = useT();
  const status = e.noteStatus(doc);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [removing, setRemoving] = useState(false);
  const startEditing = () => {
    setDraft(doc.note ?? "");
    setEditing(true);
  };

  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-line bg-surface px-3.5 py-3">
      <div className="flex items-center gap-3">
        <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{doc.name}</span>
        <span className="shrink-0 text-[12px] text-ink-2">{t(kindOf(doc.name))}</span>
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <label htmlFor={`note-${doc.id}`} className="sr-only">
            {t("Note about {name}", { name: doc.name })}
          </label>
          <textarea
            id={`note-${doc.id}`}
            value={draft}
            onChange={(ev) => setDraft(ev.target.value)}
            rows={3}
            maxLength={500}
            autoFocus
            placeholder={t("What is it, and what does it show?")}
            className="w-full resize-y rounded-xl border border-line-input bg-surface px-3 py-2.5 text-base leading-normal outline-none focus:border-line-hover"
          />
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={() => e.saveNote(doc.id, draft, () => setEditing(false))} disabled={e.savingNote || !e.online}>
              {t("Save note")}
            </Button>
            <Button variant="quiet" size="sm" onClick={() => setEditing(false)}>
              {t("Cancel")}
            </Button>
          </div>
        </div>
      ) : status === "reading" || status === "drafting" ? (
        <p role="status" className="flex items-center gap-2 text-[13px] text-ink-2">
          <Loader2 size={14} className="text-gold motion-safe:animate-spin" aria-hidden="true" />
          {status === "reading" ? t("Reading it…") : t("Writing a note about it…")}
        </p>
      ) : status === "note" ? (
        <div className="flex flex-col gap-1">
          <p className="text-[14px] leading-normal text-ink">{doc.note}</p>
          <div className="flex flex-wrap items-center gap-x-3 text-[12.5px] text-ink-2">
            {doc.noteBy === "AI" && (
              <span className="flex items-center gap-1">
                <Sparkles size={12} className="text-gold" aria-hidden="true" />
                {t("Drafted by AI. Edit anything.")}
              </span>
            )}
            <button type="button" onClick={startEditing} className="min-h-9 font-medium underline underline-offset-4 hover:text-ink">
              {t("Edit note")}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 text-[13px] text-ink-2">
          {status === "failed" && <span className="text-error">{t("We couldn’t read this one.")}</span>}
          <button type="button" onClick={startEditing} className="min-h-9 font-medium underline underline-offset-4 hover:text-ink">
            {t("Add a note")}
          </button>
        </div>
      )}

      {!editing && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-2 text-[12.5px]">
          {removing ? (
            <>
              <span className="text-ink-2">{t("Remove this from your case?")}</span>
              <Button variant="soft" size="sm" onClick={() => e.remove(doc.id)} disabled={e.removing}>
                {t("Remove")}
              </Button>
              <Button variant="quiet" size="sm" onClick={() => setRemoving(false)}>
                {t("Keep it")}
              </Button>
            </>
          ) : (
            <button type="button" onClick={() => setRemoving(true)} className="min-h-9 text-ink-2 underline underline-offset-4 hover:text-ink">
              {t("Remove")}
            </button>
          )}
        </div>
      )}
    </li>
  );
}

function CollectActions({ e, caseHref }: { e: EvidenceController; caseHref: string }) {
  const t = useT();
  const mobile = useDevice() === "mobile";
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center">
      <Button variant="primary" size="lg" className={cn(mobile && "w-full")} onClick={e.finish} disabled={e.finishing || e.uploading.length > 0 || !e.online} aria-busy={e.finishing}>
        {e.finishing && <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" />}
        {t("Done")}
      </Button>
      <Link href={caseHref} className={buttonClass("quiet", "lg", mobile ? "w-full" : undefined)}>
        {t("Skip for now")}
      </Link>
    </div>
  );
}

/** "Your case is ready": what the case has, from what's already known. */
function AllSet({ e }: { e: EvidenceController }) {
  const t = useT();
  const rows = checklistOf({ questions: e.questions, documents: e.documents.length, evidence: e.evidence.data });
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[15px] leading-[1.55] text-ink-2">{t("Here’s what your case has. You can add more any time.")}</p>
      <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-surface">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-3 px-4 py-3 text-[14.5px]">
            <span>{t(r.label)}</span>
            <span className={cn("rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold", r.tone === "ok" ? "bg-success-bg text-success-ink" : "bg-subtle text-ink-2")}>
              {t(r.value, r.vars)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AllSetActions({ e, caseHref }: { e: EvidenceController; caseHref: string }) {
  const t = useT();
  const mobile = useDevice() === "mobile";
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center">
      <Link href={caseHref} className={buttonClass("primary", "lg", mobile ? "w-full" : undefined)}>
        {t("Open my case")}
      </Link>
      <Button variant="soft" size="lg" className={cn(mobile && "w-full")} onClick={e.addMore}>
        {t("Add more")}
      </Button>
    </div>
  );
}
