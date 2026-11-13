"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

export interface Choice {
  key: string;
  label: string;
  /** The way forward, shown stronger than the rest. */
  primary?: boolean;
  /** A way back, shown quieter and with no arrow. */
  quiet?: boolean;
}

/** Answers as full-width buttons, one under the other. */
export function ChoiceList({ label, choices, onPick }: { label: string; choices: Choice[]; onPick: (choice: Choice) => void }) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2">
      {choices.map((choice) => (
        <button
          key={choice.key}
          type="button"
          onClick={() => onPick(choice)}
          className={cn(
            "flex min-h-12 items-center justify-between gap-3 rounded-xl border px-3.5 text-left text-[14.5px] transition-colors",
            choice.primary && "border-primary bg-primary font-medium text-white hover:bg-ink",
            choice.quiet && "border-transparent text-ink-2 hover:text-ink",
            !choice.primary && !choice.quiet && "border-line bg-white text-ink hover:border-line-hover",
          )}
        >
          {choice.label}
          {!choice.quiet && <ArrowRight size={15} className={cn("shrink-0", choice.primary ? "text-white" : "text-gold")} aria-hidden />}
        </button>
      ))}
    </div>
  );
}
