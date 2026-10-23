"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, FileText, Paperclip } from "lucide-react";
import { RequestStatusChip } from "@/components/case/request-status";
import { RequestTimeline } from "@/components/case/request-timeline";
import { WithdrawRequestModal } from "@/components/case/withdraw-request-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useLatestLawyerRequestQuery } from "@/lib/lawyer-requests/api";
import { describeStatus } from "@/lib/lawyer-requests/status";
import { useApp, useLawyerThread } from "@/lib/store";
import { AREA_LABELS, type Case, type ThreadMessage } from "@/lib/types";

const QUICK = ["I've added my documents", "Can we schedule a call?", "What should I do next?"];

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
  const thread = useLawyerThread(c.id);
  const { sendToLawyer, attachToLawyer, cancelLawyerRequest, markLawyerRead, setBanner } = useApp.getState();
  const { data: latest } = useLatestLawyerRequestQuery(c.id);
  const [withdrawing, setWithdrawing] = useState(false);
  const [input, setInput] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  // Everything here follows the request's real status from the API.
  const status = latest?.status;
  const inChat = status === "CONFIRMED" || status === "ENGAGED" || status === "CLOSED";
  const closed = status === "CLOSED";

  useEffect(() => {
    markLawyerRead(c.id);
  }, [markLawyerRead, c.id, thread.length, status]);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread.length, status]);

  if (!latest) {
    return (
      <div role="status" className="flex flex-1 items-center justify-center p-6 text-sm text-ink-2">
        Checking your request…
      </div>
    );
  }

  if (!inChat) {
    const shown = latest.status;
    const canWithdraw = describeStatus(shown).canWithdraw;
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="flex w-full max-w-[420px] flex-col gap-5 rounded-modal border border-line px-6 py-6">
          <div className="font-display text-[22px] tracking-[-0.02em]">Your lawyer request</div>
          <RequestTimeline status={shown} sentAt={latest.createdAt} />
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
            {canWithdraw && (
              <Button variant="ghost" size="lg" className="!px-3" onClick={() => setWithdrawing(true)}>
                Withdraw request
              </Button>
            )}
          </div>
        </div>
        <WithdrawRequestModal
          open={withdrawing}
          onClose={() => setWithdrawing(false)}
          requestId={latest.id}
          onWithdrawn={() => {
            cancelLawyerRequest(c.id);
            setBanner("Request withdrawn.");
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-4 py-2.5 md:px-6">
        <div className="flex size-[34px] items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
          MR
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">Atty. Maria Reyes</div>
          <div className="text-xs text-muted">Verified · {AREA_LABELS[c.area]}</div>
        </div>
        <RequestStatusChip status={latest.status} sentAt={latest.createdAt} />
      </div>

      <div ref={scroller} className="flex-1 overflow-y-auto px-4 pb-3 pt-6 md:px-10">
        <div className="mx-auto flex max-w-[720px] flex-col gap-3.5">
          {thread.length === 0 && !closed && (
            <div className="self-center rounded-input border border-line bg-subtle px-3.5 py-[7px] text-center text-xs text-ink-2">
              Your lawyer has access to your case. Say hello below.
            </div>
          )}
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
                  onClick={() => sendToLawyer(c.id, q)}
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
              sendToLawyer(c.id, input);
              setInput("");
            }}
            className="flex items-center gap-1.5 rounded-composer border border-line bg-subtle p-2"
          >
            <button
              type="button"
              title="Attach a document"
              aria-label="Attach a document"
              onClick={() => attachToLawyer(c.id)}
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
