"use client";

import { useState } from "react";
import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/session";
import { exportCaseSummary } from "@/lib/cases/api";
import { caseKeys } from "@/lib/cases/queries";
import {
  caseSummaryFilename,
  emptySummaryProblem,
  preparingSummaryProblem,
  summaryAvailability,
  summaryProblemOf,
  type SummaryProblem,
} from "@/lib/cases/case-summary";
import { saveBlob } from "@/lib/download";
import { formatDay } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { Case, CaseIntake } from "@/lib/types";
import { useSite } from "@/components/site/site-provider";
import { useLanguage, useT } from "@/components/site/language-provider";

/**
 * "Download case summary", shared by the case header's menu and the Overview (ilovelawyer-client#137).
 *
 * Reads the intake already cached rather than fetching it, so the header doesn't poll the intake on
 * every tab; with nothing cached the API's 409 INTAKE_EMPTY / INTAKE_RUNNING say the same. Never
 * refreshes the intake: a download costs no AI work and no credits.
 *
 * `inline`: the Overview shows a problem under its button; the header menu, with nowhere to put one,
 * shows a toast. The pending state is shared through the mutation key, so a press in one place
 * disables the other too.
 */
export function useCaseSummaryDownload(c: Case, { inline = false }: { inline?: boolean } = {}) {
  const t = useT();
  // The PDF's own labels follow the app's language (KR offers Korean and English).
  const { lang } = useLanguage();
  const queryClient = useQueryClient();
  const userId = useSession((s) => s.user?.id);
  // Without the intake chat a site's intake stays empty, so the summary would only ever say "nothing yet".
  const available = useSite().intakeChat === "open";
  const [problem, setProblem] = useState<SummaryProblem | null>(null);

  const mutationKey = ["case-summary", c.id];
  const pending = useIsMutating({ mutationKey }) > 0;
  const mutation = useMutation({ mutationKey, mutationFn: () => exportCaseSummary(c.id, lang) });

  const report = (found: SummaryProblem) => {
    if (inline) setProblem(found);
    else if (found.tone === "info") toast.info(found.text);
    else toast.error(found.text);
  };

  const start = () => {
    if (pending) return;
    setProblem(null);
    const intake = queryClient.getQueryData<CaseIntake>(caseKeys.intake(userId, c.id));
    const availability = summaryAvailability(intake);
    if (availability === "empty") return report(emptySummaryProblem(t));
    if (availability === "preparing") return report(preparingSummaryProblem(t));

    mutation.mutate(undefined, {
      onSuccess: ({ blob, filename }) => {
        saveBlob(blob, filename ?? caseSummaryFilename(c.title));
        const asOf = intake?.status === "STALE" && intake.generatedAt ? formatDay(intake.generatedAt) : null;
        toast.success(t("Case summary downloaded"), {
          description: asOf ? t("From your overview as of {date}. Anything added since isn't in it.", { date: asOf }) : undefined,
        });
      },
      onError: (err) => report(summaryProblemOf(err, t)),
    });
  };

  return { available, pending, problem, start };
}
