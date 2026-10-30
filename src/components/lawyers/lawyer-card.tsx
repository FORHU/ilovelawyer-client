import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { consultationLabel, range, type MarketplaceLawyer } from "@/lib/lawyers/marketplace";
import { AreaChip, LawyerAvatar, Rating, VerifiedBadge } from "./lawyer-parts";

function Fee({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-ink-2">{label}</span>
      <span className="text-[15px] font-semibold">{value}</span>
    </div>
  );
}

/** One lawyer in the marketplace grid. Both buttons open the profile, whose side panel holds the request. */
export function LawyerCard({ lawyer }: { lawyer: MarketplaceLawyer }) {
  const profile = `/lawyers/${lawyer.id}`;
  return (
    <article className="flex flex-col gap-4 rounded-card border border-line bg-white p-5">
      <div className="flex items-start gap-3.5">
        <LawyerAvatar lawyer={lawyer} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="truncate text-base font-semibold">{lawyer.name}</h3>
          <p className="truncate text-[13px] text-ink-2">
            {lawyer.firmName ? `${lawyer.firmName} · ` : ""}
            {lawyer.town}
          </p>
          <VerifiedBadge regulator={lawyer.regulator} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-2">
        <Rating rating={lawyer.rating} count={lawyer.reviewCount} />
        <span>{lawyer.jurisdictions.join(", ")}</span>
        <span>{lawyer.languages.join(", ")}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {lawyer.practiceAreas.map((a) => (
          <AreaChip key={a}>{a}</AreaChip>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 rounded-input border border-line bg-subtle px-4 py-3">
        <Fee label="First consultation" value={consultationLabel(lawyer)} />
        <Fee label="Fixed fees" value={lawyer.fixedFees ? range(lawyer.fixedFees) : "—"} />
        <Fee label="Hourly" value={lawyer.hourly ? range(lawyer.hourly) : "—"} />
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
        <span className="text-[13px] text-ink-2">Usually replies in {lawyer.repliesIn}</span>
        <div className="flex gap-2">
          <Link href={profile} className={cn(buttonClass("soft", "sm"), "no-underline hover:text-ink")}>
            View profile
          </Link>
          <Link href={`${profile}#request`} className={cn(buttonClass("dark", "sm"), "text-white no-underline hover:text-white")}>
            Request
          </Link>
        </div>
      </div>
    </article>
  );
}
