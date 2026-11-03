"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { ChatBar, ChatScreen } from "@/components/mobile/chat";
import { TourHint } from "@/components/tour/tour-hint";
import { GuideButton } from "@/components/tour/guide-button";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { cn } from "@/lib/cn";
import { WIZARD_STEPS, useWizard } from "@/lib/wizard-store";
import type { NewCaseFormProps } from "./new-case-form";
import { StepBudgetMobile, StepDetailsMobile, StepDocumentsMobile, StepPeopleMobile } from "./steps.mobile";

const STEP_TITLES = ["Case details", "People involved", "Budget", "Documents"];

/** After a Continue that was turned back, takes the person to the first thing to fix. */
function focusFirstProblem() {
  const s = useWizard.getState();
  const target = s.titleErr ? "case-title" : s.areasErr ? "field-areas" : s.regionErr ? "field-region" : s.budgetErr ? "budget-own" : null;
  if (!target) return;
  requestAnimationFrame(() => {
    const el = document.getElementById(target);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    el?.focus({ preventScroll: true });
  });
}

/** The phone's manual case form: one question per screen under a step header with progress, and
 * Back and Continue in a bar at the bottom, lifted above the keyboard. The step header goes while
 * the keyboard is up, so what's being typed keeps the room. */
export function NewCaseFormMobile({ included, creating, error, onBack, onNext, onChat }: NewCaseFormProps) {
  const step = useWizard((s) => s.step);
  const scroller = useRef<HTMLDivElement>(null);

  // Each step starts at its top.
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [step]);

  const last = step === WIZARD_STEPS;
  const next = () => {
    onNext();
    if (!last) focusFirstProblem();
  };

  return (
    <ChatScreen>
      <header className="keyboard-hide shrink-0 border-b border-line">
        <div className="flex items-center gap-1 px-2 py-1">
          <button
            type="button"
            onClick={onBack}
            aria-label={step === 1 ? "Back to cases" : "Back to the previous step"}
            data-no-tap
            className="flex size-11 shrink-0 items-center justify-center rounded-full active:bg-chip"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] text-muted">
              Step {step} of {WIZARD_STEPS}
            </div>
            <div className="truncate text-[15px] font-medium leading-tight">{STEP_TITLES[step - 1]}</div>
          </div>
          <GuideButton variant="bar" />
        </div>
        <div role="progressbar" aria-label="Progress" aria-valuemin={1} aria-valuemax={WIZARD_STEPS} aria-valuenow={step} className="flex gap-1 px-4 pb-2.5">
          {Array.from({ length: WIZARD_STEPS }, (_, i) => (
            <span key={i} className={cn("h-1 flex-1 rounded-full", i < step ? "bg-gold" : "bg-line")} />
          ))}
        </div>
      </header>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 px-4 pb-8 pt-5">
          {step === 1 && <TourHint />}
          {step === 1 && <StepDetailsMobile />}
          {step === 2 && <StepPeopleMobile />}
          {step === 3 && <StepBudgetMobile />}
          {step === 4 && <StepDocumentsMobile />}
          {error && <ErrorBox message={error} />}
          {step === 1 && (
            <button type="button" onClick={onChat} data-no-tap className="min-h-11 self-center text-[14px] font-medium text-ink-2 underline underline-offset-4">
              Chat with us instead
            </button>
          )}
        </div>
      </div>

      <ChatBar>
        <div className="flex gap-2">
          {step > 1 && (
            <Button variant="outline" size="xl" className="flex-1" onClick={onBack} disabled={creating}>
              Back
            </Button>
          )}
          <Button size="xl" className="flex-[1.6] disabled:!opacity-60" onClick={next} disabled={creating}>
            {!last ? "Continue" : creating ? "Creating…" : "Create case"}
          </Button>
        </div>
        <p className="mt-2 text-center text-[11.5px] text-muted">Free · includes {included} chat credits</p>
      </ChatBar>
    </ChatScreen>
  );
}
