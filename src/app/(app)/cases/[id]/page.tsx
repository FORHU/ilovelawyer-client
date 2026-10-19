"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CaseHeader } from "@/components/case/case-header";
import { Consultation } from "@/components/case/consultation";
import { LawyerTab } from "@/components/case/lawyer-tab";
import { Documents, Overview } from "@/components/case/overview-docs";
import { Tabs, type TabDef } from "@/components/case/tabs";
import { useApp } from "@/lib/store";

export default function CasePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const c = useApp((s) => s.cases.find((x) => String(x.id) === id));
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

  useEffect(() => {
    if (!c) router.replace("/cases");
  }, [c, router]);

  if (!c) return null;

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
