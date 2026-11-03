"use client";

import { useState, type ReactNode } from "react";
import { Archive, CircleHelp, Trash2 } from "lucide-react";
import { RemoveCaseModal, type RemoveMode } from "@/components/case/remove-case-modal";
import { useTour } from "@/lib/tour/store";
import type { Case } from "@/lib/types";

export interface CaseAction {
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  danger?: boolean;
}

/** What the case header's "More actions" menu offers, and the modal that Archive and Delete open,
 * shared by the desktop and mobile headers so a new action is added once. */
export function useCaseActions(c: Case): { items: CaseAction[]; modal: ReactNode } {
  const [removing, setRemoving] = useState<RemoveMode | null>(null);
  return {
    items: [
      { label: "Guide", icon: <CircleHelp size={14} />, onSelect: () => useTour.getState().setGuideOpen(true) },
      { label: "Archive case", icon: <Archive size={14} />, onSelect: () => setRemoving("archive") },
      { label: "Delete case", icon: <Trash2 size={14} />, onSelect: () => setRemoving("delete"), danger: true },
    ],
    modal: removing ? <RemoveCaseModal c={c} mode={removing} onClose={() => setRemoving(null)} /> : null,
  };
}
