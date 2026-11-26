"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BrandPanel } from "@/components/auth/brand-panel";
import { SensitiveInfoModal } from "@/components/consent/sensitive-info-modal";
import { DeviceProvider, useDevice } from "@/components/device/device-provider";
import { Toaster } from "@/components/ui/toaster";
import { useRestoreSessionQuery } from "@/lib/auth/mutations";
import { useSession } from "@/lib/auth/session";
import { StepFlowProvider, skipHrefOf } from "@/lib/cases/step-flow";
import { useHydrated } from "@/lib/use-hydrated";
import { OnboardingBar } from "./onboarding-bar";

/**
 * The onboarding's first case (app/(onboarding)/start/case): the story, its questions and its
 * evidence, on their own pages outside the app. Signed in only. As the sign-up and the privacy step
 * before them: the brand panel on a wide screen and the flow's top bar with Skip, no sidebar, no
 * tour. The screens are the app's own (StepFlowProvider tells them they're in the onboarding).
 */
export function OnboardingCaseFrame({ children }: { children: ReactNode }) {
  const router = useRouter();
  const ready = useHydrated();
  const status = useSession((s) => s.status);
  useRestoreSessionQuery();
  useEffect(() => {
    if (status === "signedOut") router.replace("/login");
  }, [status, router]);

  if (!ready || status !== "signedIn") return <div className="h-dvh bg-surface" />;
  return (
    <DeviceProvider>
      <StepFlowProvider flow="onboarding">
        <Frame>{children}</Frame>
        <SensitiveInfoModal />
        <Toaster />
      </StepFlowProvider>
    </DeviceProvider>
  );
}

/** One tree on a phone and a desktop, so a resize doesn't remount the step (and lose what's typed):
 * the panel shows from lg up, the bar on a desktop (a phone's step has Skip in its own header). */
function Frame({ children }: { children: ReactNode }) {
  const mobile = useDevice() === "mobile";
  const skipHref = skipHrefOf(usePathname());
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-surface text-ink">
      <BrandPanel />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {!mobile && <OnboardingBar skipHref={skipHref} />}
        {children}
      </div>
    </div>
  );
}
