import type { ReactNode } from "react";

export function AuthHeading({ title, sub }: { title: string; sub: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-display text-[28px] font-normal lg:text-[32px] leading-[1.2] tracking-[-0.02em]">
        {title}
      </h1>
      <div className="text-sm leading-[1.6] text-ink-2">{sub}</div>
    </div>
  );
}
