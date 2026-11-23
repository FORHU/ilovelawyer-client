"use client";

import { useState, type ReactNode } from "react";
import { Archive, CircleHelp, FileDown, Trash2 } from "lucide-react";
import { RemoveCaseModal, type RemoveMode } from "@/components/case/remove-case-modal";
import { useTour } from "@/lib/tour/store";
import type { Case } from "@/lib/types";
import { useT } from "@/components/site/language-provider";
import { useCaseSummaryDownload } from "./use-case-summary-download";

export interface CaseAction {
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  danger?: boolean;
  /** Not available right now (its request is already running). */
  disabled?: boolean;
}

/** What the case header's "More actions" menu offers, and the modal that Archive and Delete open,
 * shared by the desktop and mobile headers so a new action is added once. */
export function useCaseActions(c: Case): { items: CaseAction[]; modal: ReactNode } {
  const [removing, setRemoving] = useState<RemoveMode | null>(null);
  const summary = useCaseSummaryDownload(c);
  const t = useT();
  return {
    items: [
      { label: t("Guide"), icon: <CircleHelp size={14} />, onSelect: () => useTour.getState().setGuideOpen(true) },
      ...(summary.available
        ? [{ label: t("Download case summary"), icon: <FileDown size={14} />, onSelect: summary.start, disabled: summary.pending }]
        : []),
      { label: t("Archive case"), icon: <Archive size={14} />, onSelect: () => setRemoving("archive") },
      { label: t("Delete case"), icon: <Trash2 size={14} />, onSelect: () => setRemoving("delete"), danger: true },
    ],
    modal: removing ? <RemoveCaseModal c={c} mode={removing} onClose={() => setRemoving(null)} /> : null,
  };
}
