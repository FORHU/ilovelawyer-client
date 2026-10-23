import { Check, CircleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import type { LawyerRequestStatus } from "@/lib/lawyer-requests/api";
import { describeStatus, STEPS } from "@/lib/lawyer-requests/status";

/** "22 Oct", or "today" / "yesterday". */
function sentOn(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Where a lawyer request stands, in plain words: a progress bar, then the steps with the current one
 * lifted and the ones ahead saying what happens at them. Ended requests show one closing card instead. */
export function RequestTimeline({ status, sentAt }: { status: LawyerRequestStatus; /** When the request was made (ISO). */ sentAt?: string }) {
  const view = describeStatus(status);
  const current = STEPS.findIndex((s) => s.id === view.step);

  if (current === -1) {
    return (
      <div role="status" className="flex items-start gap-3 rounded-card border border-line bg-subtle p-4">
        <CircleAlert size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
        <div>
          <div className="text-sm font-semibold">{view.title}</div>
          <div className="mt-1 text-[13px] leading-[1.5] text-ink-2">{view.detail}</div>
        </div>
      </div>
    );
  }

  const confirmed = view.step === "confirmed";
  const sent = sentAt ? sentOn(sentAt) : null;

  return (
    <div className="flex flex-col gap-4">
      <p role="status" className="sr-only">
        Step {current + 1} of {STEPS.length}: {view.title}. {view.detail}
      </p>

      <div aria-hidden="true" className="flex flex-col gap-2">
        <div className="flex gap-1.5">
          {STEPS.map((step, i) => (
            <span
              key={step.id}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300 motion-reduce:transition-none",
                i < current || confirmed ? "bg-success" : i === current ? "bg-gold" : "bg-line",
              )}
            />
          ))}
        </div>
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[1px] text-muted">
          <span>{confirmed ? "Complete" : `Step ${current + 1} of ${STEPS.length}`}</span>
          {sent && <span className="font-medium normal-case tracking-normal">Sent {sent}</span>}
        </div>
      </div>

      <ol className="flex flex-col gap-1">
        {STEPS.map((step, i) => {
          const done = i < current || (i === current && confirmed);
          const active = i === current && !done;
          return (
            <li
              key={step.id}
              aria-current={active ? "step" : undefined}
              className={cn("relative flex gap-3 rounded-input px-3 py-2.5 transition-colors motion-reduce:transition-none", active && "border border-line bg-subtle")}
            >
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn("absolute left-[23px] top-[38px] bottom-[-14px] w-px", i < current ? "bg-success" : "bg-line")}
                />
              )}
              <span
                aria-hidden="true"
                className={cn(
                  "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border",
                  done && "border-success bg-success text-white",
                  active && "border-gold bg-white",
                  !done && !active && "border-line-input bg-white",
                )}
              >
                {done ? (
                  <Check size={13} strokeWidth={3} />
                ) : active ? (
                  <>
                    <span className="absolute size-6 rounded-full border border-gold opacity-40 motion-safe:animate-ping" />
                    <span className="size-2.5 rounded-full bg-gold" />
                  </>
                ) : (
                  <span className="text-[11px] font-semibold text-muted">{i + 1}</span>
                )}
              </span>
              <div className="min-w-0 pt-px">
                <div className={cn("text-sm", active ? "font-semibold text-ink" : done ? "font-medium text-ink" : "text-ink-2")}>{step.label}</div>
                <div className={cn("mt-0.5 text-[13px] leading-[1.5]", active ? "text-ink-2" : "text-muted")}>
                  {active ? view.detail : done ? null : step.next}
                </div>
              </div>
              <span className="sr-only">{done ? "Done" : active ? "Current step" : "Not started"}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
