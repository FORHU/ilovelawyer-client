import { cn } from "@/lib/cn";

export interface TabDef {
  id: string;
  label: string;
  dot?: boolean;
  /** A count beside the label, e.g. how many documents. */
  count?: number;
  /** A short status beside the label, e.g. "Finding a lawyer". */
  status?: { text: string; tone: "warn" | "error" | "success" };
}

const STATUS_TONE = {
  warn: "bg-warn-bg text-warn-ink",
  error: "bg-error-bg text-error-ink",
  success: "bg-success-bg text-success-ink",
} as const;

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}) {
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
