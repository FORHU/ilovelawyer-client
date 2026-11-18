"use client";

import { Scale, X } from "lucide-react";
import { useT } from "@/components/site/language-provider";
import { useSession } from "@/lib/auth/session";
import { firstName } from "@/lib/format";
import { useChosenLawyer, usePendingLawyer } from "@/lib/lawyers/chosen-lawyer";

/** On New case, when the client chose a lawyer first (Find a lawyer): who this case is for, and a
 * way to drop them and be matched as usual. */
export function ChosenLawyerBanner({ className }: { className?: string }) {
  const t = useT();
  const userId = useSession((s) => s.user?.id);
  const lawyer = usePendingLawyer(userId);
  if (!lawyer) return null;
  const name = firstName(lawyer.name) ?? lawyer.name;
  return (
    <div role="status" className={`flex items-center gap-2.5 rounded-input border border-line bg-subtle px-3.5 py-2.5 ${className ?? ""}`}>
      <Scale size={15} className="shrink-0 text-gold" aria-hidden />
      <p className="min-w-0 flex-1 text-[13px] leading-[1.5] text-ink-2">
        <span className="font-semibold text-ink">{t("For {name}.", { name: lawyer.name })}</span>{" "}
        {t("Once your case has what a lawyer needs, we'll offer to send it to {name}.", { name })}
      </p>
      <button
        type="button"
        onClick={() => useChosenLawyer.getState().clearPending()}
        aria-label={t("Don't send this case to {name}", { name })}
        title={t("Don't send this case to {name}", { name })}
        data-no-tap
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-chip"
      >
        <X size={15} aria-hidden />
      </button>
    </div>
  );
}
