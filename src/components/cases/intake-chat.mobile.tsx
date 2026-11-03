"use client";

import { ArrowUp, FileText, Mic, Paperclip, Sparkles, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ErrorBox } from "@/components/ui/banner";
import { FilePicker } from "@/components/ui/file-picker";
import { inputClass, WizardLabel } from "@/components/ui/input";
import { ChatBar, ChatScreen, ComposerButton, ComposerPill, QuickReplies, ReplyChip } from "@/components/mobile/chat";
import { cn } from "@/lib/cn";
import type { IntakeMessage } from "@/lib/cases/use-intake-chat";
import { sideLabel } from "@/lib/types";
import { REGIONS, STARTERS, type IntakeViewProps } from "./use-intake-controller";

function AiMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span aria-hidden="true" className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-warn-bg text-gold">
        <Sparkles size={14} />
      </span>
      <div className="min-w-0 max-w-[calc(100%-36px)] whitespace-pre-line rounded-[4px_18px_18px_18px] bg-bubble px-3.5 py-2.5 text-[15px] leading-[1.5] text-ink">
        <span className="sr-only">ilovelawyer AI: </span>
        {children}
      </div>
    </div>
  );
}

function Message({ m }: { m: IntakeMessage }) {
  if (m.role === "ai") return <AiMessage>{m.text}</AiMessage>;
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-[18px_4px_18px_18px] bg-primary px-3.5 py-2.5 text-[15px] leading-[1.5] text-white">
        <span className="sr-only">You: </span>
        {m.text}
      </div>
    </div>
  );
}

