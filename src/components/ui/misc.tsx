import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Wordmark. Source is 1070x266. `height` is in px (20-24 in the prototype). */
export function Logo({ height = 22, className }: { height?: number; className?: string }) {
  return (
    <Image
      src="/brand/lockup-light.png"
      alt="ilovelawyer"
      width={Math.round(height * (1070 / 266))}
      height={height}
      priority
      className={className}
      style={{ height, width: "auto" }}
    />
  );
}

/** Round AI avatar mark. */
export function AiMark({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/brand/mark-light.png"
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 rounded-full border border-line", className)}
    />
  );
}

/** 10px / 600 / uppercase / 1px tracking. Gold by default. */
export function Eyebrow({
  children,
  muted,
  className,
}: {
  children: ReactNode;
  muted?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-[10px] font-semibold uppercase tracking-[1px]",
        muted ? "text-muted" : "text-gold",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Initials circle. */
export function Avatar({
  initials,
  size = 28,
  className,
}: {
  initials: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-line bg-chip font-semibold",
        className,
      )}
      style={{ width: size, height: size, fontSize: size >= 36 ? 12 : 11 }}
    >
      {initials}
    </div>
  );
}

export function initialsOf(name: string, max = 2) {
  return name
    .split(/[ .]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, max)
    .toUpperCase();
}

/** Key-value table used by Overview tabs. */
export function KeyValueTable({ rows }: { rows: { k: string; v: string }[] }) {
  return (
    <div className="overflow-hidden rounded-card border border-line">
      {rows.map((r) => (
        <div
          key={r.k}
          className="flex justify-between gap-4 border-b border-line px-[18px] py-[14px] text-sm last:border-b-0"
        >
          <span className="shrink-0 text-muted">{r.k}</span>
          <span className="text-right leading-normal">{r.v}</span>
        </div>
      ))}
    </div>
  );
}
