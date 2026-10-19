import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Radio dot used by RadioCard and pack/payment rows. */
export function RadioDot({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px]",
        on ? "border-gold" : "border-line",
      )}
    >
      <span
        className={cn("size-2.5 rounded-full", on ? "bg-gold" : "bg-transparent")}
      />
    </span>
  );
}

interface Props {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description?: string;
  trailing?: ReactNode;
  /** compact = modal rows (14px radius, 44px min height). Default = full cards (16px radius). */
  compact?: boolean;
}

export function RadioCard({
  selected,
  onSelect,
  title,
  description,
  trailing,
  compact,
}: Props) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full gap-3 border-[1.5px] bg-white text-left transition-colors",
        compact
          ? "min-h-11 items-center rounded-input px-[14px] py-3"
          : "items-start rounded-card p-4",
        selected ? "border-gold" : "border-line",
      )}
    >
      <span className={cn(!compact && "mt-0.5")}>
        <RadioDot on={selected} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block font-semibold",
            compact ? "text-sm" : "text-[15px]",
          )}
        >
          {title}
        </span>
        {description && (
          <span
            className={cn(
              "block text-ink-2",
              compact ? "text-xs" : "mt-0.5 text-[13px] leading-[1.55]",
            )}
          >
            {description}
          </span>
        )}
      </span>
      {trailing && <span className="text-sm font-semibold">{trailing}</span>}
    </button>
  );
}
