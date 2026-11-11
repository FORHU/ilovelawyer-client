"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { ConnectGmailButton } from "@/components/gmail/connect-gmail-button";
import { useLogoutMutation } from "@/lib/auth/mutations";
import { useSession } from "@/lib/auth/session";
import { useDisconnectGmailMutation } from "@/lib/gmail/queries";

// The Settings layout from the client UI/UX revisions. Account and Connected accounts have content
// so far, and only what the API supports: signing out on this device, and Gmail for email import. "Sign out everywhere" and "Close account"
// have no endpoints yet, so Close account is shown disabled.

/** The categories, each with the slug that names it in the URL (`/settings?section=account`). */
export const SECTIONS = [
  { slug: "profile", label: "Profile" },
  { slug: "billing", label: "Payment methods & billing" },
  { slug: "ai-use", label: "AI use" },
  { slug: "connected-accounts", label: "Connected accounts" },
  { slug: "terms", label: "Terms & privacy" },
  { slug: "account", label: "Account" },
] as const;
export type Section = (typeof SECTIONS)[number];

/** The category a `section` query value names, or undefined for none or a stale link. */
export function sectionOf(slug: string | null): Section | undefined {
  return SECTIONS.find((s) => s.slug === slug);
}

function AccountTab() {
  const logout = useLogoutMutation();
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-white px-6 py-5">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-[15px] font-semibold">Sign out</h2>
          <p className="text-sm text-ink-2">Ends your session on this device.</p>
        </div>
        <Button variant="soft" size="md" disabled={logout.isPending} onClick={() => logout.mutate()}>
          {logout.isPending ? "Signing out…" : "Sign out"}
        </Button>
      </section>
      <section className="flex flex-col items-start gap-3 rounded-card border border-error-line bg-white px-6 py-5">
        <h2 className="text-[15px] font-semibold text-error-ink">Close your account</h2>
        <p className="text-sm leading-[1.6] text-ink-2">
          Deletes your cases, documents and AI history after 30 days. Open lawyer requests are withdrawn, and unused chat credits aren’t refunded.
        </p>
        <Button variant="danger" size="md" disabled title="Not available yet">
          Close account…
        </Button>
      </section>
    </div>
  );
}

/** Gmail for email import (EPIC #982): connect, see which inbox, disconnect. Disconnecting
 * revokes our access at Google; documents already added to a case stay there. */
function ConnectedAccountsTab() {
  const connected = useSession((s) => !!s.user?.gmailConnected);
  const gmailEmail = useSession((s) => s.user?.gmailEmail);
  const disconnect = useDisconnectGmailMutation();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-4 rounded-card border border-line bg-white px-6 py-5">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-[15px] font-semibold">Gmail</h2>
          <p className="text-sm leading-[1.6] text-ink-2">
            {connected
              ? `Connected as ${gmailEmail ?? "your Gmail account"}. You can search it from a case’s Documents tab.`
              : "Find emails and attachments for your case without forwarding them."}
          </p>
        </div>
        {!connected ? (
          <ConnectGmailButton />
        ) : confirming ? (
          <div className="flex flex-col gap-3 rounded-input border border-line bg-subtle px-4 py-3.5">
            <p className="text-sm text-ink">
              Disconnect Gmail? This ends our access and withdraws your consent to read your Gmail. You can connect again at any time. Anything already
              added to a case stays there.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="danger"
                size="sm"
                disabled={disconnect.isPending}
                onClick={() => disconnect.mutate(undefined, { onSuccess: () => setConfirming(false) })}
              >
                {disconnect.isPending ? "Disconnecting…" : "Disconnect"}
              </Button>
              <Button variant="soft" size="sm" disabled={disconnect.isPending} onClick={() => setConfirming(false)}>
                Keep connected
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="soft" size="md" className="self-start" onClick={() => setConfirming(true)}>
            Disconnect Gmail
          </Button>
        )}
        {disconnect.error && <ErrorBox message={(disconnect.error as Error).message} />}
      </section>
    </div>
  );
}

/** What the chosen category shows, the same on a phone and a desktop. */
export function SettingsContent({ section }: { section: Section }) {
  if (section.slug === "account") return <AccountTab />;
  if (section.slug === "connected-accounts") return <ConnectedAccountsTab />;
  return <div className="rounded-card border border-dashed border-line-input px-6 py-8 text-sm text-ink-2">{section.label} settings are coming soon.</div>;
}
