import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const inputClass =
  "h-12 w-full box-border rounded-input border border-line-input bg-white px-[14px] text-[15px] text-ink outline-none transition-colors focus:border-ink-2";

export function TextInput({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...rest} />;
}

/** Small field: 12px / 600 / #6b6b6b label (onboarding, payment). */
export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-semibold text-ink-2">
        {label}
      </label>
      {children}
    </div>
  );
}

/** Wizard label: 10px / 700 / uppercase / 1px tracking. */
export function WizardLabel({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-[10px] font-bold uppercase tracking-[1px] text-ink-2"
    >
      {children}
    </label>
  );
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputClass, "h-auto resize-y py-3 leading-[1.5]", className)} {...rest} />;
}
