import { cn } from "@/lib/cn";

import type { TabsProps } from "./tabs";

const STATUS_TONE = {
  warn: "bg-warn-bg text-warn-ink",
  error: "bg-error-bg text-error-ink",
  success: "bg-success-bg text-success-ink",
} as const;

export function TabsDesktop({ tabs, active, onChange }: TabsProps) {
  return (
    <div
      role="tablist"
      className="no-scrollbar flex shrink-0 gap-1 overflow-x-auto border-b border-line px-4 md:px-10"
    >
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
              "-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-2.5 py-[15px] text-sm font-medium md:px-[14px] md:py-3",
              on ? "border-gold text-ink" : "border-transparent text-ink-2 hover:text-ink",
            )}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="rounded-full bg-chip px-[7px] text-[11px] leading-[18px] text-ink">
                {t.count}
                <span className="sr-only"> items</span>
              </span>
            )}
            {t.status && (
              <span className={cn("rounded-full px-[9px] py-px text-[11px] font-semibold", STATUS_TONE[t.status.tone])}>
                {t.status.text}
              </span>
            )}
            {t.dot && <span className="size-1.5 rounded-full bg-gold" />}
          </button>
        );
      })}
    </div>
  );
}
