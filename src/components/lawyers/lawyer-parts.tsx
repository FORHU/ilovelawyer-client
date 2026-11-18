import { ShieldCheck, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { initialsOf } from "@/components/ui/misc";
import type { LawyerRegulator } from "@/lib/lawyers/marketplace";
import { useT } from "@/components/site/language-provider";
import { msg } from "@/lib/i18n/msg";
import { currentLocale } from "@/lib/i18n/translate";

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

/** "SRA verified": `regulator` is the API's code (SRA, LSS, LSNI), the regulator's full name, or a KR
 * lawyer's "Korean Bar Association". */
export function VerifiedBadge({ regulator }: { regulator: string }) {
  const t = useT();
  const short =
    regulator === "Korean Bar Association"
      ? t("Korean Bar Association")
      : regulator === "SRA" || regulator.startsWith("Solicitors Regulation")
        ? "SRA"
        : regulator === "LSS" || regulator.startsWith("Law Society of Scotland")
          ? "Law Society of Scotland"
          : "Law Society NI";
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-success-ink">
      <ShieldCheck size={13} aria-hidden />
      {t("{regulator} verified", { regulator: short })}
    </span>
  );
}

export function Rating({ rating, count }: { rating: number | null; count: number }) {
  const t = useT();
  if (rating === null || count === 0) return <span className="text-[13px] text-ink-2">{t("No reviews yet")}</span>;
  return (
    <span className="inline-flex items-center gap-1 text-[13px]">
      <Star size={13} className="fill-gold text-gold" aria-hidden />
      <span className="font-semibold">{rating.toFixed(1)}</span>
      <span className="text-ink-2">{count === 1 ? t("({n} review)", { n: count }) : t("({n} reviews)", { n: count })}</span>
    </span>
  );
}

export function AreaChip({ children }: { children: string }) {
  return <span className="truncate whitespace-nowrap rounded-full bg-chip px-3 py-1 text-[12.5px] text-ink">{children}</span>;
}

/** A regulator's full name; shown through t() (KR's is the Korean Bar Association). */
export const REGULATORS: Record<string, string> = {
  SRA: "Solicitors Regulation Authority",
  LSS: "Law Society of Scotland",
  LSNI: "Law Society of Northern Ireland",
  "Korean Bar Association": msg("Korean Bar Association"),
};
export type { LawyerRegulator };

/** "Oct 2026" ("2026년 10월" in Korean). */
export const monthOf = (iso: string) => new Date(iso).toLocaleDateString(currentLocale(), { month: "short", year: "numeric" });

/** A review's stars, as a number out of 5 for screen readers. */
export function Stars({ n }: { n: number }) {
  const t = useT();
  return (
    <span className="inline-flex" aria-label={t("{n} out of 5", { n })}>
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} size={12} className="fill-gold text-gold" aria-hidden />
      ))}
    </span>
  );
}
