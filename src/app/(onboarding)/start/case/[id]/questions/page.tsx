"use client";

import { useParams } from "next/navigation";
import { QuestionsScreen } from "@/components/questions/questions-screen";

/** The onboarding's first case, step 2: the details the story left out. */
export default function OnboardingQuestionsPage() {
  const { id } = useParams<{ id: string }>();
  return <QuestionsScreen caseId={id} />;
}
