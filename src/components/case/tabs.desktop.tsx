"use client";

import { cn } from "@/lib/cn";

import type { TabsProps } from "./tabs";
import { useT } from "@/components/site/language-provider";

const STATUS_TONE = {
  warn: "bg-warn-bg text-warn-ink",
  error: "bg-error-bg text-error-ink",
  success: "bg-success-bg text-success-ink",
} as const;

export function TabsDesktop({ tabs, active, onChange }: TabsProps) {
  const t = useT();
  return (
    <div
      role="tablist"
      className="no-scrollbar flex shrink-0 gap-1 overflow-x-auto border-b border-line px-10"
    >
      {tabs.map((tab) => {
        const on = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(tab.id)}
            data-tour={`tab-${tab.id}`}
            data-no-tap
            className={cn(
              "-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-[14px] py-3 text-sm font-medium",
              on ? "border-gold text-ink" : "border-transparent text-ink-2 hover:text-ink",
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="rounded-full bg-chip px-[7px] text-[11px] leading-[18px] text-ink">
                {tab.count}
                <span className="sr-only">{t(" items")}</span>
              </span>
            )}
            {tab.status && (
              <span className={cn("rounded-full px-[9px] py-px text-[11px] font-semibold", STATUS_TONE[tab.status.tone])}>
                {tab.status.text}
              </span>
            )}
            {tab.dot && <span className="size-1.5 rounded-full bg-gold" />}
          </button>
        );
      })}
    </div>
  );
}
