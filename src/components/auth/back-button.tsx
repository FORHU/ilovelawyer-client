"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useApp } from "@/lib/store";

/** Back arrow (44px target) on every onboarding step except Welcome. */
export function AuthBackButton() {
  const pathname = usePathname();
  const router = useRouter();
  const method = useApp((s) => s.authMethod);

  const back: Record<string, string> = {
    "/auth/email": "/auth",
    "/auth/phone": "/auth",
    "/auth/signin": "/auth",
    "/auth/otp": method === "phone" ? "/auth/phone" : "/auth/email",
    "/auth/profile": method === "social" ? "/auth" : "/auth/otp",
    "/auth/consent": "/auth/profile",
  };
  const target = back[pathname];

  return (
    <div className="flex min-h-11 items-center">
      {target && (
        <button
          type="button"
          aria-label="Back"
          onClick={() => router.push(target)}
          className="-ml-3 flex size-11 items-center justify-center text-ink"
        >
          <ArrowLeft size={18} />
        </button>
      )}
    </div>
  );
}
