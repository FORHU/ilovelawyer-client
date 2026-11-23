"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { ConnectGmailButton } from "@/components/gmail/connect-gmail-button";
import { useLogoutMutation } from "@/lib/auth/mutations";
import { useSession } from "@/lib/auth/session";
import { useDisconnectGmailMutation } from "@/lib/gmail/queries";
import { setLanguage, useLanguage, useT } from "@/components/site/language-provider";
import { RadioCard } from "@/components/ui/radio-card";
import { LANG_LABELS } from "@/lib/i18n/translate";
import { msg } from "@/lib/i18n/msg";
import { THEME_CHOICES, useTheme, useThemeChoice } from "@/lib/theme";
import { DELETE_ACCOUNT_FLOW_ID } from "@/lib/support/deletion-flow";
import { useSupport } from "@/lib/support/store";

// The Settings layout from the client UI/UX revisions. Account and Connected accounts have content
// so far: signing out on this device, Gmail for email import, and closing the account, which is done
// in the Support Chat (it explains what is lost, checks for open lawyer requests, and asks for the
// password). "Sign out everywhere" has no endpoint yet.

/** The categories, each with the slug that names it in the URL (`/settings?section=account`). */
export const SECTIONS = [
  { slug: "profile", label: msg("Profile") },
  { slug: "billing", label: msg("Payment methods & billing") },
  { slug: "ai-use", label: msg("AI use") },
  { slug: "connected-accounts", label: msg("Connected accounts") },
  { slug: "language", label: msg("Language") },
  { slug: "appearance", label: msg("Appearance") },
  { slug: "terms", label: msg("Terms & privacy") },
  { slug: "account", label: msg("Account") },
] as const;
export type Section = (typeof SECTIONS)[number];

/** The categories this site shows: Language only where there's a choice of one (KR). */
export function useSections(): Section[] {
  const { offered } = useLanguage();
  return SECTIONS.filter((s) => s.slug !== "language" || offered.length > 1);
}

/** The site's languages (lib/i18n/language.ts), each named in itself. The choice is kept in a cookie
 * for this site, so the next visit opens in it too. */
function LanguageTab() {
  const { lang, offered, t } = useLanguage();
  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-surface px-6 py-5">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-[15px] font-semibold">{t("Language")}</h2>
        <p className="text-sm text-ink-2">{t("The language ilovelawyer shows on this device.")}</p>
      </div>
      <div className="flex flex-col gap-2" role="radiogroup" aria-label={t("Language")}>
        {offered.map((l) => (
          <RadioCard key={l} compact selected={lang === l} onSelect={() => setLanguage(l)} title={LANG_LABELS[l]} />
        ))}
      </div>
    </section>
  );
}

/** Light, dark, or whatever the device uses (lib/theme.ts). Kept on this device, like the header's
 * toggle, which sets the same choice. */
function AppearanceTab() {
  const setChoice = useTheme((s) => s.setChoice);
  const choice = useThemeChoice();
  const t = useT();
  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-surface px-6 py-5">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-[15px] font-semibold">{t("Appearance")}</h2>
        <p className="text-sm text-ink-2">{t("How ilovelawyer looks on this device.")}</p>
      </div>
      <div className="flex flex-col gap-2" role="radiogroup" aria-label={t("Appearance")}>
        {THEME_CHOICES.map(({ value, label }) => (
          <RadioCard key={value} compact selected={choice === value} onSelect={() => setChoice(value)} title={t(label)} />
        ))}
      </div>
    </section>
  );
}

/** The category a `section` query value names, or undefined for none or a stale link. */
export function sectionOf(slug: string | null): Section | undefined {
  return SECTIONS.find((s) => s.slug === slug);
}

function AccountTab() {
  const logout = useLogoutMutation();
  const t = useT();
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface px-6 py-5">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-[15px] font-semibold">{t("Sign out")}</h2>
          <p className="text-sm text-ink-2">{t("Ends your session on this device.")}</p>
        </div>
        <Button variant="soft" size="md" disabled={logout.isPending} onClick={() => logout.mutate()}>
          {logout.isPending ? t("Signing out…") : t("Sign out")}
        </Button>
      </section>
      <section className="flex flex-col items-start gap-3 rounded-card border border-error-line bg-surface px-6 py-5">
        <h2 className="text-[15px] font-semibold text-error-ink">{t("Close your account")}</h2>
        <p className="text-sm leading-[1.6] text-ink-2">
          {t("Deletes your cases, documents and AI history after 30 days. Signing in again before then cancels it. Open lawyer requests must be withdrawn or ended first, and unused chat credits aren’t refunded.")}
        </p>
        <Button
          variant="danger"
          size="md"
          onClick={() => useSupport.getState().openSupport({ audience: "SIGNED_IN", startFlowId: DELETE_ACCOUNT_FLOW_ID })}
        >
          {t("Close account…")}
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
  const t = useT();

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-4 rounded-card border border-line bg-surface px-6 py-5">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-[15px] font-semibold">Gmail</h2>
          <p className="text-sm leading-[1.6] text-ink-2">
            {connected
              ? t("Connected as {email}. You can search it from a case’s Documents tab.", { email: gmailEmail ?? t("your Gmail account") })
              : t("Find emails and attachments for your case without forwarding them.")}
          </p>
        </div>
        {!connected ? (
          <ConnectGmailButton />
        ) : confirming ? (
          <div className="flex flex-col gap-3 rounded-input border border-line bg-subtle px-4 py-3.5">
            <p className="text-sm text-ink">
              {t("Disconnect Gmail? This ends our access and withdraws your consent to read your Gmail. You can connect again at any time. Anything already added to a case stays there.")}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="danger"
                size="sm"
                disabled={disconnect.isPending}
                onClick={() => disconnect.mutate(undefined, { onSuccess: () => setConfirming(false) })}
              >
                {disconnect.isPending ? t("Disconnecting…") : t("Disconnect")}
              </Button>
              <Button variant="soft" size="sm" disabled={disconnect.isPending} onClick={() => setConfirming(false)}>
                {t("Keep connected")}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="soft" size="md" className="self-start" onClick={() => setConfirming(true)}>
            {t("Disconnect Gmail")}
          </Button>
        )}
        {disconnect.error && <ErrorBox message={(disconnect.error as Error).message} />}
      </section>
    </div>
  );
}

/** What the chosen category shows, the same on a phone and a desktop. */
export function SettingsContent({ section }: { section: Section }) {
  const t = useT();
  if (section.slug === "account") return <AccountTab />;
  if (section.slug === "connected-accounts") return <ConnectedAccountsTab />;
  if (section.slug === "language") return <LanguageTab />;
  if (section.slug === "appearance") return <AppearanceTab />;
  return (
    <div className="rounded-card border border-dashed border-line-input px-6 py-8 text-sm text-ink-2">
      {t("{section} settings are coming soon.", { section: t(section.label) })}
    </div>
  );
}
