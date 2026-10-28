"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PaymentModal } from "@/components/payment/payment-modal";
import { LawyerRequestModal } from "@/components/case/lawyer-request-modal";
import { SignOutButton } from "@/components/shell/sign-out-button";
import { SuccessBanner } from "@/components/ui/banner";
import { Avatar, Logo, initialsOf } from "@/components/ui/misc";
import { leaveToLogin } from "@/lib/auth/api";
import { useRestoreSessionQuery } from "@/lib/auth/mutations";
import { useSession } from "@/lib/auth/session";
import { useChatSocket } from "@/lib/cases/chat-socket";
import { useLawyerRequestSocket } from "@/lib/lawyer-requests/socket";
import { useAppSocket } from "@/lib/socket";
import { useApp } from "@/lib/store";
import { useHydrated } from "@/lib/use-hydrated";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
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

  return (
    <div className="flex h-dvh min-h-0">
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Phone top bar */}
        <div className="flex min-h-[52px] shrink-0 items-center justify-between border-b border-line px-4 py-2 md:hidden">
          <Logo height={20} />
          <div className="flex items-center gap-2">
            <SignOutButton compact />
            <Avatar initials={initialsOf(user?.name || "You")} size={36} />
          </div>
        </div>
        {banner && <SuccessBanner message={banner} onDismiss={() => setBanner("")} />}
        {children}
      </div>
      <PaymentModal />
      <LawyerRequestModal />
    </div>
  );
}
