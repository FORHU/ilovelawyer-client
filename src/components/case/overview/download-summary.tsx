"use client";

import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { useCaseSummaryDownload } from "@/components/case/use-case-summary-download";
import type { Case } from "@/lib/types";
import { useT } from "@/components/site/language-provider";

/** The Overview's "Download case files": one ZIP with the case summary PDF plus every uploaded
 * file, the same action as the header menu's, with any "not yet" or error shown right under the
 * button instead of in a toast. */
export function DownloadSummaryButton({ c, size = "md" }: { c: Case; size?: "md" | "lg" }) {
  const bundle = useCaseSummaryDownload(c, { inline: true, format: "zip" });
  const t = useT();
  if (!bundle.available) return null;

  return (
    <div className="flex flex-col gap-2">
      <Button variant="soft" size={size} className="w-full" disabled={bundle.pending} onClick={bundle.start}>
        <FileDown size={15} aria-hidden />
        {bundle.pending ? t("Preparing your files…") : t("Download case files")}
      </Button>
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
