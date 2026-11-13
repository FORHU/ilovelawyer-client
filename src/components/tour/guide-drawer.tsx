"use client";

import { useRef } from "react";
import { ArrowRight, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { SUPPORT_CHAT_ENABLED, useSupport } from "@/lib/support/store";
import { selectedCaseTab } from "@/lib/tour/dom";
import { useTour } from "@/lib/tour/store";
import { guideContext, guideQuestions, tourForContext } from "@/lib/tour/tours";
import { useDialog } from "./use-dialog";

/** The guide: replays this page's tour or points at one control. A right-hand panel on desktop,
 * a sheet from the bottom on a phone. It is mounted when opened, so it reads the page it opened on. */
export function GuideDrawer({ pathname, credits, onTourPage }: { pathname: string; credits: number | null; onTourPage: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const close = () => useTour.getState().setGuideOpen(false);
  useDialog(panel, close);

  const context = guideContext(pathname, selectedCaseTab());
  const questions = guideQuestions(context, { credits });
  const canTour = tourForContext(context) !== null;

  return (
    <>
      <div aria-hidden onClick={close} className="fixed inset-0 z-[9005] bg-[rgb(23_23_23/0.55)]" style={{ animation: "fade-in .15s ease" }} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
        tabIndex={-1}
        className="fixed inset-x-0 bottom-0 z-[9006] box-border flex max-h-[85dvh] flex-col gap-3 overflow-y-auto rounded-t-[20px] bg-white px-[22px] pb-[calc(24px+env(safe-area-inset-bottom,0px))] pt-5 shadow-[0_0_50px_rgb(0_0_0/0.2)] outline-none md:inset-x-auto md:inset-y-0 md:right-0 md:max-h-none md:w-[380px] md:rounded-none md:pb-6"
      >
        <div className="flex items-center justify-between">
          <h2 id="guide-title" className="font-display text-[26px] tracking-[-0.01em]">
            Guide
          </h2>
          <button type="button" aria-label="Close guide" onClick={close} data-no-tap className="-mr-3 flex size-11 items-center justify-center text-ink-2">
            <X size={20} aria-hidden />
          </button>
        </div>

        {canTour && (
          <Button size="lg" onClick={onTourPage}>
            Tour this page
          </Button>
        )}

        {questions.length > 0 && (
          <>
            <div className="pt-1.5 text-[11px] font-semibold uppercase tracking-[1.4px] text-ink-2">How do I…</div>
            <div className="flex flex-col gap-2">
              {questions.map(({ question, step }) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => useTour.getState().startGuide(question, step)}
                  data-no-tap
                  className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-line bg-white px-3.5 text-left text-[14.5px] hover:border-line-hover"
                >
                  {question}
                  <ArrowRight size={15} className="shrink-0 text-gold" aria-hidden />
                </button>
              ))}
            </div>
          </>
        )}

        {SUPPORT_CHAT_ENABLED && (
          <button
            type="button"
            onClick={() => {
              close();
              useSupport.getState().openSupport({ audience: "SIGNED_IN" });
            }}
            data-no-tap
            className="mt-auto flex min-h-12 items-center justify-between gap-3 rounded-xl border border-line bg-white px-3.5 text-left text-[14.5px] font-medium hover:border-line-hover"
          >
            <span className="flex items-center gap-2.5">
              <MessageCircle size={16} className="text-gold" aria-hidden />
              Contact support
            </span>
            <ArrowRight size={15} className="shrink-0 text-gold" aria-hidden />
          </button>
        )}

        <div className={cn("flex flex-col gap-2 border-t border-line pt-3.5", !SUPPORT_CHAT_ENABLED && "mt-auto")}>
          <p className="text-[13px] leading-[1.5] text-ink-2">Legal questions go to your case&apos;s Interview, not the guide.</p>
          <p className="text-[12.5px] leading-[1.5] text-muted">
            ilovelawyer isn&apos;t a law firm. The AI organises your case. Advice comes from the solicitor you choose.
          </p>
        </div>
      </div>
    </>
  );
}
