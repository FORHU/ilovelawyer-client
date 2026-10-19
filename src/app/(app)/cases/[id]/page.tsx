"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CaseHeader } from "@/components/case/case-header";
import { Consultation } from "@/components/case/consultation";
import { Documents, Overview } from "@/components/case/overview-docs";
import { Tabs, type TabDef } from "@/components/case/tabs";
import { useApp } from "@/lib/store";

export default function CasePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const c = useApp((s) => s.cases.find((x) => String(x.id) === id));
  const lawyer = useApp((s) => s.lawyer);
  const [tab, setTab] = useState("chat");

  useEffect(() => {
    if (!c) router.replace("/cases");
  }, [c, router]);

  if (!c) return null;

  const hasLawyerTab = lawyer.caseId === c.id && lawyer.status !== "none";
  const tabs: TabDef[] = [
    { id: "chat", label: "Consultation" },
    { id: "overview", label: "Overview" },
    { id: "docs", label: "Documents" },
    ...(hasLawyerTab ? [{ id: "lawyer", label: "Lawyer" }] : []),
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CaseHeader c={c} />
      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      {tab === "chat" && <Consultation c={c} />}
      {tab === "overview" && <Overview c={c} />}
      {tab === "docs" && <Documents c={c} />}
    </div>
  );
}
