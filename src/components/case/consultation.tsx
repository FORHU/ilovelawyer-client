"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, FileText, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromptChip } from "@/components/ui/chip";
import { AiMark } from "@/components/ui/misc";
import { mockAiReply } from "@/lib/mock-ai";
import { usePayment } from "@/lib/payment-store";
import { useApp } from "@/lib/store";
import type { Case } from "@/lib/types";

const PROMPTS = [
  "What are my rights here?",
  "What should I do first?",
  "Which documents matter most?",
  "Summarize my case",
];

export function Consultation({ c }: { c: Case }) {
  const askAi = useApp((s) => s.askAi);
  const answerAi = useApp((s) => s.answerAi);
  const attachToChat = useApp((s) => s.attachToChat);
  const requestLawyer = useApp((s) => s.requestLawyer);
  const lawyerStatus = useApp((s) => s.lawyer.status);

  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const out = c.credits <= 0;

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [c.chat.length, thinking]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text || thinking || !askAi(c.id, text)) return;
    setInput("");
    setThinking(true);
    // Placeholder latency; the real AI service replaces this call.
    timer.current = setTimeout(() => {
      answerAi(c.id, mockAiReply(c, text));
      setThinking(false);
    }, 900);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {c.chat.length === 0 && !thinking ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 overflow-y-auto px-4 py-6 md:px-12">
          <h2 className="text-balance text-center font-display text-[28px] font-normal tracking-[-0.02em]">
            What would you like to know about this case?
          </h2>
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
            {c.chat.map((m, i) => {
              if (m.role === "user")
                return (
                  <div
                    key={i}
                    className="max-w-[80%] self-end rounded-[18px_18px_4px_18px] border border-line bg-bubble px-4 py-3 text-[15px] leading-[1.6]"
                  >
                    {m.text}
                  </div>
                );
              if (m.role === "ai")
                return (
                  <div key={i} className="flex gap-3">
                    <AiMark />
                    <div className="flex min-w-0 flex-col gap-2.5 text-[15px] leading-[1.7]">
                      <div className="whitespace-pre-line">{m.text}</div>
                      <div className="text-xs text-muted">General information, not legal advice.</div>
                    </div>
                  </div>
                );
              if (m.role === "file")
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 self-end rounded-input border border-line bg-white px-3.5 py-2.5"
                  >
                    <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-chip text-gold">
                      <FileText size={15} />
                    </div>
                    <div>
                      <div className="text-[13px] font-medium">{m.text}</div>
                      <div className="text-[11px] text-muted">Added to this case</div>
                    </div>
                  </div>
                );
              // offer
              if (lawyerStatus !== "none") return null;
              return (
                <div
                  key={i}
                  className="ml-[38px] flex flex-wrap items-center gap-4 rounded-card border border-line bg-subtle px-[18px] py-4"
                >
                  <div className="min-w-[200px] flex-1">
                    <div className="text-sm font-semibold">Want a lawyer to look at this case?</div>
                    <div className="text-[13px] text-ink-2">
                      A verified lawyer reviews this case and your chat. Included with your case.
                    </div>
                  </div>
                  <Button size="sm" onClick={() => requestLawyer(c.id)}>
                    Request lawyer
                  </Button>
                </div>
              );
            })}
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
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="shrink-0 px-4 pb-[30px] pt-2 md:px-12 md:pb-[18px]">
        <div className="mx-auto flex max-w-[768px] flex-col gap-2">
          {out && (
            <div className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-subtle px-4 py-3">
              <div className="min-w-[180px] flex-1 text-[13px] leading-[1.5]">
                <b>You&apos;re out of chat credits for this case.</b> Top up to keep going.
              </div>
              <Button
                variant="outline"
                onClick={() => usePayment.getState().openFor("topup", c.id)}
              >
                Top up
              </Button>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className={`flex items-center gap-1.5 rounded-composer border border-line bg-subtle p-2 ${out ? "pointer-events-none opacity-50" : ""}`}
          >
            <button
              type="button"
              title="Attach a document"
              aria-label="Attach a document"
              disabled={out}
              onClick={() => attachToChat(c.id)}
              data-no-tap
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line text-muted"
            >
              <Paperclip size={15} />
            </button>
            <input
              value={input}
              disabled={out}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this case…"
              aria-label="Ask about this case"
              className="min-w-0 flex-1 bg-transparent px-3.5 text-[15px] text-ink outline-none"
            />
            <span className="whitespace-nowrap text-[11px] text-muted">{c.credits} credits</span>
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
            AI answers are general information. Each message uses 1 credit.
          </div>
        </div>
      </div>
    </div>
  );
}
