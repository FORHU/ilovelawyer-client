"use client";

import { useState } from "react";
import { ArrowUp, FileText, Mic, Paperclip, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { FilePicker } from "@/components/ui/file-picker";
import { AiMark } from "@/components/ui/misc";
import { PromptChip } from "@/components/ui/chip";
import { TypingDots } from "@/components/ui/typing-dots";
import { ChatBar, ChatScreen, ComposerButton, ComposerPill } from "@/components/mobile/chat";
import { AfterAnswer, isJurisdictionQuestion } from "@/components/case/after-answer";
import { CitationText } from "@/components/case/citation-text";
import { DeleteConfirm, MessageMenu } from "@/components/case/message-actions";
import { useSite } from "@/components/site/site-provider";
import { cn } from "@/lib/cn";
import { usePayment } from "@/lib/payment-store";
import { caseRegion, type Case } from "@/lib/types";
import { PROMPTS, type Consultation } from "./use-consultation";

export function ConsultationMobile({ c, consultation }: { c: Case; consultation: Consultation }) {
  const {
    recorder, out, thinking, messages, documentById, scroller, missing, missingGaps, suggestions, openRequest, lastFailed, latestAnswer, connected, loadError, notice, credits, attachedIds, failedAttachedIds, removeAttached, input, setInput, onPaste, textareaRef, attach, upload, attachmentPending, sendableAttachedIds, send, stop, canStop, askAbout,
  } = consultation;
  const [showMissing, setShowMissing] = useState(false);
  // See consultation.desktop.tsx's identical note: RegionPrompt only shows while the case has no
  // region AND the AI's latest message is actually the jurisdiction question; #158's chips are
  // suppressed only for that exact collision, not whenever the region happens to be unset.
  const { regionQuestion } = useSite();
  const regionPromptShowing = regionQuestion && caseRegion(c) === "" && isJurisdictionQuestion(suggestions);

  return (
    <ChatScreen>
      {messages.length === 0 && !thinking ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-6 text-center">
          <h2 className="text-balance font-display text-[26px] font-normal leading-[1.15] tracking-[-0.02em]">Tell me about your situation</h2>
          <p className="mt-2.5 max-w-[320px] text-[15px] leading-[1.5] text-ink-2">
            I&apos;ll ask a few questions, organise what you tell me, and help you get it in front of a lawyer.
          </p>
        </div>
      ) : (
        <div ref={scroller} role="log" aria-label="Interview" aria-live="polite" className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-4 px-4 py-4">
            {missing > 0 && !thinking && (
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowMissing((v) => !v)}
                  aria-expanded={showMissing}
                  data-no-tap
                  className="self-center rounded-full bg-chip px-3 py-1.5 text-center text-[12.5px] leading-[1.35] text-ink-2"
                >
                  {missing} thing{missing === 1 ? "" : "s"} still to cover. See the Overview tab, or tap to ask here
                </button>
                {showMissing && (
                  <div role="group" aria-label="Still to cover" className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
                    {missingGaps.map((gap) => (
                      <button
                        key={gap.id}
                        type="button"
                        onClick={() => askAbout(gap)}
                        data-no-tap
                        className="shrink-0 whitespace-nowrap rounded-full border border-dashed border-line-input bg-white px-3.5 py-1.5 text-[12.5px] text-ink active:bg-chip"
                      >
                        {gap.question}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="group flex flex-col gap-2">
                  <div className="flex max-w-[92%] flex-col items-end gap-1.5 self-end">
                    <div className="flex items-center">
                      <MessageMenu m={m} consultation={consultation} />
                      <div className="min-w-0 whitespace-pre-wrap break-words rounded-[18px_18px_4px_18px] border border-line bg-bubble px-3.5 py-2.5 text-[15px] leading-[1.5]">
                        <span className="sr-only">You: </span>
                        {m.text}
                      </div>
                    </div>
                    {m.audioUrl && <audio controls src={m.audioUrl} className="h-8 w-56" />}
                    {(m.documentIds ?? []).length > 0 && (
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {(m.documentIds ?? []).map((id) => (
                          <span key={id} className="inline-flex max-w-full items-center gap-1 rounded-full bg-chip px-2.5 py-1 text-[12px] text-ink-2">
                            <FileText size={11} className="shrink-0" aria-hidden="true" />
                            <span className="truncate">{documentById.get(id)?.name ?? "Document"}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {m.replyStatus === "CANCELLED" && (
                      <div className="text-[13px] text-muted">You stopped this answer. Your credit was given back.</div>
                    )}
                  </div>
                  <DeleteConfirm m={m} consultation={consultation} />
                </div>
              ) : (
                <div key={m.id} className="group flex flex-col gap-2">
                  <div className="flex gap-2.5">
                    <AiMark size={28} />
                    <div className="flex min-w-0 flex-1 flex-col gap-1 break-words text-[15px] leading-[1.6]">
                      <span className="sr-only">ilovelawyer AI: </span>
                      <div className="whitespace-pre-line">
                        <CitationText text={m.text} />
                      </div>
                      {m.audioUrl && <audio controls src={m.audioUrl} className="h-8 w-56" />}
                      <div className="-mb-2 flex justify-end">
                        <MessageMenu m={m} consultation={consultation} />
                      </div>
                    </div>
                  </div>
                  <div className="pl-[38px]">
                    <DeleteConfirm m={m} consultation={consultation} />
                  </div>
                </div>
              ),
            )}
            {lastFailed && !thinking && <div className="ml-[38px] text-[14px] text-error">That didn&apos;t go through, so it didn&apos;t use a credit. Try asking again.</div>}
            {latestAnswer && !thinking && !openRequest && (
              <AfterAnswer c={c} latestAnswerId={latestAnswer.id} suggestions={suggestions} onAnswered={send} />
            )}
            {/* #158: CW's suggested replies for the question just asked, in the thread itself
               rather than pinned to the composer — tap to send as-is, or type/speak a different
               answer instead. Suppressed while RegionPrompt is showing: that card already covers
               this exact question. */}
            {suggestions.length > 0 && !thinking && !out && !regionPromptShowing && (
              <div role="group" aria-label="Suggested replies" className="ml-[38px] flex flex-wrap gap-1.5">
                {suggestions.map((s, i) => (
                  <PromptChip key={`${s}-${i}`} onClick={() => send(s)} data-no-tap className="shrink-0 whitespace-nowrap">
                    {s}
                  </PromptChip>
                ))}
              </div>
            )}
            {thinking && (
              <div className="flex gap-2.5" role="status" aria-label="The assistant is typing">
                <AiMark size={28} />
                <div className="flex items-center gap-1 py-2.5">
                  <TypingDots />
                  {!connected && <span className="ml-2 text-[13px] text-muted">Reconnecting…</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ChatBar>
        {/* Starters sit right above the composer, small, in a row that scrolls sideways. */}
        {messages.length === 0 && !thinking && (
          <div role="group" aria-label="Ways to start" className="no-scrollbar -mx-3 mb-2 flex gap-1.5 overflow-x-auto px-3">
            {PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                disabled={out}
                onClick={() => send(p)}
                data-no-tap
                className="min-h-9 shrink-0 whitespace-nowrap rounded-full border border-line-chip bg-subtle px-3.5 text-[13px] font-medium text-ink active:bg-chip disabled:opacity-40"
              >
                {p}
              </button>
            ))}
          </div>
        )}
        {loadError && <ErrorBox message={loadError.message} />}
        {notice && <div className="mb-2 px-1 text-[13px] leading-[1.4] text-ink-2">{notice}</div>}
        {out && (
          <div className="mb-2.5 flex flex-col gap-3 rounded-card border border-line bg-subtle p-4">
            <div className="text-[14px] leading-[1.45]">
              <b>You&apos;re out of chat credits for this case.</b> Top up to keep going.
            </div>
            <Button variant="outline" size="lg" className="w-full" onClick={() => usePayment.getState().openFor(c.id)}>
              Top up
            </Button>
          </div>
        )}
        {attachedIds.length > 0 && !out && (
          <div className="no-scrollbar -mx-3 mb-2 flex gap-1.5 overflow-x-auto px-3">
            {attachedIds.map((id) => {
              const d = documentById.get(id);
              const failed = failedAttachedIds.includes(id);
              return (
                <span
                  key={id}
                  className={cn(
                    "inline-flex min-h-9 max-w-[75%] shrink-0 items-center gap-1.5 rounded-full border pl-3 pr-1 text-[13px] font-medium",
                    failed ? "border-error/40 bg-error/10 text-error" : "border-ink bg-ink text-white",
                  )}
                >
                  <FileText size={13} className="shrink-0" aria-hidden="true" />
                  <span className="truncate">{failed ? `Couldn't read ${d?.name ?? "document"}` : (d?.name ?? "Document")}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${d?.name ?? "document"}`}
                    onClick={() => removeAttached(id)}
                    data-no-tap
                    className="flex size-9 shrink-0 items-center justify-center rounded-full opacity-80 active:opacity-100"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
        {recorder.error && (
          <div role="alert" className="mb-2 px-1 text-[13px] text-error">
            {recorder.error}
          </div>
        )}
        <form
          data-tour="composer"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className={cn(out && "pointer-events-none opacity-50")}
        >
          <ComposerPill>
            {recorder.phase === "recording" ? (
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
                <FilePicker onPick={attach}>
                  {(open) => (
                    <ComposerButton onClick={open} disabled={out || upload.isPending} aria-label="Attach a document">
                      <Paperclip size={20} aria-hidden="true" />
                    </ComposerButton>
                  )}
                </FilePicker>
                <textarea
                  ref={textareaRef}
                  value={input}
                  disabled={out}
                  rows={1}
                  onChange={(e) => setInput(e.target.value)}
                  onPaste={onPaste}
                  placeholder="Tell me what's going on…"
                  aria-label="Tell me what's going on"
                  enterKeyHint="enter"
                  // 24px of text + 10px above and below = 44px, the height of the round buttons beside it.
                  className="min-h-11 min-w-0 flex-1 resize-none bg-transparent px-1 py-2.5 text-base leading-6 text-ink outline-none placeholder:text-muted"
                />
                <ComposerButton
                  onClick={recorder.start}
                  disabled={out || thinking || upload.isPending || recorder.phase === "transcribing"}
                  aria-label="Record a voice message"
                >
                  <Mic size={20} aria-hidden="true" />
                </ComposerButton>
                {thinking ? (
                  <ComposerButton key="stop" tone="send" onClick={stop} disabled={!canStop} aria-label="Stop the answer">
                    <Square size={16} className="fill-current" aria-hidden="true" />
                  </ComposerButton>
                ) : (
                  <ComposerButton
                    key="send"
                    type="submit"
                    tone="send"
                    aria-label="Send"
                    disabled={out || attachmentPending || (!input.trim() && sendableAttachedIds.length === 0)}
                  >
                    <ArrowUp size={20} aria-hidden="true" />
                  </ComposerButton>
                )}
              </>
            )}
          </ComposerPill>
        </form>
        <p className="mt-2 text-center text-[11.5px] leading-[1.4] text-muted">
          {recorder.phase === "recording"
            ? "Recording…"
            : recorder.phase === "transcribing"
              ? "Transcribing…"
              : upload.isPending || attachmentPending
                ? "Uploading…"
                : `${credits} credits left · 1 per answer, free if stopped or failed`}
          . I&apos;m not a lawyer and can&apos;t give legal advice.
        </p>
      </ChatBar>
    </ChatScreen>
  );
}
