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
  const summary = useCaseSummaryDownload(c, { inline: true });
  const bundle = useCaseSummaryDownload(c, { inline: true, format: "zip" });
  const t = useT();
  if (!summary.available && !bundle.available) return null;

  return (
    <div className="flex flex-col gap-2">
      {summary.available && (
        <Button variant="soft" size={size} className="w-full" disabled={summary.pending} onClick={summary.start}>
          <FileDown size={15} aria-hidden />
          {summary.pending ? t("Preparing your summary…") : t("Download case summary")}
        </Button>
      )}
      {summary.problem &&
        (summary.problem.tone === "error" ? (
          <ErrorBox message={summary.problem.text} />
        ) : (
          <p role="status" className="text-[13px] leading-[1.5] text-ink-2">
            {summary.problem.text}
          </p>
        ))}
      {bundle.available && (
        <Button variant="soft" size={size} className="w-full" disabled={bundle.pending} onClick={bundle.start}>
          <FileDown size={15} aria-hidden />
          {bundle.pending ? t("Preparing your files…") : t("Download case files")}
        </Button>
      )}
      {bundle.problem &&
        (bundle.problem.tone === "error" ? (
          <ErrorBox message={bundle.problem.text} />
        ) : (
          <p role="status" className="text-[13px] leading-[1.5] text-ink-2">
            {bundle.problem.text}
          </p>
        ))}
    </div>
  );
}
