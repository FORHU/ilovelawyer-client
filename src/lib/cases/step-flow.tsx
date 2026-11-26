"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * The story, questions and evidence screens are shown in two places, which look and link apart:
 *
 * - "onboarding": a new client's first case, straight after sign-up (app/(onboarding)/start/case).
 *   Its own pages, outside the app: the brand panel, Skip, no way back, and each step leading to
 *   the next until the case is ready.
 * - "app": any later case, from New case or a case's banners (app/(app)/cases). The app's pages,
 *   with the sidebar and a way back to the case.
 */
export type StepFlow = "onboarding" | "app";

/** Where the onboarding's steps live. */
export const ONBOARDING_CASE_BASE = "/start/case";

const StepFlowContext = createContext<StepFlow>("app");

export function StepFlowProvider({ flow, children }: { flow: StepFlow; children: ReactNode }) {
  return <StepFlowContext.Provider value={flow}>{children}</StepFlowContext.Provider>;
}

/** Which flow a step is in, and where its links go: the next step in the same flow, and the case
 * itself (always the app's) once the client leaves it. */
export function useStepFlow() {
  const flow = useContext(StepFlowContext);
  return stepFlowLinks(flow);
}

export function stepFlowLinks(flow: StepFlow) {
  const base = flow === "onboarding" ? ONBOARDING_CASE_BASE : "/cases";
  return {
    onboarding: flow === "onboarding",
    questionsHref: (caseId: string) => `${base}/${caseId}/questions`,
    evidenceHref: (caseId: string) => `${base}/${caseId}/evidence`,
    caseHref: (caseId: string) => `/cases/${caseId}`,
  };
}

/** Where Skip leaves an onboarding step for: the case itself from its questions or evidence (made
 * already, the rest can wait), the cases from the story (nothing made yet). */
export function skipHrefOf(pathname: string): string {
  const onCase = new RegExp(`^${ONBOARDING_CASE_BASE}/([^/]+)/(?:questions|evidence)$`).exec(pathname);
  return onCase ? `/cases/${onCase[1]}` : "/cases";
}
