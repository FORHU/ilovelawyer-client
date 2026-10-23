"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, FileText, Paperclip, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useWithdrawLawyerRequestMutation } from "@/lib/lawyer-requests/api";
import { useApp } from "@/lib/store";
import { AREA_LABELS, type Case, type ThreadMessage } from "@/lib/types";

const QUICK = ["I've added my documents", "Can we schedule a call?", "What should I do next?"];
const isDev = process.env.NODE_ENV !== "production";

function FileCard({ name, mine }: { name: string; mine: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-input border border-line bg-white px-3.5 py-2.5",
        mine ? "self-end" : "ml-[38px] self-start",
      )}
    >
      <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-chip text-gold">
        <FileText size={15} />
      </div>
      <div>
        <div className="text-[13px] font-medium">{name}</div>
        <div className="text-[11px] text-muted">Shared document</div>
      </div>
    </div>
  );
}

function Message({ m }: { m: ThreadMessage }) {
  if (m.role === "event")
    return (
      <div className="flex items-center gap-2 self-center rounded-input border border-line bg-subtle px-3.5 py-[7px] text-center text-xs text-ink-2">
        {m.text}
      </div>
    );
  const mine = m.role === "user";
  if (m.file) return <FileCard name={m.text} mine={mine} />;
  if (mine)
    return (
      <div className="max-w-[75%] self-end rounded-[18px_18px_4px_18px] bg-ink px-4 py-3 text-[15px] leading-[1.6] text-white">
        {m.text}
      </div>
    );
  return (
    <div className="flex items-end gap-2.5">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] font-semibold text-white">
        MR
      </div>
      <div className="max-w-[75%] rounded-[18px_18px_18px_4px] border border-line bg-subtle px-4 py-3 text-[15px] leading-[1.6]">
        {m.text}
      </div>
    </div>
  );
}

export function LawyerTab({ c }: { c: Case }) {
  const status = useApp((s) => s.lawyer.status);
  const thread = useApp((s) => s.thread);
  const { sendToLawyer, attachToLawyer, cancelLawyerRequest, markLawyerRead, setBanner } = useApp.getState();
  const requestId = useApp((s) => s.lawyer.requestId);
  const withdraw = useWithdrawLawyerRequestMutation(c.id);
  const cancel = () => {
    if (!requestId) return cancelLawyerRequest();
    withdraw.mutate(requestId, {
      onSuccess: () => cancelLawyerRequest(),
      onError: (err) => setBanner(err instanceof Error ? err.message : "Couldn't cancel the request. Try again."),
    });
  };
  const [input, setInput] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const closed = status === "closed";

  useEffect(() => {
    markLawyerRead();
  }, [markLawyerRead, thread.length, status]);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread.length, status]);

  if (status === "matching") {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="flex max-w-[420px] flex-col items-center gap-2.5 rounded-modal border border-dashed border-line-input px-6 py-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full border border-line text-gold">
            <Radar size={20} />
          </div>
          <div className="font-display text-[22px] tracking-[-0.02em]">Finding your lawyer</div>
          <div className="text-[13px] leading-[1.6] text-ink-2">
            3 verified lawyers are reviewing your case. Most requests are accepted within an hour.
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {isDev && (
              <Button variant="outline" size="sm" onClick={() => useApp.getState().demoLawyerAccept()}>
                Demo: lawyer accepts
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={cancel} disabled={withdraw.isPending}>
              {withdraw.isPending ? "Cancelling…" : "Cancel request"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-2.5 md:px-6">
        <div className="flex size-[34px] items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
          MR
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">Atty. Maria Reyes</div>
          <div className="text-xs text-muted">Verified · {AREA_LABELS[c.area]}</div>
        </div>
        {isDev && !closed && (
          <Button variant="ghost" size="sm" data-no-tap onClick={() => useApp.getState().demoLawyerResolve()}>
            Demo: resolve
          </Button>
        )}
        <span
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[1px]",
            closed ? "text-success" : "text-gold",
          )}
        >
          {closed ? "Resolved" : "In consultation"}
        </span>
      </div>

      <div ref={scroller} className="flex-1 overflow-y-auto px-4 pb-3 pt-6 md:px-10">
        <div className="mx-auto flex max-w-[720px] flex-col gap-3.5">
          {thread.map((m, i) => (
            <Message key={i} m={m} />
          ))}
          {closed && (
            <div className="self-center rounded-input border border-line bg-subtle px-3.5 py-[7px] text-xs text-ink-2">
              Consultation closed by Atty. Reyes
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 px-4 pb-[30px] pt-2 md:px-10 md:pb-[18px]">
        <div className="mx-auto flex max-w-[720px] flex-col gap-2.5">
          {!closed && (
            <div className="flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendToLawyer(q)}
                  className="min-h-10 rounded-full border border-line-chip bg-subtle px-3.5 text-[12.5px] font-medium text-ink hover:border-gold"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendToLawyer(input);
              setInput("");
            }}
            className="flex items-center gap-1.5 rounded-composer border border-line bg-subtle p-2"
          >
            <button
              type="button"
              title="Attach a document"
              aria-label="Attach a document"
              onClick={attachToLawyer}
              data-no-tap
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line text-muted"
            >
              <Paperclip size={15} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Atty. Reyes…"
              aria-label="Message Atty. Reyes"
              className="min-w-0 flex-1 bg-transparent px-3.5 text-[15px] text-ink outline-none"
            />
            <button
              type="submit"
              aria-label="Send"
              data-no-tap
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold text-white"
            >
              <ArrowUpRight size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
