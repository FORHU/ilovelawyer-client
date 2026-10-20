"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PaymentModal } from "@/components/payment/payment-modal";
import { SuccessBanner } from "@/components/ui/banner";
import { Avatar, Logo, initialsOf } from "@/components/ui/misc";
import { useApp } from "@/lib/store";
import { useHydrated } from "@/lib/use-hydrated";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const ready = useHydrated();
  const { signedIn, fullName, banner, setBanner } = useApp();

  useEffect(() => {
    if (ready && !signedIn) router.replace("/login");
  }, [ready, signedIn, router]);

  if (!ready || !signedIn) return <div className="h-dvh" />;

  return (
    <div className="flex h-dvh min-h-0">
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Phone top bar */}
        <div className="flex min-h-[52px] shrink-0 items-center justify-between border-b border-line px-4 py-2 md:hidden">
          <Logo height={20} />
          <Avatar initials={initialsOf(fullName || "You")} size={36} />
        </div>
        {banner && <SuccessBanner message={banner} onDismiss={() => setBanner("")} />}
        {children}
      </div>
      <PaymentModal />
    </div>
  );
}
