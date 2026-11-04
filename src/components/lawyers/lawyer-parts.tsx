import { ShieldCheck, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { initialsOf } from "@/components/ui/misc";

export function LawyerAvatar({ lawyer, size = 48 }: { lawyer: { name: string; tone: string; avatarUrl?: string | null }; size?: number }) {
  if (lawyer.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={lawyer.avatarUrl} alt="" aria-hidden className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
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

/** "SRA verified": `regulator` is the API's code (SRA, LSS, LSNI) or the regulator's full name. */
export function VerifiedBadge({ regulator }: { regulator: string }) {
  const short =
    regulator === "SRA" || regulator.startsWith("Solicitors Regulation")
      ? "SRA"
      : regulator === "LSS" || regulator.startsWith("Law Society of Scotland")
        ? "Law Society of Scotland"
        : "Law Society NI";
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-success-ink">
      <ShieldCheck size={13} aria-hidden />
      {short} verified
    </span>
  );
}

export function Rating({ rating, count }: { rating: number | null; count: number }) {
  if (rating === null || count === 0) return <span className="text-[13px] text-ink-2">No reviews yet</span>;
  return (
    <span className="inline-flex items-center gap-1 text-[13px]">
      <Star size={13} className="fill-gold text-gold" aria-hidden />
      <span className="font-semibold">{rating.toFixed(1)}</span>
      <span className="text-ink-2">
        ({count} {count === 1 ? "review" : "reviews"})
      </span>
    </span>
  );
}

export function AreaChip({ children }: { children: string }) {
  return <span className="truncate whitespace-nowrap rounded-full bg-chip px-3 py-1 text-[12.5px] text-ink">{children}</span>;
}
