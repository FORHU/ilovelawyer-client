"use client";

import { useParams } from "next/navigation";
import { EvidenceScreen } from "@/components/evidence/evidence-screen";

/** The evidence step after a client's questions: the proof their case would benefit from. */
export default function EvidencePage() {
  const { id } = useParams<{ id: string }>();
  return <EvidenceScreen caseId={id} />;
}
