"use client";

import { cn } from "@/lib/cn";
import type { TabsProps } from "./tabs";

const STATUS_DOT = {
  warn: "bg-gold",
  error: "bg-error",
  success: "bg-success",
} as const;

/** Every tab always visible, equal width, no sideways scrolling to find one. A tab's status is a
 * coloured dot here (its words are read out to screen readers), and a count sits beside
 * the label. */
export function TabsMobile({ tabs, active, onChange }: TabsProps) {
  return (
    <div role="tablist" className="keyboard-hide grid shrink-0 grid-flow-col auto-cols-fr border-b border-line bg-white">
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            data-tour={`tab-${t.id}`}
            data-no-tap
            className={cn(
              "relative flex min-h-12 min-w-0 items-center justify-center gap-1.5 px-1 text-[14px] font-medium transition-colors active:bg-subtle",
              on ? "text-ink" : "text-ink-2",
            )}
          >
            <span className="truncate">{t.label}</span>
            {t.count !== undefined && t.count > 0 && (
              <span className="rounded-full bg-chip px-1.5 text-[11px] leading-[18px] text-ink">
                {t.count}
                <span className="sr-only"> items</span>
              </span>
            )}
            {t.status && (
              <>
                <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", STATUS_DOT[t.status.tone])} />
                <span className="sr-only">{t.status.text}</span>
              </>
            )}
            {t.dot && <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-gold" />}
            <span aria-hidden="true" className={cn("absolute inset-x-3 bottom-0 h-0.5 rounded-full", on ? "bg-gold" : "bg-transparent")} />
          </button>
        );
      })}
    </div>
  );
}
