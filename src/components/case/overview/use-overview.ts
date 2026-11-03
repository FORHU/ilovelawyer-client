"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api/fetch";
import { useIntakeQuery, useRefreshIntakeMutation } from "@/lib/cases/queries";
import type { Case } from "@/lib/types";

/** What the Overview reads and does, shared by its desktop and mobile views. The views only decide
 * how it is laid out (see overview-sections.tsx for the cards themselves). */
export function useOverview(c: Case) {
  const hasPendingDocuments = c.documents.some((d) => d.status === "PENDING");
  const { data: intake, error } = useIntakeQuery(c.id, hasPendingDocuments);
  const refresh = useRefreshIntakeMutation(c.id);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const onUpdate = () => {
    setUpdateError(null);
    refresh.mutate(undefined, {
      onError: (err) => setUpdateError(err instanceof ApiError ? err.message : "Couldn't update your overview. Try again."),
    });
  };

  return { intake, error, updatePending: refresh.isPending, updateError, onUpdate, running: intake?.status === "RUNNING" };
}
