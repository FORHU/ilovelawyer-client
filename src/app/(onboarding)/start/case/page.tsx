"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StoryIntake } from "@/components/story/story-intake";
import { StepTopRow } from "@/components/steps/step-page";
import { useDevice } from "@/components/device/device-provider";
import { useSession } from "@/lib/auth/session";
import { stepFlowLinks } from "@/lib/cases/step-flow";
import { readSearchText } from "@/lib/marketing/search-prefill";

const onboarding = stepFlowLinks("onboarding");

/** The story as it's told, kept in this browser until it's sent, so a reload doesn't lose it. */
const draftKey = (userId: string | undefined) => `ilovelawyer:onboarding-story:${userId ?? ""}`;

function readDraft(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeDraft(key: string, text: string | null) {
  try {
    if (text) window.localStorage.setItem(key, text);
    else window.localStorage.removeItem(key);
  } catch {
    // Not kept: the story is still on screen.
  }
}

/** The onboarding's first case, step 1: the story, after the privacy step. "Start questions" goes on
 * to the onboarding's own questions; the form is the app's (no AI). */
export default function OnboardingStoryPage() {
  const router = useRouter();
  const mobile = useDevice() === "mobile";
  const key = draftKey(useSession((s) => s.user?.id));
  const [initialText] = useState(() => readSearchText() ?? readDraft(key) ?? "");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {mobile && (
        <div className="px-4 pt-2">
          <StepTopRow caseHref="/cases" />
        </div>
      )}
      <StoryIntake
        initialText={initialText}
        onTextChange={(text) => writeDraft(key, text)}
        onCreated={() => writeDraft(key, null)}
        onContinue={(caseId) => router.push(onboarding.questionsHref(caseId))}
        onUseForm={() => router.push("/cases/new?mode=form")}
      />
    </div>
  );
}
