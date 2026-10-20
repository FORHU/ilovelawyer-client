"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useLogoutMutation } from "@/lib/auth/mutations";
import { cn } from "@/lib/cn";

/** Asks for confirmation, then ends this device's session and clears the account's local data.
 * `compact`: icon only. */
export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const logoutMutation = useLogoutMutation();
  const [confirming, setConfirming] = useState(false);
  const pending = logoutMutation.isPending;

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={pending}
        aria-label="Sign out"
        title="Sign out"
        data-no-tap
        className={cn(
          "flex shrink-0 items-center justify-center gap-1.5 rounded-[10px] text-ink-2 hover:bg-chip disabled:opacity-50",
          compact ? "size-[34px]" : "h-[30px] px-2 text-[12px]",
        )}
      >
        <LogOut size={compact ? 16 : 14} aria-hidden />
        {!compact && "Sign out"}
      </button>

      {/* Portalled: the sidebar that holds one of these buttons is display:none on phones and
          clips its content, which would hide a modal rendered inside it. */}
      {confirming &&
        createPortal(
          <Modal
            open
            onClose={() => setConfirming(false)}
            locked={pending}
            title="Sign out?"
            subtitle="You'll need to sign in again to see your cases on this device."
          >
            <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
              <Button variant="outline" size="lg" onClick={() => setConfirming(false)} disabled={pending}>
                Cancel
              </Button>
              <Button size="lg" onClick={() => logoutMutation.mutate()} disabled={pending}>
                {pending ? "Signing out…" : "Sign out"}
              </Button>
            </div>
          </Modal>,
          document.body,
        )}
    </>
  );
}
