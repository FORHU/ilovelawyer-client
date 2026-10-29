"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CaseHeader } from "@/components/case/case-header";
import { Consultation } from "@/components/case/consultation";
import { LawyerTab } from "@/components/case/lawyer-tab";
import { Documents } from "@/components/case/overview-docs";
import { Overview } from "@/components/case/overview/overview";
import { Tabs, type TabDef } from "@/components/case/tabs";
import { ApiError } from "@/lib/api/fetch";
import { useCaseQuery } from "@/lib/cases/queries";
import { clientRequestStage, useLatestLawyerRequestQuery } from "@/lib/lawyer-requests/api";
import { lawyerTabStatus } from "@/lib/lawyer-requests/tab-status";

export default function CasePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: c, error, isPending } = useCaseQuery(id);
  const { data: latestRequest } = useLatestLawyerRequestQuery(id);
  const [tab, setTab] = useState("chat");
  /** A document link from Overview (#45): switches to Documents and scrolls to that file. */
  const [focusDocumentId, setFocusDocumentId] = useState<string | null>(null);
  const clearFocusDocument = useCallback(() => setFocusDocumentId(null), []);

  // Withdrawn is the client's own deliberate action, so it drops straight back to the ordinary
  // case view rather than leaving a banner; every other status, including the terminal ones, gets
  // a tab (the "No lawyer found" explanation in particular — #19 — is EXPIRED's whole point).
  const request = latestRequest && clientRequestStage(latestRequest.status) !== "withdrawn" ? latestRequest : null;
  const hasLawyerTab = !!request;
  // Adjust state while rendering: jump to the Lawyer tab when a request starts (made here, or on
  // another device — the open-request query covers both).
  const [hadLawyerTab, setHadLawyerTab] = useState(hasLawyerTab);
  if (hadLawyerTab !== hasLawyerTab) {
    setHadLawyerTab(hasLawyerTab);
    setTab(hasLawyerTab ? "lawyer" : "chat");
  }

  const notFound = error instanceof ApiError && error.status === 404;
  useEffect(() => {
    if (notFound) router.replace("/cases");
  }, [notFound, router]);

  if (isPending || notFound) return null;
  if (!c) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-ink-2">
        {error instanceof Error ? error.message : "Couldn't load this case."}
      </div>
    );
  }

  const active = tab === "lawyer" && !hasLawyerTab ? "chat" : tab;
  const tabs: TabDef[] = [
    { id: "chat", label: "Interview" },
    { id: "overview", label: "Overview" },
    { id: "docs", label: "Documents", count: c.documents.length },
    ...(request ? [{ id: "lawyer", label: "Lawyer", status: lawyerTabStatus(request.status, request.lawyer?.name.split(" ")[0]) }] : []),
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CaseHeader c={c} />
      <Tabs tabs={tabs} active={active} onChange={setTab} />
      {active === "chat" && <Consultation c={c} />}
      {active === "overview" && (
        <Overview
          c={c}
          onOpenDocument={(documentId) => {
            setFocusDocumentId(documentId);
            setTab("docs");
          }}
          // The Interview tab has no per-message anchor yet, so "You said" just switches to it.
          onOpenChat={() => setTab("chat")}
        />
      )}
      {active === "docs" && <Documents c={c} focusDocumentId={focusDocumentId} onFocused={clearFocusDocument} />}
      {active === "lawyer" && request && <LawyerTab c={c} request={request} />}
    </div>
  );
}
