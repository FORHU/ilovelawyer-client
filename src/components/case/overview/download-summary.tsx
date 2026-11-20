"use client";

import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { useCaseSummaryDownload } from "@/components/case/use-case-summary-download";
import type { Case } from "@/lib/types";
import { useT } from "@/components/site/language-provider";

/** The Overview's "Download case summary": the same action as the header menu's, with any "not yet"
 * or error shown right under the button instead of in a toast. */
export function DownloadSummaryButton({ c, size = "md" }: { c: Case; size?: "md" | "lg" }) {
  const { available, pending, problem, start } = useCaseSummaryDownload(c, { inline: true });
  const t = useT();
  if (!available) return null;

  return (
    <div className="flex flex-col gap-2">
      <Button variant="soft" size={size} className="w-full" disabled={pending} onClick={start}>
        <FileDown size={15} aria-hidden />
        {pending ? t("Preparing your summary…") : t("Download case summary")}
      </Button>
      {problem &&
        (problem.tone === "error" ? (
          <ErrorBox message={problem.text} />
        ) : (
          <p role="status" className="text-[13px] leading-[1.5] text-ink-2">
            {problem.text}
          </p>
        ))}
    </div>
  );
}
