import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Selectable filled chip (type of issue, party role). */
export function Chip({
  selected,
  small,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "rounded-full border font-medium transition-colors",
        small ? "min-h-[34px] px-3 text-[12.5px]" : "min-h-[38px] px-[14px] text-[13px]",
        "disabled:opacity-40",
        selected
          ? "border-ink bg-ink text-white"
          : "border-line-input bg-white text-ink hover:border-line-hover",
        className,
      )}
      {...rest}
    />
  );
}

/** Outlined suggestion chip (AI prompts, quick replies). */
export function PromptChip({
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "min-h-10 rounded-full border border-line-chip bg-subtle px-4 text-[13px] font-medium text-ink transition-colors hover:border-gold",
        className,
      )}
      {...rest}
    />
  );
}
