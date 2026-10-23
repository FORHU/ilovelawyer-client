"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CaseHeader } from "@/components/case/case-header";
import { Consultation } from "@/components/case/consultation";
import { LawyerTab } from "@/components/case/lawyer-tab";
import { Documents, Overview } from "@/components/case/overview-docs";
import { Tabs, type TabDef } from "@/components/case/tabs";
import { ApiError } from "@/lib/api/fetch";
import { useCaseQuery } from "@/lib/cases/queries";
import { useOpenLawyerRequestQuery } from "@/lib/lawyer-requests/api";
import { useApp } from "@/lib/store";

export default function CasePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: c, error, isPending } = useCaseQuery(id);
  const { data: openRequest } = useOpenLawyerRequestQuery(id);
  const lawyer = useApp((s) => s.lawyer);
  const unread = useApp((s) => s.lawyerUnread);
  const [tab, setTab] = useState("chat");

  const hasLawyerTab = !!c && lawyer.caseId === c.id && lawyer.status !== "none";
  // Adjust state while rendering: jump to the Lawyer tab when a request starts.
  const [hadLawyerTab, setHadLawyerTab] = useState(hasLawyerTab);
  if (hadLawyerTab !== hasLawyerTab) {
    setHadLawyerTab(hasLawyerTab);
    setTab(hasLawyerTab ? "lawyer" : "chat");
  }

  // A request made on another device shows here too; one withdrawn elsewhere goes away.
  useEffect(() => {
    if (openRequest !== undefined) useApp.getState().syncLawyerRequest(id, openRequest?.id ?? null);
  }, [id, openRequest]);

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
    { id: "chat", label: "Consultation" },
    { id: "overview", label: "Overview" },
    { id: "docs", label: "Documents" },
    ...(hasLawyerTab ? [{ id: "lawyer", label: "Lawyer", dot: unread && active !== "lawyer" }] : []),
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CaseHeader c={c} />
      <Tabs tabs={tabs} active={active} onChange={setTab} />
      {active === "chat" && <Consultation c={c} />}
      {active === "overview" && <Overview c={c} />}
      {active === "docs" && <Documents c={c} />}
      {active === "lawyer" && <LawyerTab c={c} />}
    </div>
  );
}
