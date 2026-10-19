"use client";

import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { AuthHeading } from "@/components/auth/heading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useApp } from "@/lib/store";

const ITEMS = [
  {
    title: "Terms and Privacy Policy",
    text: "I agree to the Terms of Service and the Privacy Policy.",
  },
  {
    title: "The AI is not a lawyer",
    text: "AI answers are general information, not legal advice.",
  },
  {
    title: "Paying per case",
    text: "Each case is a one-time $9.99 payment and includes 50 chat credits. A lawyer-client relationship starts only when a lawyer accepts my request.",
  },
];

export default function ConsentPage() {
  const router = useRouter();
  const { consent, toggleConsent, completeOnboarding } = useApp();
  const all = consent.every(Boolean);

  return (
    <div className="flex flex-col gap-5">
      <AuthHeading
        title="Before you start"
        sub="Please confirm three things so we're all on the same page."
      />
      <div className="flex flex-col gap-2.5" role="group" aria-label="Consent">
        {ITEMS.map((item, i) => {
          const on = consent[i];
          return (
            <button
              key={item.title}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => toggleConsent(i)}
              className={cn(
                "flex items-start gap-3 rounded-input border bg-subtle p-[14px] text-left",
                on ? "border-gold" : "border-line-input",
              )}
            >
              <span
                className={cn(
                  "flex size-[22px] shrink-0 items-center justify-center rounded-[7px] border-[1.5px] text-white",
                  on ? "border-gold bg-gold" : "border-line-input bg-white",
                )}
              >
                {on && <Check size={13} strokeWidth={3} />}
              </span>
              <span className="text-sm leading-[1.55]">
                <span className="block font-semibold">{item.title}</span>
                <span className="block text-[13px] text-ink-2">{item.text}</span>
              </span>
            </button>
          );
        })}
      </div>
      <Button
        size="lg"
        className="w-full"
        disabled={!all}
        onClick={() => {
          completeOnboarding();
          router.push("/cases");
        }}
      >
        Agree and continue
      </Button>
    </div>
  );
}
