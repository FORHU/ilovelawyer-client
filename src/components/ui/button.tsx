import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "outline" | "ghost" | "social" | "dashed" | "danger" | "dark" | "soft" | "quiet";
type Size = "sm" | "md" | "lg" | "xl";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold uppercase transition-colors disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary: "bg-gold text-white tracking-[1.2px] hover:bg-gold-hover",
  outline:
    "border border-line bg-white text-ink tracking-[1px] hover:border-line-hover",
  ghost: "text-muted tracking-[1px] hover:text-ink",
  social:
    "w-full border border-line-input bg-white text-ink !normal-case !font-medium !text-[14px] tracking-normal gap-[10px] hover:border-line-hover",
  danger: "bg-error text-white tracking-[1.2px] hover:bg-error-ink",
  // The revised case screens: sentence-case pills, a near-black primary and a quieter outline.
  dark: "bg-primary text-white !normal-case !font-medium !text-[13px] tracking-normal hover:bg-ink",
  soft: "border border-line-input bg-white text-ink !normal-case !font-medium !text-[13px] tracking-normal hover:border-line-hover",
  quiet: "text-ink-2 !normal-case !font-medium !text-[12.5px] tracking-normal hover:text-ink",
  dashed:
    "border border-dashed border-line-input text-ink-2 tracking-[1px] hover:border-line-hover",
};

const sizes: Record<Size, string> = {
  sm: "h-[38px] px-5 text-[11px]",
  md: "h-[42px] px-[22px] text-[11px]",
  lg: "h-12 px-6 text-[11px]",
  xl: "h-[52px] px-6 text-[12px]",
};

export function buttonClass(
  variant: Variant = "primary",
  size: Size = "md",
  className?: string,
) {
  return cn(base, variants[variant], sizes[size], className);
}

/** ComponentProps, not ButtonHTMLAttributes: it carries `ref`, which React 19 passes like any prop. */
interface Props extends ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      {...rest}
    />
  );
}
