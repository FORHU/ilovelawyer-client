"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/input";
import { ErrorBox } from "@/components/ui/banner";
import { useSite } from "@/components/site/site-provider";
import { useT } from "@/components/site/language-provider";
import {
  useCaseLawyerInviteQuery,
  useCreateEmailInviteMutation,
  useCreateLinkInviteMutation,
  useRevokeInviteMutation,
  type CaseLawyerInvite,
} from "@/lib/cases/lawyer-invites/api";

/** What the card shows, given the case's current invite (or none/not loaded). Pulled out as a pure
 * function so it can be unit-tested without the component-rendering harness this repo doesn't have
 * (see vitest.config.mts's top comment) — the component itself just calls this and renders the
 * matching branch. REVOKED/EXPIRED fold back into "offer": there's nothing live to show, and a
 * fresh invite supersedes it anyway. */
export type InviteCardState = { kind: "offer" } | { kind: "pending"; email: string | null } | { kind: "accepted" };

export function inviteCardState(invite: CaseLawyerInvite | null | undefined): InviteCardState {
  if (invite?.status === "PENDING") return { kind: "pending", email: invite.email };
  if (invite?.status === "ACCEPTED") return { kind: "accepted" };
  return { kind: "offer" };
}

/** The full lawyer-app signup URL a copy-link invite's token resolves to: the lawyer app's unified
 * /login page, on its signup tab, carrying the token it reads as `?caseInviteToken=` (see
 * ilovelawyer-app's unified-auth.tsx and post-auth-invite.ts). */
export function inviteSignupUrl(lawyerAppUrl: string, token: string): string {
  return `${lawyerAppUrl}/login?tab=signup&caseInviteToken=${encodeURIComponent(token)}`;
}

/** A client inviting their own, already-chosen lawyer onto this case — a copyable link or an
 * emailed one, either way good for one pending invite at a time. Sits next to GetLawyerCard, which
 * offers the opposite: finding a lawyer through the marketplace. */
export function InviteOwnLawyerCard({ caseId }: { caseId: string }) {
  const { data: invite, isLoading } = useCaseLawyerInviteQuery(caseId);
  const { lawyerAppUrl } = useSite();
  const t = useT();

  const createLink = useCreateLinkInviteMutation(caseId);
  const createEmail = useCreateEmailInviteMutation(caseId);
  const revoke = useRevokeInviteMutation(caseId);

  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);

  if (isLoading) return null;

  const state = inviteCardState(invite);

  const copyLink = async () => {
    setCopied(false);
    try {
      const created = await createLink.mutateAsync();
      await navigator.clipboard.writeText(inviteSignupUrl(lawyerAppUrl, created.token));
      setCopied(true);
    } catch {
      // createLink.isError now reflects it; nothing else to do here.
    }
  };

  const sendEmail = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    try {
      // createEmailInvite only returns { token, expiresAt } — never a renderable status — so the
      // resulting "Invited <email>" pending state comes from useCaseLawyerInviteQuery's refetch
      // (invalidated by this mutation's onSettled), not from this call's own response.
      await createEmail.mutateAsync(trimmed);
      setEmail("");
    } catch {
      // createEmail.isError now reflects it.
    }
  };

  return (
    <section className="flex flex-col gap-2.5 rounded-card border border-line bg-surface px-5 py-[18px]">
      <h3 className="font-display text-[19px]">{t("Invite your own lawyer")}</h3>

      {state.kind === "offer" && (
        <>
          <p className="text-[13px] text-ink-2">{t("Already have a lawyer? Invite them to this case.")}</p>
          <Button variant="soft" size="md" className="self-start" disabled={createLink.isPending} onClick={copyLink}>
            {copied ? t("Copied!") : t("Copy invite link")}
          </Button>
          {createLink.isError && <ErrorBox message={t("Couldn't create the invite link. Try again.")} />}

          <form onSubmit={sendEmail} className="flex items-end gap-2">
            <TextInput
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t("Lawyer's email")}
              aria-label={t("Lawyer's email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 text-[13px]"
            />
            <Button variant="soft" size="sm" type="submit" disabled={createEmail.isPending || !email.trim()}>
              {t("Send invite")}
            </Button>
          </form>
          {createEmail.isError && <ErrorBox message={t("Couldn't send the invite. Try again.")} />}
        </>
      )}

      {state.kind === "pending" && (
        <>
          <p className="text-[13px] text-ink-2">
            {state.email ? t("Invited {email}", { email: state.email }) : t("Anyone with the link can join as your lawyer.")}
          </p>
          <Button variant="outline" size="md" className="self-start" disabled={revoke.isPending} onClick={() => revoke.mutate()}>
            {t("Revoke")}
          </Button>
          {revoke.isError && <ErrorBox message={t("Couldn't revoke the invite. Try again.")} />}
        </>
      )}

      {state.kind === "accepted" && <p className="text-[13px] text-ink-2">{t("Your lawyer has joined this case.")}</p>}
    </section>
  );
}
