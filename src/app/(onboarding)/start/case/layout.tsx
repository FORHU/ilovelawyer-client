import { OnboardingCaseFrame } from "@/components/onboarding/onboarding-case-frame";

/** The onboarding's first case: the story, then its questions and evidence, after the privacy step. */
export default function OnboardingCaseLayout({ children }: { children: React.ReactNode }) {
  return <OnboardingCaseFrame>{children}</OnboardingCaseFrame>;
}
