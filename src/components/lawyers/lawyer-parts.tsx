import { ShieldCheck, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { initialsOf } from "@/components/ui/misc";
import type { MarketplaceLawyer } from "@/lib/lawyers/marketplace";

export function LawyerAvatar({ lawyer, size = 48 }: { lawyer: MarketplaceLawyer; size?: number }) {
  return (
    <div
      aria-hidden
      className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold text-white", lawyer.tone)}
      style={{ width: size, height: size, fontSize: size * 0.3 }}
    >
      {initialsOf(lawyer.name)}
    </div>
  );
}

export function VerifiedBadge({ regulator }: { regulator: string }) {
  const short = regulator.startsWith("Solicitors Regulation") ? "SRA" : regulator.startsWith("Law Society of Scotland") ? "Law Society of Scotland" : "Law Society NI";
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-success-ink">
      <ShieldCheck size={13} aria-hidden />
      {short} verified
    </span>
  );
}

export function Rating({ rating, count }: { rating: number; count: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[13px]">
      <Star size={13} className="fill-gold text-gold" aria-hidden />
      <span className="font-semibold">{rating.toFixed(1)}</span>
      <span className="text-ink-2">({count} reviews)</span>
    </span>
  );
}

export function AreaChip({ children }: { children: string }) {
  return <span className="rounded-full bg-chip px-3 py-1 text-[12.5px] text-ink">{children}</span>;
}
