"use client";

import Link from "next/link";
import { useT } from "@/components/site/language-provider";
import { useSensitiveInfoStatus } from "@/lib/consent/sensitive-info";

/** Shown on a case when the client declined the sensitive-information step: the AI isn't reading
 * it, and where to change that. Nothing for a client who agreed or hasn't been asked yet. */
export function SensitiveInfoNotice() {
  const t = useT();
  if (useSensitiveInfoStatus() !== "withdrawn") return null;
  return (
    <div role="status" className="rounded-input border border-warn-line bg-warn-bg px-3.5 py-2.5 text-[12.5px] leading-[1.5] text-warn-ink">
      {t("The AI isn’t reading this case because you haven’t agreed to how sensitive information is handled.")}{" "}
      <Link href="/settings?section=ai-use" className="font-medium underline underline-offset-2">
        {t("Change this in Settings")}
      </Link>
    </div>
  );
}