/** One line of the review: the label above, the answer below, so long answers get the full width. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line py-3 last:border-b-0">
      <dt className="text-[12px] text-muted">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap break-words text-[14px] leading-[1.45] text-ink">{children}</dd>
    </div>
  );
}

export function IntakeChatMobile({ creating, error, onCreate, onEditDetails, hasDraft, onUseForm, controller: c }: IntakeViewProps) {
  const { chat, areas, step, typing, files, draft, text, setText, recorder, rejected, endRef, box, empty } = c;

  const showChoices = !typing && c.choiceStep;
  const formLink = hasDraft ? "Resume your form draft" : "Prefer a form? Fill it in instead";

  const composer = (
    <>
      {rejected.length > 0 && (
        <div role="alert" className="mb-2 px-1 text-[13px] text-error">
          {rejected.join(" ")}
        </div>
      )}
      {files.length > 0 && (
        <ul className="no-scrollbar -mx-3 mb-2 flex gap-1.5 overflow-x-auto px-3" aria-label="Attached files">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="inline-flex min-h-9 max-w-[70%] shrink-0 items-center gap-1.5 rounded-full bg-chip pl-3 pr-1 text-[13px] text-ink">
              <FileText size={13} className="shrink-0 text-gold" aria-hidden="true" />
              <span className="truncate">{f.name}</span>
              <button type="button" aria-label={`Remove ${f.name}`} onClick={() => chat.removeFile(i)} className="flex size-9 items-center justify-center rounded-full text-ink-2 active:bg-ink/10">
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {empty && recorder.error && (
        <div role="alert" className="mb-2 px-1 text-[13px] text-error">
          {recorder.error}
        </div>
      )}
      <ComposerPill data-tour="chatbox">
        {empty && recorder.state === "recording" ? (
          <>
            <ComposerButton onClick={recorder.cancel} aria-label="Cancel recording">
              <X size={20} aria-hidden="true" />
            </ComposerButton>
            <div role="status" aria-label="Recording" className="flex min-h-11 flex-1 items-center justify-center gap-2.5 text-[14px]">
              <span aria-hidden className="size-2.5 rounded-full bg-error motion-safe:animate-pulse" />
              <span className="text-ink-2">Recording</span>
            </div>
            <ComposerButton tone="send" onClick={recorder.stop} aria-label="Stop and send recording">
              <Square size={16} className="fill-current" aria-hidden="true" />
            </ComposerButton>
          </>
        ) : (
          <>
            <FilePicker onPick={c.addFiles}>
              {(open) => (
                <ComposerButton onClick={open} disabled={!c.canAttach} aria-label="Attach documents">
                  <Paperclip size={20} aria-hidden="true" />
                </ComposerButton>
              )}
            </FilePicker>
            <textarea
              ref={box}
              rows={1}
              value={text}
              disabled={c.choiceStep || creating}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={c.onKey}
              placeholder={c.placeholder}
              aria-label={c.placeholder}
              enterKeyHint="send"
              // 24px of text + 10px above and below = 44px, the height of the round buttons beside it.
              className="min-h-11 min-w-0 flex-1 resize-none bg-transparent px-1 py-2.5 text-base leading-6 text-ink outline-none placeholder:text-muted disabled:cursor-not-allowed"
            />
            {empty && (
              <ComposerButton onClick={recorder.start} disabled={creating || recorder.state === "requesting"} aria-label="Record a voice message">
                <Mic size={20} aria-hidden="true" />
              </ComposerButton>
            )}
            <ComposerButton tone="send" onClick={c.send} disabled={!text.trim() || typing || creating} aria-label="Send">
              <ArrowUp size={20} aria-hidden="true" />
            </ComposerButton>
          </>
        )}
      </ComposerPill>
    </>
  );

  if (empty) {
    return (
      <ChatScreen>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-6 text-center">
          <h1 className="text-balance font-display text-[30px] font-normal leading-[1.1] tracking-[-0.02em]">What&apos;s going on?</h1>
          <p className="mt-2.5 max-w-[320px] text-[15px] leading-[1.5] text-ink-2">
            Tell us in your own words. We&apos;ll ask a few questions and set up your case.
          </p>
          <button
            type="button"
            onClick={onUseForm}
            data-tour="opt-form"
            data-no-tap
            className="mt-4 flex min-h-11 items-center justify-center gap-2 text-[14px] font-medium text-ink-2 underline underline-offset-4"
          >
            {formLink}
          </button>
        </div>

        <ChatBar>
          {/* Starters sit right above the composer, small, in a row that scrolls sideways. */}
          <div data-tour="starters" role="group" aria-label="Not sure where to start?" className="no-scrollbar -mx-3 mb-2 flex gap-1.5 overflow-x-auto px-3">
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => chat.submitText(s)}
                data-no-tap
                className="min-h-9 shrink-0 whitespace-nowrap rounded-full border border-line-chip bg-subtle px-3.5 text-[13px] font-medium text-ink active:bg-chip"
              >
                {s}
              </button>
            ))}
          </div>
          {composer}
          <p className="mt-2 text-center text-[11.5px] leading-[1.4] text-muted">AI guidance, not legal advice.</p>
        </ChatBar>
      </ChatScreen>
    );
  }

  const textStepSkip = !typing && (step === "where" || step === "others" || step === "want");

  return (
    <ChatScreen>
      <div role="log" aria-label="Conversation with ilovelawyer AI" aria-live="polite" className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 px-4 py-4">
          {c.messages.map((m) => (
            <Message key={m.id} m={m} />
          ))}

          {typing && (
            <AiMessage>
              <span className="sr-only">is typing</span>
              <span aria-hidden="true" className="flex h-[22px] items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="size-1.5 rounded-full bg-muted motion-safe:animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </span>
            </AiMessage>
          )}

          {!typing && step === "check" && (
            <section aria-label="Check your case" className="flex flex-col gap-4 rounded-modal border border-warn-line bg-warn-bg/40 p-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[1.2px] text-gold">Check your case</div>
                <div className="mt-1 text-[13px] leading-[1.45] text-ink-2">Filled in from our chat. Change anything before you create it.</div>
              </div>

              <div className="flex flex-col gap-2">
                <WizardLabel htmlFor="intake-title">Case name *</WizardLabel>
                <input
                  id="intake-title"
                  value={draft.title}
                  maxLength={150}
                  aria-invalid={c.titleMissing}
                  aria-describedby={c.titleMissing ? "intake-title-err" : undefined}
                  onChange={(e) => chat.patchDraft({ title: e.target.value })}
                  className={cn(inputClass, "bg-white font-display text-[17px]", c.titleMissing && "border-error-field")}
                />
                {c.titleMissing && (
                  <div id="intake-title-err" className="text-[13px] text-error">
                    Give your case a name before creating it.
                  </div>
                )}
              </div>

              <dl className="rounded-input border border-line bg-white px-4">
                <Row label="Type of issue">{c.areaNames || "Not set"}</Row>
                <Row label="Part of the UK">{draft.region ? (draft.region === "OUTSIDE_UK" ? "Outside the UK" : draft.region) : "Not set"}</Row>
                {draft.where && <Row label="Town or city">{draft.where}</Row>}
                <Row label="Your side">{draft.side ? sideLabel(draft.side) : "Not set"}</Row>
                <Row label="What happened">{draft.happened || "Not set"}</Row>
                <Row label="What you want">{draft.wants || "Not set"}</Row>
                {draft.others.length > 0 && <Row label="Others involved">{draft.others.map((o) => o.name).join(", ")}</Row>}
                {files.length > 0 && <Row label="Attached files">{files.map((f) => f.name).join(", ")}</Row>}
              </dl>

              {(draft.areas.length === 0 || !draft.region) && (
                <div className="text-[13px] text-error">A type of issue and a part of the UK are needed. Use Edit details to add them.</div>
              )}
            </section>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <ChatBar>
        {showChoices && step === "type" && (
          <div role="group" aria-label="Type of issue" className="flex flex-col gap-3">
            <div className="flex max-h-[38dvh] flex-wrap gap-2 overflow-y-auto">
              {areas.map((a) => (
                <Chip key={a.code} selected={draft.areas.includes(a.code)} onClick={() => chat.toggleArea(a.code)} className="min-h-11">
                  {a.name}
                </Chip>
              ))}
            </div>
            {c.areasQuery.isError && <div className="text-[13px] text-error">Couldn&apos;t load the types of issue. Refresh to try again.</div>}
            <Button size="lg" className="w-full" disabled={draft.areas.length === 0} onClick={chat.confirmAreas}>
              Continue
            </Button>
          </div>
        )}

        {showChoices && step === "region" && (
          <div role="group" aria-label="Which part of the UK?" className="grid grid-cols-2 gap-2">
            {REGIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => chat.chooseRegion(r.value, r.label)}
                className={cn(
                  "min-h-12 rounded-card border border-line-input bg-white px-3 text-[14px] font-medium text-ink active:bg-chip",
                  r.value === "OUTSIDE_UK" && "col-span-2",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}

        {showChoices && step === "side" && (
          <div role="group" aria-label="Which side are you on?" className="flex flex-col gap-2">
            {[
              { value: "CLAIMANT", label: "I'm bringing the complaint" },
              { value: "RESPONDENT", label: "I'm responding to one" },
              { value: "", label: "Not sure yet" },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => chat.chooseSide(o.value as "CLAIMANT" | "RESPONDENT" | "", o.label)}
                className="min-h-12 rounded-card border border-line-input bg-white px-4 text-left text-[15px] font-medium text-ink active:bg-chip"
              >
                {o.label}
              </button>
            ))}
          </div>
        )}

        {!typing && step === "check" && (
          <>
            {error && <ErrorBox message={error} />}
            <div className="flex gap-2">
              <Button variant="outline" size="lg" className="flex-1" disabled={creating} onClick={() => onEditDetails(draft, files)}>
                Edit details
              </Button>
              <Button
                size="lg"
                className="flex-[1.4]"
                disabled={creating || c.titleMissing || draft.areas.length === 0 || !draft.region}
                onClick={() => onCreate(draft, files)}
              >
                {creating ? "Creating…" : "Create case"}
              </Button>
            </div>
            <div className="mt-2.5">{composer}</div>
          </>
        )}

        {!showChoices && step !== "check" && (
          <>
            {textStepSkip && (
              <QuickReplies label="Quick replies">
                <ReplyChip onClick={chat.skip}>{step === "others" ? "Done" : "Skip"}</ReplyChip>
              </QuickReplies>
            )}
            {!typing && step === "more" && (
              <QuickReplies label="Quick replies">
                <ReplyChip onClick={chat.confirmFiles}>{files.length ? "Continue" : "No documents"}</ReplyChip>
              </QuickReplies>
            )}
            {composer}
          </>
        )}

        {/* The form stays an option for the whole conversation, not only before the first message. */}
        <button
          type="button"
          onClick={onUseForm}
          data-no-tap
          className="mx-auto mt-1 flex min-h-11 items-center justify-center px-3 text-[13px] font-medium text-ink-2 underline underline-offset-4"
        >
          {formLink}
        </button>
      </ChatBar>
    </ChatScreen>
  );
}
