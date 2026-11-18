"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useSession } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { useT } from "@/components/site/language-provider";
import { usePendingLawyer } from "@/lib/lawyers/chosen-lawyer";

/** Under the empty case chat: for a client who already knows who they want, Find a lawyer first.
 * Hidden once they've chosen one (ChosenLawyerBanner says who). */
export function BrowseLawyersLink({ className }: { className?: string }) {
  const t = useT();
  const userId = useSession((s) => s.user?.id);
  const chosen = usePendingLawyer(userId);
  if (chosen) return null;
  return (
    <p className={cn("text-[13px] text-ink-2", className)}>
      {t("Already know who you want?")}{" "}
      <Link href="/lawyers" data-tour="browse-lawyers" className="inline-flex min-h-11 items-center gap-1 font-medium text-ink md:min-h-0">
        {t("Browse lawyers first")}
        <ArrowRight size={13} className="text-gold" aria-hidden="true" />
      </Link>
    </p>
  );
}
