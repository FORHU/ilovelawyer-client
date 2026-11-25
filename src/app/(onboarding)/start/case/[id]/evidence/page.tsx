"use client";

import { useParams } from "next/navigation";
import { EvidenceScreen } from "@/components/evidence/evidence-screen";

/** The onboarding's first case, step 3: the proof the story and answers call for. Its Done ends the
 * onboarding on the case. */
export default function OnboardingEvidencePage() {
  const { id } = useParams<{ id: string }>();
  return <EvidenceScreen caseId={id} />;
}
