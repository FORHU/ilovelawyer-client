"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, FileText, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { Chip, PromptChip } from "@/components/ui/chip";
import { FilePicker } from "@/components/ui/file-picker";
import { AiMark } from "@/components/ui/misc";
import { LawyerSuggestion } from "@/components/case/lawyer-suggestion";
import { useIntakeQuery, useMessagesQuery, useSendMessageMutation, useUploadDocumentsMutation } from "@/lib/cases/queries";
import { useOpenLawyerRequestQuery } from "@/lib/lawyer-requests/api";
import { usePayment } from "@/lib/payment-store";
import { useSocketConnected } from "@/lib/socket";
import type { Case } from "@/lib/types";

const PROMPTS = [
  "Tell you what happened",
  "Add a date or event",
  "Add someone involved",
  "I have a question for a lawyer",
];

/** Up to this many of the case's own documents can go with one message (the API's own cap). */
const MAX_ATTACHED_DOCUMENTS = 5;

export function Consultation({ c }: { c: Case }) {
  const credits = c.credits;
  const { data: openRequest } = useOpenLawyerRequestQuery(c.id);
  const { data, error: loadError } = useMessagesQuery(c.id);
  const { data: intake } = useIntakeQuery(c.id, c.documents.some((d) => d.status === "PENDING"));
  const sendMessage = useSendMessageMutation(c.id);
  const upload = useUploadDocumentsMutation(c.id);
  // The reply arrives over the socket, so while it's down the wait is the connection's, not the AI's.
  const connected = useSocketConnected();

  const [input, setInput] = useState("");
  const [notice, setNotice] = useState("");
  const [attachedIds, setAttachedIds] = useState<string[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  const messages = data?.messages ?? [];
  const thinking = sendMessage.isPending || !!data?.replying;
  const out = credits <= 0;
  const lastFailed = messages.at(-1)?.replyStatus === "FAILED";
  const latestAnswer = messages.findLast((m) => m.role === "ai");
  const readyDocuments = c.documents.filter((d) => d.status === "READY");
  const missing = intake?.missing.length ?? 0;

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, thinking]);

  const toggleAttached = (id: string) => {
    setAttachedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_ATTACHED_DOCUMENTS) return prev;
      return [...prev, id];
    });
  };

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text || thinking || credits <= 0) return;
    const documentIds = attachedIds;
    setInput("");
    setNotice("");
    setAttachedIds([]);
    sendMessage.mutate(
      { text, documentIds: documentIds.length ? documentIds : undefined },
      {
        onError: (err) => {
          setInput(text);
          setAttachedIds(documentIds);
          setNotice(err instanceof Error ? err.message : "Couldn't send that. Try again.");
        },
      },
    );
  };

  const attach = (files: File[]) => {
    setNotice("");
    upload.mutate(files, {
      onSuccess: ({ added, failed }) => {
        const parts: string[] = [];
        if (added.length) {
          const one = added.length === 1;
          parts.push(`Added ${added.map((d) => d.name).join(", ")}. The AI will use ${one ? "it" : "them"} once ${one ? "it's" : "they're"} read.`);
        }
        if (failed.length) parts.push(failed.map((f) => f.reason).join(" "));
        setNotice(parts.join(" "));
      },
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {messages.length === 0 && !thinking ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 overflow-y-auto px-4 py-6 md:px-12">
          <h2 className="text-balance text-center font-display text-[28px] font-normal tracking-[-0.02em]">
            Tell me about your situation
          </h2>
          <p className="max-w-[460px] text-center text-[13.5px] leading-[1.6] text-ink-2">
            I&apos;ll ask a few questions, organise what you tell me, and help you get it in front of a lawyer. I
            can&apos;t give legal advice myself.
          </p>
          <div className="flex max-w-[700px] flex-wrap justify-center gap-2">
            {PROMPTS.map((p) => (
              <PromptChip key={p} disabled={out} onClick={() => send(p)}>
                {p}
              </PromptChip>
            ))}
          </div>
        </div>
      ) : (
        <div ref={scroller} className="flex-1 overflow-y-auto px-4 pb-3 pt-7 md:px-12">
          <div className="mx-auto flex max-w-[768px] flex-col gap-[22px]">
            {missing > 0 && !thinking && (
              <div className="self-center rounded-full bg-chip px-3 py-1 text-[12px] text-ink-2">
                {missing} thing{missing === 1 ? "" : "s"} still to cover — see the Overview tab
              </div>
            )}
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex max-w-[80%] flex-col items-end gap-1.5 self-end">
                  <div className="rounded-[18px_18px_4px_18px] border border-line bg-bubble px-4 py-3 text-[15px] leading-[1.6]">
                    {m.text}
                  </div>
                  {m.documents.length > 0 && (
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {m.documents.map((d) => (
                        <span key={d.id} className="inline-flex items-center gap-1 rounded-full bg-chip px-2 py-0.5 text-[11px] text-ink-2">
                          <FileText size={10} />
                          {d.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div key={m.id} className="flex gap-3">
                  <AiMark />
                  <div className="flex min-w-0 flex-col gap-2.5 text-[15px] leading-[1.7]">
                    <div className="whitespace-pre-line">{m.text}</div>
                    <div className="text-xs text-muted">I collect and organise your information for a lawyer. I can&apos;t give legal advice.</div>
                  </div>
                </div>
              ),
            )}
            {lastFailed && !thinking && (
              <div className="ml-[38px] text-[13px] text-error">
                That didn&apos;t go through. Try asking again.
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

      <div className="shrink-0 px-4 pb-[30px] pt-2 md:px-12 md:pb-[18px]">
        <div className="mx-auto flex max-w-[768px] flex-col gap-2">
          {loadError && <ErrorBox message={loadError.message} />}
          {notice && <div className="text-center text-[12.5px] text-ink-2">{notice}</div>}
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
          {readyDocuments.length > 0 && !out && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted">Send with this:</span>
              {readyDocuments.map((d) => (
                <Chip key={d.id} small selected={attachedIds.includes(d.id)} onClick={() => toggleAttached(d.id)}>
                  {d.name}
                </Chip>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className={`flex items-center gap-1.5 rounded-composer border border-line bg-subtle p-2 ${out ? "pointer-events-none opacity-50" : ""}`}
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
                  className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line text-muted disabled:opacity-60"
                >
                  <Paperclip size={15} />
                </button>
              )}
            </FilePicker>
            <input
              value={input}
              disabled={out}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me what's going on…"
              aria-label="Tell me what's going on"
              className="min-w-0 flex-1 bg-transparent px-3.5 text-[15px] text-ink outline-none"
            />
            <span className="whitespace-nowrap text-[11px] text-muted">
              {upload.isPending ? "Uploading…" : `${credits} credits`}
            </span>
            <button
              type="submit"
              aria-label="Send"
              disabled={out || thinking}
              data-no-tap
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold text-white disabled:opacity-60"
            >
              <ArrowUpRight size={14} />
            </button>
          </form>
          <div className="text-center text-[11px] text-muted">
            I collect and organise your information for a lawyer; I&apos;m not a lawyer myself. Each message uses 1 credit.
          </div>
        </div>
      </div>
    </div>
  );
}
