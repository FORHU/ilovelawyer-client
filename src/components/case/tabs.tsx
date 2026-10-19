import { cn } from "@/lib/cn";

export interface TabDef {
  id: string;
  label: string;
  dot?: boolean;
}

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
      className="no-scrollbar flex shrink-0 overflow-x-auto border-b border-line px-4 md:px-10"
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
              "-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-2.5 py-[15px] text-sm font-medium md:px-[14px] md:py-3",
              on ? "border-gold text-ink" : "border-transparent text-muted",
            )}
          >
            {t.label}
            {t.dot && <span className="size-1.5 rounded-full bg-gold" />}
          </button>
        );
      })}
    </div>
  );
}
