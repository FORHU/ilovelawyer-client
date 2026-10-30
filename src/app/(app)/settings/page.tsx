"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/misc";
import { useLogoutMutation } from "@/lib/auth/mutations";
import { cn } from "@/lib/cn";

// The Settings layout from the client UI/UX revisions. Only Account has content so far, and only
// what the API supports: signing out on this device. "Sign out everywhere" and "Close account"
// have no endpoints yet, so Close account is shown disabled.

const TABS = ["Profile", "Payment methods & billing", "AI use", "Terms & privacy", "Account"] as const;
type Tab = (typeof TABS)[number];

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

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("Account");
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-8 px-5 py-8 md:px-10">
        <header className="flex flex-col gap-2">
          <Eyebrow muted>Account</Eyebrow>
          <h1 className="font-display text-[34px] leading-tight">Settings</h1>
        </header>
        <div className="grid items-start gap-6 md:grid-cols-[240px_1fr]">
          <nav aria-label="Settings" className="flex gap-1 overflow-x-auto md:flex-col">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                aria-current={tab === t ? "page" : undefined}
                onClick={() => setTab(t)}
                className={cn(
                  "shrink-0 rounded-input px-4 py-3 text-left text-[14.5px] transition-colors",
                  tab === t ? "bg-chip font-semibold text-ink" : "text-ink-2 hover:text-ink",
                )}
              >
                {t}
              </button>
            ))}
          </nav>
          {tab === "Account" ? (
            <AccountTab />
          ) : (
            <div className="rounded-card border border-dashed border-line-input px-6 py-8 text-sm text-ink-2">{tab} settings are coming soon.</div>
          )}
        </div>
      </div>
    </div>
  );
}
