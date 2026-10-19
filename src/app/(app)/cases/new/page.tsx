"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepDetails, StepDocuments, StepPeople } from "@/components/wizard/steps";
import { cn } from "@/lib/cn";
import { CASE_CREDITS, CASE_PRICE, money } from "@/lib/pricing";
import { usePayment } from "@/lib/payment-store";
import { useWizard } from "@/lib/wizard-store";

const STEPS = [
  { numeral: "I", title: "Case details", hint: "Title and place" },
  { numeral: "II", title: "People involved", hint: "Your side and the others" },
  { numeral: "III", title: "Documents", hint: "Files for the AI to read" },
];

export default function NewCasePage() {
  const router = useRouter();
  const wiz = useWizard();
  const { step, maxStep, title, side } = wiz;

  useEffect(() => {
    useWizard.getState().enter();
  }, []);

  const stepDone = (n: number) => (n === 1 ? !!title.trim() : n === 2 ? !!side : false);

  const onNext = () => {
    if (wiz.next()) usePayment.getState().openFor("case");
  };
  const onBack = () => {
    if (wiz.back()) router.push("/cases");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto grid w-full max-w-[1080px] grid-cols-1 items-start gap-5 px-4 py-7 md:grid-cols-[260px_minmax(0,1fr)] md:gap-12 md:px-10">
        <div className="flex flex-col gap-5">
          <button
            type="button"
            onClick={() => router.push("/cases")}
            data-no-tap
            className="flex min-h-8 items-center gap-2 self-start text-[10px] font-semibold uppercase tracking-[1.2px] text-ink-2"
          >
            <ArrowLeft size={14} />
            Cases
          </button>
          <div className="hidden flex-col gap-2.5 md:flex">
            <h1 className="font-display text-[40px] font-normal leading-none tracking-[-0.02em]">
              New case
            </h1>
            <p className="text-[13px] leading-[1.6] text-ink-2">
              Tell us what happened, who is involved, and add your documents. You can edit
              everything later. A case costs {money(CASE_PRICE)} and includes {CASE_CREDITS} chat
              credits.
            </p>
          </div>
          <ol className="flex flex-row justify-between gap-1 md:flex-col">
            {STEPS.map((s, i) => {
              const n = i + 1;
              const done = n < step && stepDone(n);
              const cur = n === step;
              return (
                <li key={s.numeral} className="flex-1 md:flex-none">
                  <button
                    type="button"
                    onClick={() => wiz.goTo(n)}
                    disabled={n > maxStep}
                    aria-current={cur ? "step" : undefined}
                    data-no-tap
                    className="flex w-full flex-col items-center gap-3 py-3 text-center disabled:cursor-default md:flex-row md:border-t md:border-line md:text-left"
                  >
                    <span
                      className={cn(
                        "box-border flex size-[26px] shrink-0 items-center justify-center rounded-full border font-display text-xs",
                        done
                          ? "border-gold bg-gold text-white"
                          : cur
                            ? "border-gold bg-white text-gold"
                            : "border-line-input bg-white text-muted",
                      )}
                    >
                      {done ? <Check size={13} strokeWidth={3} /> : s.numeral}
                    </span>
                    <span>
                      <span
                        className={cn(
                          "block text-[13px] font-medium",
                          done || cur ? "text-ink" : "text-muted",
                        )}
                      >
                        {s.title}
                      </span>
                      <span className="mt-0.5 hidden text-[11.5px] text-muted md:block">
                        {s.hint}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {step === 1 && <StepDetails />}
          {step === 2 && <StepPeople />}
          {step === 3 && <StepDocuments />}

          <div className="sticky bottom-0 z-[2] -mx-4 flex items-center justify-between gap-2.5 border-t border-line bg-white px-4 pb-[30px] pt-3 md:static md:mx-0 md:border-t-0 md:bg-transparent md:p-0">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <div className="flex items-center gap-3.5">
              <div className="hidden text-xs text-muted md:block">
                {money(CASE_PRICE)} · includes {CASE_CREDITS} chat credits
              </div>
              <Button className="px-[26px]" onClick={onNext}>
                {step < 3 ? "Continue" : "Continue to payment"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
