"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PaymentModal } from "@/components/payment/payment-modal";
import { LawyerRequestModal } from "@/components/case/lawyer-request-modal";
import { LandingWatcher } from "@/components/shell/landing-watcher";
import { TourLayer } from "@/components/tour/tour-layer";
import { SuccessBanner } from "@/components/ui/banner";
import { Toaster } from "@/components/ui/toaster";
import { leaveToLogin } from "@/lib/auth/api";
import { useRestoreSessionQuery } from "@/lib/auth/mutations";
import { useSession } from "@/lib/auth/session";
import { useChatSocket } from "@/lib/cases/chat-socket";
import { useLawyerRequestSocket } from "@/lib/lawyer-requests/socket";
import { useAppSocket } from "@/lib/socket";
import { useApp } from "@/lib/store";
import { useHydrated } from "@/lib/use-hydrated";
import { useDevice } from "@/components/device/device-provider";
import { BottomTabBar, MobileTopBar, isImmersive } from "./mobile-nav";
import { Sidebar } from "./sidebar";

/** The phone's top and bottom bars. They read the path (to step aside on a chat), so they render
 * only once the shell is ready: reading the path in AppShell itself would block prerendering. */
function MobileTop({ name }: { name: string }) {
  return isImmersive(usePathname()) ? null : <MobileTopBar name={name} />;
}

function MobileBottom() {
  return isImmersive(usePathname()) ? null : <BottomTabBar />;
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const device = useDevice();
  const ready = useHydrated();
  const status = useSession((s) => s.status);
  const user = useSession((s) => s.user);
  const { banner, setBanner, claimFor } = useApp();

  // A reload starts with no access token in memory: resume from the refresh cookie, if any.
  useRestoreSessionQuery();
  // The one socket connection (lib/socket.ts), then what listens on it: the signed-in account's
  // own lawyer requests, and AI chat replies (the chat never polls for them).
  useAppSocket();
  useLawyerRequestSocket();
  useChatSocket();

  // Never signed in on this page load: a plain navigation. Signed out mid-session (the session
  // expired): a full load, so nothing of the account stays in memory (see leaveToLogin).
  const wasSignedIn = useRef(false);
  useEffect(() => {
    if (status === "signedIn") wasSignedIn.current = true;
    if (status !== "signedOut") return;
    if (wasSignedIn.current) leaveToLogin();
    else router.replace("/login");
  }, [status, router]);

  // Local (still mocked) case data is per account: drop another account's on this browser.
  useEffect(() => {
    if (ready && user) claimFor(user.id);
  }, [ready, user, claimFor]);

  if (!ready || status !== "signedIn") return <div className="h-dvh" />;

  const overlays = (
    <>
      <PaymentModal />
      <LawyerRequestModal />
      <TourLayer />
      <Toaster />
    </>
  );

  const mobile = device === "mobile";

  // One tree for both: only the chrome around the page changes with the device, and the page's own
  // wrapper keeps its place, so turning a phone or resizing across 768px doesn't remount the route
  // (and lose what was typed, the open modals or the scroll position).
  return (
    <div className={mobile ? "flex h-dvh min-h-0 flex-col" : "flex h-dvh min-h-0"}>
      <LandingWatcher />
      {mobile ? <MobileTop name={user?.name || ""} /> : <Sidebar />}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {banner && <SuccessBanner message={banner} onDismiss={() => setBanner("")} />}
        {children}
      </div>
      {mobile ? <MobileBottom /> : null}
      {overlays}
    </div>
  );
}
