"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/chip";
import { useDevice } from "@/components/device/device-provider";
import { cn } from "@/lib/cn";
import { useUpdateCaseMutation } from "@/lib/cases/queries";
import { regionFields, UK_JURISDICTIONS, type CaseRegion } from "@/lib/types";

/**
 * Under the AI's latest answer while nobody has said which part of the UK the case is in (a case
 * started from the first message begins that way, #973): one tap saves it. Once saved the case
 * knows where it is, and LawyerSuggestion takes this spot (consultation.*.tsx).
 *
 * Only the three UK jurisdictions: there are no lawyers outside the UK, so it isn't offered here.
 */
export function RegionPrompt({ caseId }: { caseId: string }) {
  const mobile = useDevice() === "mobile";
  const update = useUpdateCaseMutation(caseId);
  const [failed, setFailed] = useState(false);

  const choose = (region: CaseRegion) => {
    setFailed(false);
    update.mutate(regionFields(region), { onError: () => setFailed(true) });
  };

  return (
    <div
      role="group"
      aria-label="Which part of the UK is this in?"
      className={cn("flex flex-col gap-2.5 rounded-card border border-line bg-subtle", mobile ? "p-4" : "ml-[38px] px-[18px] py-4")}
    >
      <div>
        <div className="text-sm font-semibold">Which part of the UK is this in?</div>
        <div className="text-[13px] leading-[1.45] text-ink-2">The law is different in each, so we need it to find the right lawyer.</div>
      </div>
      <div className={cn("gap-1.5", mobile ? "grid grid-cols-1" : "flex flex-wrap")}>
        {UK_JURISDICTIONS.map((j) => (
          <Chip key={j} small={!mobile} disabled={update.isPending} selected={update.isPending && update.variables?.ukJurisdiction === j} onClick={() => choose(j)}>
            {j}
          </Chip>
        ))}
      </div>
      {failed && (
        <div role="alert" className="text-[13px] text-error">
          That didn&apos;t save. Try again.
        </div>
      )}
    </div>
  );
}
