"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useLogoutMutation } from "@/lib/auth/mutations";
import { cn } from "@/lib/cn";
import { useT } from "@/components/site/language-provider";

/** Asks for confirmation, then ends this device's session and clears the account's local data.
 * `compact`: icon only. */
export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const logoutMutation = useLogoutMutation();
  const [confirming, setConfirming] = useState(false);
  const pending = logoutMutation.isPending;
  const t = useT();

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={pending}
        aria-label={t("Sign out")}
        title={t("Sign out")}
        data-no-tap
        className={cn(
          "flex shrink-0 items-center justify-center gap-1.5 rounded-[10px] text-ink-2 hover:bg-chip disabled:opacity-50",
          compact ? "size-11" : "h-[30px] px-2 text-[12px]",
        )}
      >
        <LogOut size={compact ? 16 : 14} aria-hidden />
        {!compact && t("Sign out")}
      </button>

      {/* Portalled: the sidebar that holds one of these buttons is display:none on phones and
          clips its content, which would hide a modal rendered inside it. */}
      {confirming &&
        createPortal(
          <Modal
            open
            onClose={() => setConfirming(false)}
            locked={pending}
            title={t("Sign out?")}
            subtitle={t("You'll need to sign in again to see your cases on this device.")}
          >
            <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
              <Button variant="outline" size="lg" onClick={() => setConfirming(false)} disabled={pending}>
                {t("Cancel")}
              </Button>
              <Button size="lg" onClick={() => logoutMutation.mutate()} disabled={pending}>
                {pending ? t("Signing out…") : t("Sign out")}
              </Button>
            </div>
          </Modal>,
          document.body,
        )}
    </>
  );
}
