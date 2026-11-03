"use client";

import { ArrowUp, FileText, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { FilePicker } from "@/components/ui/file-picker";
import { AiMark } from "@/components/ui/misc";
import { ChatBar, ChatScreen, ComposerButton, ComposerPill } from "@/components/mobile/chat";
import { MicButton, RecorderRow } from "@/components/voice/recorder-row";
import { LawyerSuggestion } from "@/components/case/lawyer-suggestion";
import { cn } from "@/lib/cn";
import { usePayment } from "@/lib/payment-store";
import type { Case } from "@/lib/types";
import { PROMPTS, useConsultation } from "./use-consultation";

export function ConsultationMobile({ c }: { c: Case }) {
  const {
    voice, out, thinking, messages, documentById, scroller, missing, openRequest, lastFailed, latestAnswer, connected, loadError, notice, credits, attachedIds, failedAttachedIds, removeAttached, input, setInput, onPaste, textareaRef, attach, upload, attachmentPending, sendableAttachedIds, send,
  } = useConsultation(c);

  return (
    <ChatScreen>
      {messages.length === 0 && !thinking ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-6">
          <h2 className="text-balance font-display text-[26px] font-normal leading-[1.15] tracking-[-0.02em]">Tell me about your situation</h2>
          <p className="mt-2.5 text-[15px] leading-[1.5] text-ink-2">
            I&apos;ll ask a few questions, organise what you tell me, and help you get it in front of a lawyer.
          </p>
          <ul className="mt-6 flex flex-col gap-2">
            {PROMPTS.map((p) => (
              <li key={p}>
                <button
                  type="button"
                  disabled={out}
                  onClick={() => send(p)}
                  className="min-h-12 w-full rounded-card border border-line-input bg-white px-4 text-left text-[15px] font-medium text-ink active:bg-chip disabled:opacity-40"
                >
                  {p}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div ref={scroller} role="log" aria-label="Interview" aria-live="polite" className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-4 px-4 py-4">
            {missing > 0 && !thinking && (
              <div className="self-center rounded-full bg-chip px-3 py-1.5 text-center text-[12.5px] leading-[1.35] text-ink-2">
                {missing} thing{missing === 1 ? "" : "s"} still to cover. See the Overview tab
              </div>
            )}
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex max-w-[85%] flex-col items-end gap-1.5 self-end">
                  <div className="whitespace-pre-wrap break-words rounded-[18px_18px_4px_18px] border border-line bg-bubble px-3.5 py-2.5 text-[15px] leading-[1.5]">
                    <span className="sr-only">You: </span>
                    {m.text}
                  </div>
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
                </div>
              ) : (
                <div key={m.id} className="flex gap-2.5">
                  <AiMark size={28} />
                  <div className="min-w-0 whitespace-pre-line break-words text-[15px] leading-[1.6]">
                    <span className="sr-only">ilovelawyer AI: </span>
                    {m.text}
                  </div>
                </div>
              ),
            )}
            {lastFailed && !thinking && <div className="ml-[38px] text-[14px] text-error">That didn&apos;t go through. Try asking again.</div>}
            {latestAnswer && !thinking && !openRequest && <LawyerSuggestion caseId={c.id} latestAnswerId={latestAnswer.id} />}
            {thinking && (
              <div className="flex gap-2.5" role="status" aria-label="The assistant is typing">
                <AiMark size={28} />
                <div className="flex items-center gap-1 py-2.5">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="size-1.5 rounded-full bg-muted motion-safe:animate-pulse" style={{ animationDelay: `${d * 150}ms` }} />
                  ))}
                  {!connected && <span className="ml-2 text-[13px] text-muted">Reconnecting…</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ChatBar>
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
        {voice.error && (
          <div role="alert" className="mb-2 px-1 text-[13px] text-error">
            {voice.error}
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
            {voice.phase !== "idle" ? (
              <RecorderRow phase={voice.phase} seconds={voice.seconds} onCancel={voice.cancel} onStop={voice.stop} />
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
                <MicButton onClick={() => void voice.start()} disabled={out || upload.isPending} />
                <ComposerButton
                  type="submit"
                  tone="send"
                  aria-label="Send"
                  disabled={out || thinking || attachmentPending || (!input.trim() && sendableAttachedIds.length === 0)}
                >
                  <ArrowUp size={20} aria-hidden="true" />
                </ComposerButton>
              </>
            )}
          </ComposerPill>
        </form>
        <p className="mt-2 text-center text-[11.5px] leading-[1.4] text-muted">
          {upload.isPending || attachmentPending ? "Uploading…" : `${credits} credits left · 1 per message`}. I&apos;m not a lawyer and can&apos;t give legal advice.
        </p>
      </ChatBar>
    </ChatScreen>
  );
}
