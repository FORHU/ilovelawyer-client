"use client";

import { useParams } from "next/navigation";
import { QuestionsScreen } from "@/components/questions/questions-screen";

/** The Questions step after a client's story: the details their case still needs. */
export default function QuestionsPage() {
  const { id } = useParams<{ id: string }>();
  return <QuestionsScreen caseId={id} />;
}
