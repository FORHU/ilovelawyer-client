"use client";

import { Responsive } from "@/components/device/responsive";
import { NewCaseFormDesktop } from "./new-case-form.desktop";
import { NewCaseFormMobile } from "./new-case-form.mobile";

export interface NewCaseFormProps {
  /** The chat credits a new case includes, for the "Free · includes…" line. */
  included: number | string;
  creating: boolean;
  error: string;
  /** Back a step, or out to the cases list from the first. */
  onBack: () => void;
  /** Continue, or create the case from the last step. */
  onNext: () => void;
  /** Switch to the chat way of starting a case. */
  onChat: () => void;
}

/** The manual way to start a case: four steps, a dedicated view per device. The answers live in
 * the wizard store (lib/wizard-store.ts) for both. */
export function NewCaseForm(props: NewCaseFormProps) {
  return <Responsive desktop={<NewCaseFormDesktop {...props} />} mobile={<NewCaseFormMobile {...props} />} />;
}
