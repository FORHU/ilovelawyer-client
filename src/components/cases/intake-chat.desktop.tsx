"use client";

import { ArrowRight, ArrowUp, FileText, Paperclip, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, PromptChip } from "@/components/ui/chip";
import { ErrorBox } from "@/components/ui/banner";
import { FilePicker } from "@/components/ui/file-picker";
import { inputClass, WizardLabel } from "@/components/ui/input";
import { MicButton, RecorderRow } from "@/components/voice/recorder-row";
import { cn } from "@/lib/cn";
import type { IntakeMessage } from "@/lib/cases/use-intake-chat";
import { sideLabel } from "@/lib/types";
import { REGIONS, STARTERS, type IntakeViewProps } from "./use-intake-controller";

function AiBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-warn-bg text-gold"
      >
        <Sparkles size={15} />
      </span>
      <div className="min-w-0 max-w-[560px]">
        <div className="mb-1 flex items-center gap-2 text-[11px] text-muted">
          <span className="font-semibold text-ink">ilovelawyer AI</span>
          <span>AI guidance, not legal advice</span>
        </div>
        <div className="rounded-[4px_16px_16px_16px] bg-bubble px-4 py-3 text-[14px] leading-[1.55] text-ink">
          {children}
        </div>
      </div>
    </div>
  );
}

function Message({ m }: { m: IntakeMessage }) {
  if (m.role === "ai") return <AiBubble>{m.text}</AiBubble>;
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-[16px_4px_16px_16px] bg-primary px-4 py-3 text-[14px] leading-[1.55] text-white">
        <span className="sr-only">You: </span>
        {m.text}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-line py-2.5 last:border-b-0 sm:flex-row sm:gap-4">
      <dt className="w-36 shrink-0 text-[12px] text-muted">{label}</dt>
      <dd className="min-w-0 flex-1 whitespace-pre-wrap break-words text-[13px] text-ink">{children}</dd>
    </div>
  );
}

