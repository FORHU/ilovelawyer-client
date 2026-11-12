"use client";

import { ArrowUpRight, FileText, Mic, Paperclip, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { FilePicker } from "@/components/ui/file-picker";
import { AiMark } from "@/components/ui/misc";
import { LawyerSuggestion } from "@/components/case/lawyer-suggestion";
import { DeleteConfirm, MessageMenu } from "@/components/case/message-actions";
import { usePayment } from "@/lib/payment-store";
import type { Case } from "@/lib/types";
import { PROMPTS, type Consultation } from "./use-consultation";

export function ConsultationDesktop({ c, consultation }: { c: Case; consultation: Consultation }) {
  const {
    credits, openRequest, loadError, upload, connected, input, setInput, notice, dragging, scroller, textareaRef, recorder,
    messages, documentById, thinking, out, lastFailed, latestAnswer, missing, attachmentPending, failedAttachedIds,
    sendableAttachedIds, attachedIds, removeAttached, send, attach, onDrop, onDragEnter, onDragLeave, onPaste,
    stop, canStop,
  } = consultation;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {messages.length === 0 && !thinking ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 overflow-y-auto overscroll-contain px-12 py-6">
          <h2 className="text-balance text-center font-display text-[28px] font-normal tracking-[-0.02em]">
            Tell me about your situation
          </h2>
          <p className="max-w-[460px] text-center text-[13.5px] leading-[1.6] text-ink-2">
            I&apos;ll ask a few questions, organise what you tell me, and help you get it in front of a lawyer. I
            can&apos;t give legal advice myself.
          </p>
        </div>
      ) : (
        <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-12 pb-3 pt-7">
          <div className="mx-auto flex max-w-[768px] flex-col gap-[22px]">
            {missing > 0 && !thinking && (
              <div className="self-center rounded-full bg-chip px-3 py-1 text-[12px] text-ink-2">
                {missing} thing{missing === 1 ? "" : "s"} still to cover — see the Overview tab
              </div>
            )}
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="group flex flex-col gap-2">
                  <div className="flex max-w-[80%] flex-col items-end gap-1.5 self-end">
                    <div className="flex items-center gap-1">
                      <MessageMenu m={m} consultation={consultation} />
                      <div className="min-w-0 rounded-[18px_18px_4px_18px] border border-line bg-bubble px-4 py-3 text-[15px] leading-[1.6]">
                        {m.text}
                      </div>
                    </div>
                    {m.audioUrl && <audio controls src={m.audioUrl} className="h-8 w-56" />}
                    {(m.documentIds ?? []).length > 0 && (
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {(m.documentIds ?? []).map((id) => {
                          const d = documentById.get(id);
                          return (
                            <span key={id} className="inline-flex items-center gap-1 rounded-full bg-chip px-2 py-0.5 text-[11px] text-ink-2">
                              <FileText size={10} />
                              {d?.name ?? "Document"}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {m.replyStatus === "CANCELLED" && (
                      <div className="text-[12px] text-muted">You stopped this answer. Your credit was given back.</div>
                    )}
                  </div>
                  <DeleteConfirm m={m} consultation={consultation} />
                </div>
              ) : (
                <div key={m.id} className="group flex flex-col gap-2">
                  <div className="flex gap-3">
                    <AiMark />
                    <div className="flex min-w-0 flex-1 flex-col gap-2.5 text-[15px] leading-[1.7]">
                      <div className="whitespace-pre-line">{m.text}</div>
                      {m.audioUrl && <audio controls src={m.audioUrl} className="h-8 w-56" />}
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs text-muted">I collect and organise your information for a lawyer. I can&apos;t give legal advice.</div>
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
            {lastFailed && !thinking && (
              <div className="ml-[38px] text-[13px] text-error">
                That didn&apos;t go through, so it didn&apos;t use a credit. Try asking again.
              </div>
            )}
            {latestAnswer && !thinking && !openRequest && (
              <LawyerSuggestion caseId={c.id} latestAnswerId={latestAnswer.id} />
            )}
            {thinking && (
              <div className="flex gap-3" role="status" aria-label="The assistant is typing">
                <AiMark />
                <div className="flex items-center gap-1 py-2.5">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="size-1.5 animate-pulse rounded-full bg-muted"
                      style={{ animationDelay: `${d * 150}ms` }}
                    />
                  ))}
                  {!connected && <span className="ml-2 text-[12.5px] text-muted">Reconnecting…</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div
        data-tour="sticky-bar"
        className="relative shrink-0 px-12 pb-[18px] pt-2"
        onDragEnter={onDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {dragging && !out && (
          <div className="pointer-events-none absolute inset-2 z-10 flex items-center justify-center rounded-composer border-2 border-dashed border-gold bg-subtle/95 text-[13px] font-medium text-ink">
            Drop to attach
          </div>
        )}
        <div className="mx-auto flex max-w-[768px] flex-col gap-2">
          {/* Starters sit right above the composer, small. */}
          {messages.length === 0 && !thinking && (
            <div role="group" aria-label="Ways to start" className="flex flex-wrap justify-center gap-1.5">
              {PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={out}
                  onClick={() => send(p)}
                  data-no-tap
                  className="min-h-8 rounded-full border border-line-chip bg-subtle px-3 text-[12.5px] font-medium text-ink transition-colors hover:border-gold disabled:opacity-40"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
          {loadError && <ErrorBox message={loadError.message} />}
          {notice && <div className="text-center text-[12.5px] text-ink-2">{notice}</div>}
          {recorder.error && <div className="text-center text-[12.5px] text-error">{recorder.error}</div>}
          {out && (
            <div className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-subtle px-4 py-3">
              <div className="min-w-[180px] flex-1 text-[13px] leading-[1.5]">
                <b>You&apos;re out of chat credits for this case.</b> Top up to keep going.
              </div>
              <Button
                variant="outline"
                onClick={() => usePayment.getState().openFor(c.id)}
              >
                Top up
              </Button>
            </div>
          )}
          {attachedIds.length > 0 && !out && (
            <div className="flex flex-wrap items-center gap-1.5">
              {attachedIds.map((id) => {
                const d = documentById.get(id);
                const failed = failedAttachedIds.includes(id);
                return (
                  <span
                    key={id}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium ${
                      failed ? "border-error/40 bg-error/10 text-error" : "border-ink bg-ink text-white"
                    }`}
                  >
                    <FileText size={12} />
                    {failed ? `Couldn't read ${d?.name ?? "document"}` : (d?.name ?? "Document")}
                    <button
                      type="button"
                      aria-label={`Remove ${d?.name ?? "document"}`}
                      onClick={() => removeAttached(id)}
                      data-no-tap
                      className="-mr-1 flex size-4 items-center justify-center rounded-full opacity-80 hover:opacity-100"
                    >
                      <X size={11} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            data-tour="composer"
            className={`flex items-end gap-1.5 rounded-composer border border-line bg-subtle p-2 ${out ? "pointer-events-none opacity-50" : ""}`}
          >
            <FilePicker onPick={attach}>
              {(open) => (
                <button
                  type="button"
                  title="Attach a document"
                  aria-label="Attach a document"
                  disabled={out || upload.isPending}
                  onClick={open}
                  data-no-tap
                  className="flex size-9 shrink-0 items-center justify-center self-end rounded-full border border-line text-muted disabled:opacity-60"
                >
                  <Paperclip size={15} />
                </button>
              )}
            </FilePicker>
            {recorder.phase === "recording" ? (
              <>
                <button
                  type="button"
                  title="Cancel recording"
                  aria-label="Cancel recording"
                  onClick={recorder.cancel}
                  data-no-tap
                  className="flex size-9 shrink-0 items-center justify-center self-end rounded-full border border-line text-muted"
                >
                  <X size={15} />
                </button>
                <button
                  type="button"
                  title="Stop and send"
                  aria-label="Stop and send recording"
                  onClick={recorder.stop}
                  data-no-tap
                  className="flex size-9 shrink-0 animate-pulse items-center justify-center self-end rounded-full bg-error text-white"
                >
                  <Square size={13} />
                </button>
              </>
            ) : (
              <button
                type="button"
                title="Record a voice message"
                aria-label="Record a voice message"
                disabled={out || thinking || recorder.phase === "transcribing"}
                onClick={recorder.start}
                data-no-tap
                className="flex size-9 shrink-0 items-center justify-center self-end rounded-full border border-line text-muted disabled:opacity-60"
              >
                <Mic size={15} />
              </button>
            )}
            <textarea
              ref={textareaRef}
              value={input}
              disabled={out}
              rows={1}
              onChange={(e) => setInput(e.target.value)}
              onPaste={onPaste}
              onKeyDown={(e) => {
                // isComposing is true while an IME (Japanese/Chinese/Korean input, etc.) is still
                // resolving a character — Enter there confirms the composition, it doesn't submit.
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Tell me what's going on…"
              aria-label="Tell me what's going on"
              className="my-1.5 min-w-0 flex-1 resize-none bg-transparent px-3.5 text-[15px] leading-[1.5] text-ink outline-none"
            />
            <span className="mb-1.5 whitespace-nowrap self-end text-[11px] text-muted">
              {recorder.phase === "recording"
                ? "Recording…"
                : recorder.phase === "transcribing"
                  ? "Transcribing…"
                  : upload.isPending || attachmentPending
                    ? "Uploading…"
                    : `${credits} credits`}
            </span>
            {thinking ? (
              <button
                key="stop"
                type="button"
                title="Stop the answer"
                aria-label="Stop the answer"
                disabled={!canStop}
                onClick={stop}
                data-no-tap
                className="flex size-9 shrink-0 items-center justify-center self-end rounded-full bg-gold text-white disabled:opacity-60"
              >
                <Square size={13} className="fill-current" />
              </button>
            ) : (
              <button
                key="send"
                type="submit"
                aria-label="Send"
                disabled={out || attachmentPending || (!input.trim() && sendableAttachedIds.length === 0)}
                data-no-tap
                className="flex size-9 shrink-0 items-center justify-center self-end rounded-full bg-gold text-white disabled:opacity-60"
              >
                <ArrowUpRight size={14} />
              </button>
            )}
          </form>
          <div className="text-center text-[11px] text-muted">
            I collect and organise your information for a lawyer; I&apos;m not a lawyer myself. Each answer uses 1 credit. Stopped or failed answers are free.
          </div>
        </div>
      </div>
    </div>
  );
}