export function IntakeChatDesktop({ creating, error, onCreate, onEditDetails, hasDraft, onUseForm, controller }: IntakeViewProps) {
  const {
    areasQuery, areas, chat, step, typing, files, draft, text, setText, voice, rejected, endRef, box,
    send, onKey, addFiles, choiceStep, placeholder, areaNames, titleMissing, canAttach, empty, messages,
  } = controller;

  const composer = (
    <>
          {rejected.length > 0 && (
            <div role="alert" className="mb-2 text-[13px] text-error">
              {rejected.join(" ")}
            </div>
          )}
          {files.length > 0 && (
            <ul className="mb-2 flex flex-wrap gap-1.5" aria-label="Attached files">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="inline-flex min-h-[34px] max-w-full items-center gap-1.5 rounded-full bg-chip pl-3 pr-1 text-[12.5px] text-ink"
                >
                  <FileText size={13} className="shrink-0 text-gold" aria-hidden="true" />
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => chat.removeFile(i)}
                    className="flex size-7 items-center justify-center rounded-full text-ink-2 hover:bg-ink/10"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
      {voice.error && (
        <div role="alert" className="mb-2 px-2 text-[13px] text-error">
          {voice.error}
        </div>
      )}
      <div
        data-tour="chatbox"
        className={cn(
          "flex items-center gap-1.5 rounded-[28px] border border-line-input bg-white p-2 shadow-[0_2px_14px_rgb(0_0_0/0.06)] transition-colors focus-within:border-ink-2",
        )}
      >
        {voice.phase !== "idle" ? (
          <RecorderRow phase={voice.phase} seconds={voice.seconds} onCancel={voice.cancel} onStop={voice.stop} />
        ) : (
          <>
          <FilePicker onPick={addFiles}>
            {(open) => (
              <button
                type="button"
                onClick={open}
                disabled={!canAttach}
                aria-label="Attach documents"
                data-no-tap
                className="flex size-11 shrink-0 items-center justify-center self-end rounded-full text-ink-2 transition-colors hover:bg-chip hover:text-ink disabled:opacity-40"
              >
                <Paperclip size={20} aria-hidden="true" />
              </button>
            )}
          </FilePicker>
          <textarea
            ref={box}
            rows={1}
            value={text}
            disabled={choiceStep || creating}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            placeholder={placeholder}
            aria-label={placeholder}
            // 24px of text + 10px above and below = 44px, the height of the round buttons beside it.
            className={cn(
              "min-h-11 flex-1 resize-none bg-transparent py-2.5 text-base leading-6 text-ink outline-none placeholder:text-muted disabled:cursor-not-allowed",
              "px-1.5",
            )}
          />
          <MicButton onClick={() => void voice.start()} disabled={choiceStep || creating || typing} />
          <button
            type="button"
            onClick={send}
            disabled={!text.trim() || typing || choiceStep || creating}
            aria-label="Send"
            data-no-tap
            className="flex size-11 shrink-0 items-center justify-center self-end rounded-full bg-ink text-white transition-colors hover:bg-primary disabled:bg-chip disabled:text-muted"
          >
            <ArrowUp size={20} aria-hidden="true" />
          </button>
          </>
        )}
      </div>
    </>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {empty ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[768px] flex-1 flex-col justify-center gap-7 px-6 pb-24 pt-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <h1 className="font-display text-[44px] font-normal leading-tight tracking-[-0.02em]">
                What&apos;s going on?
              </h1>
              <p className="max-w-[540px] text-[15px] leading-[1.55] text-ink-2">
                Tell us in your own words. We&apos;ll ask a few questions and set up your case. AI guidance, not
                legal advice.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div>{composer}</div>
              <div data-tour="starters" role="group" aria-label="Not sure where to start?" className="flex flex-wrap justify-center gap-1.5">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => chat.submitText(s)}
                    data-no-tap
                    className="min-h-8 rounded-full border border-line-chip bg-subtle px-3 text-[12.5px] font-medium text-ink transition-colors hover:border-gold"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-5">
              <button
                type="button"
                onClick={onUseForm}
                data-tour="opt-form"
                data-no-tap
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-input bg-white px-5 text-[13px] font-medium text-ink hover:border-line-hover"
              >
                {hasDraft ? "Resume your form draft" : "Prefer a form? Fill in a form"}
                <ArrowRight size={14} className="text-gold" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div
            role="log"
            aria-label="Conversation with ilovelawyer AI"
            aria-live="polite"
            className="min-h-0 flex-1 overflow-y-auto"
          >
            <div className="mx-auto flex w-full max-w-[768px] flex-col gap-4 px-6 py-6">
              {messages.map((m) => (
                <Message key={m.id} m={m} />
              ))}

            {typing && (
              <AiBubble>
                <span className="sr-only">ilovelawyer AI is typing</span>
                <span aria-hidden="true" className="flex h-[22px] items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="size-1.5 rounded-full bg-muted motion-safe:animate-pulse"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </span>
              </AiBubble>
            )}

            {!typing && step === "type" && (
              <div className="flex flex-col gap-3 pl-[42px]" role="group" aria-label="Type of issue">
                <div className="flex flex-wrap gap-1.5">
                  {areas.map((a) => (
                    <Chip key={a.code} selected={draft.areas.includes(a.code)} onClick={() => chat.toggleArea(a.code)}>
                      {a.name}
                    </Chip>
                  ))}
                </div>
                {areasQuery.isError && (
                  <div className="text-xs text-error">Couldn&apos;t load the types of issue. Refresh to try again.</div>
                )}
                <Button
                  size="sm"
                  className="self-start"
                  disabled={draft.areas.length === 0}
                  onClick={chat.confirmAreas}
                >
                  Continue
                </Button>
              </div>
            )}

            {!typing && step === "region" && (
              <div className="flex flex-wrap gap-1.5 pl-[42px]" role="group" aria-label="Which part of the UK?">
                {REGIONS.map((r) => (
                  <PromptChip key={r.value} onClick={() => chat.chooseRegion(r.value, r.label)}>
                    {r.label}
                  </PromptChip>
                ))}
              </div>
            )}

            {!typing && step === "side" && (
              <div className="flex flex-wrap gap-1.5 pl-[42px]" role="group" aria-label="Which side are you on?">
                <PromptChip onClick={() => chat.chooseSide("CLAIMANT", "I'm bringing the complaint")}>
                  I&apos;m bringing the complaint
                </PromptChip>
                <PromptChip onClick={() => chat.chooseSide("RESPONDENT", "I'm responding to one")}>
                  I&apos;m responding to one
                </PromptChip>
                <PromptChip onClick={() => chat.chooseSide("", "Not sure yet")}>Not sure yet</PromptChip>
              </div>
            )}

            {!typing && (step === "where" || step === "others" || step === "want") && (
              <div className="pl-[42px]">
                <PromptChip onClick={chat.skip}>{step === "others" ? "Done" : "Skip"}</PromptChip>
              </div>
            )}

            {!typing && step === "more" && (
              <div className="flex flex-wrap gap-1.5 pl-[42px]">
                <PromptChip onClick={chat.confirmFiles}>{files.length ? "Continue" : "No documents"}</PromptChip>
              </div>
            )}

            {!typing && step === "check" && (
              <section
                aria-label="Check your case"
                className="flex flex-col gap-4 rounded-modal border border-warn-line bg-warn-bg/40 ml-[42px] p-5"
              >
                <div className="flex flex-col gap-1">
                  <div className="text-[10px] font-semibold uppercase tracking-[1.2px] text-gold">Check your case</div>
                  <div className="text-[12.5px] text-ink-2">
                    Filled in from our chat. Change anything before you create it.
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <WizardLabel htmlFor="intake-title">Case name *</WizardLabel>
                  <input
                    id="intake-title"
                    value={draft.title}
                    maxLength={150}
                    aria-invalid={titleMissing}
                    aria-describedby={titleMissing ? "intake-title-err" : undefined}
                    onChange={(e) => chat.patchDraft({ title: e.target.value })}
                    className={cn(inputClass, "bg-white font-display text-[17px]", titleMissing && "border-error-field")}
                  />
                  {titleMissing && (
                    <div id="intake-title-err" className="text-xs text-error">
                      Give your case a name before creating it.
                    </div>
                  )}
                </div>

                <dl className="rounded-input border border-line bg-white px-4">
                  <Row label="Type of issue">{areaNames || "Not set"}</Row>
                  <Row label="Part of the UK">
                    {draft.region ? (draft.region === "OUTSIDE_UK" ? "Outside the UK" : draft.region) : "Not set"}
                  </Row>
                  {draft.where && <Row label="Town or city">{draft.where}</Row>}
                  <Row label="Your side">{draft.side ? sideLabel(draft.side) : "Not set"}</Row>
                  <Row label="What happened">{draft.happened || "Not set"}</Row>
                  <Row label="What you want">{draft.wants || "Not set"}</Row>
                  {draft.others.length > 0 && (
                    <Row label="Others involved">{draft.others.map((o) => o.name).join(", ")}</Row>
                  )}
                  {files.length > 0 && <Row label="Attached files">{files.map((f) => f.name).join(", ")}</Row>}
                </dl>

                {error && <ErrorBox message={error} />}

                <div className="flex flex-wrap items-center gap-2.5">
                  <Button
                    disabled={creating || titleMissing || draft.areas.length === 0 || !draft.region}
                    onClick={() => onCreate(draft, files)}
                    className="px-[26px]"
                  >
                    {creating ? "Creating…" : "Create case"}
                  </Button>
                  <Button variant="outline" disabled={creating} onClick={() => onEditDetails(draft, files)}>
                    Edit details
                  </Button>
                </div>
                {(draft.areas.length === 0 || !draft.region) && (
                  <div className="text-xs text-error">
                    A type of issue and a part of the UK are needed. Use Edit details to add them.
                  </div>
                )}
              </section>
            )}
            <div ref={endRef} />
            </div>
          </div>

          <div data-tour="sticky-bar" className="shrink-0 bg-white px-6 pb-[max(16px,env(safe-area-inset-bottom))] pt-2">
            <div className="mx-auto w-full max-w-[768px]">
              {composer}
              <div className="mt-2 flex flex-col items-center justify-between gap-1 text-[11.5px] text-muted sm:flex-row">
                <span>AI guidance, not legal advice. Advice comes from the solicitor you choose.</span>
                <button type="button" onClick={onUseForm} className="min-h-8 underline underline-offset-2 hover:text-ink">
                  {hasDraft ? "Resume your form draft" : "Prefer a form? Fill it in instead"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
