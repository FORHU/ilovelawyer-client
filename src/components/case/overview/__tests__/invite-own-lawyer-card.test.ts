import { describe, expect, it } from "vitest";
import { inviteCardState, inviteSignupUrl, showLinkCopyFallback } from "../invite-own-lawyer-card";
import type { CaseLawyerInvite } from "@/lib/cases/lawyer-invites/api";

// invite-own-lawyer-card.tsx renders the component itself, which this repo has no rendering
// harness for (see vitest.config.mts's top comment — unit tests only, no jsdom/testing-library).
// Its branch logic is pulled out as inviteCardState/inviteSignupUrl precisely so the behavior the
// UI depends on — which state wins, what the signup URL carries — is still exercised here, the
// same way ilovelawyer-app's post-auth-invite.ts separates its decisions from unified-auth.tsx.

describe("inviteSignupUrl", () => {
  it("builds a lawyer-app signup URL containing the token", () => {
    const url = inviteSignupUrl("https://uk.ilovelawyer.com", "tok-abc123");

    expect(url).toContain("tok-abc123");
    expect(url.startsWith("https://uk.ilovelawyer.com/login")).toBe(true);
  });

  it("encodes a token that needs it", () => {
    const url = inviteSignupUrl("https://uk.ilovelawyer.com", "tok with space");

    expect(url).toContain(encodeURIComponent("tok with space"));
    expect(url).not.toContain("tok with space");
  });
});

const NOW = new Date("2026-11-27T12:00:00Z");

describe("inviteCardState", () => {
  it("is 'pending' with the email when PENDING and addressed to one", () => {
    const invite: CaseLawyerInvite = { status: "PENDING", email: "lawyer@x.com", expiresAt: "2026-12-03T00:00:00Z", acceptedAt: null, revokedAt: null };

    expect(inviteCardState(invite)).toEqual({ kind: "pending", email: "lawyer@x.com" });
  });

  it("is 'offer' for a PENDING invite whose expiresAt has already passed — nobody ever opened it", () => {
    const invite: CaseLawyerInvite = { status: "PENDING", email: "lawyer@x.com", expiresAt: "2026-11-20T00:00:00Z", acceptedAt: null, revokedAt: null };

    expect(inviteCardState(invite, NOW)).toEqual({ kind: "offer" });
  });

  it("is 'pending' with a null email for a bare link invite", () => {
    const invite: CaseLawyerInvite = { status: "PENDING", email: null, expiresAt: "2026-12-03T00:00:00Z", acceptedAt: null, revokedAt: null };

    expect(inviteCardState(invite)).toEqual({ kind: "pending", email: null });
  });

  it("is 'accepted' when the invite was accepted — no revoke action applies to it", () => {
    const invite: CaseLawyerInvite = { status: "ACCEPTED", email: "lawyer@x.com", expiresAt: "2026-12-03T00:00:00Z", acceptedAt: "2026-12-01T00:00:00Z", revokedAt: null };

    expect(inviteCardState(invite)).toEqual({ kind: "accepted" });
    expect(inviteCardState(invite).kind).not.toBe("pending");
  });

  it("is 'offer' when there's no invite at all", () => {
    expect(inviteCardState(null)).toEqual({ kind: "offer" });
    expect(inviteCardState(undefined)).toEqual({ kind: "offer" });
  });

  it("is 'offer' for a REVOKED or EXPIRED invite — nothing live to show, actions reappear", () => {
    const revoked: CaseLawyerInvite = { status: "REVOKED", email: null, expiresAt: "2026-12-03T00:00:00Z", acceptedAt: null, revokedAt: "2026-12-01T00:00:00Z" };
    const expired: CaseLawyerInvite = { status: "EXPIRED", email: null, expiresAt: "2026-12-03T00:00:00Z", acceptedAt: null, revokedAt: null };

    expect(inviteCardState(revoked)).toEqual({ kind: "offer" });
    expect(inviteCardState(expired)).toEqual({ kind: "offer" });
  });
});

describe("showLinkCopyFallback", () => {
  // Copy-link's createLinkInvite mutation hands back a token the GET endpoint never repeats, and
  // on Safari/iOS a clipboard write issued after that network await loses the user-gesture
  // permission and silently fails. So the card keeps the just-created URL in local state and
  // shows a read-only field + explicit "Copy" button the user can click again — this is the pure
  // decision of when that fallback should be on screen, given the invite it was created for.

  it("shows once a link invite exists and the card is in the 'offer' state (right after creation)", () => {
    expect(showLinkCopyFallback({ url: "https://x/login?tab=signup&caseInviteToken=t", copyFailed: true }, { kind: "offer" })).toBe(true);
  });

  it("keeps showing once the refetch flips the card to 'pending' with no email (a bare link invite)", () => {
    expect(showLinkCopyFallback({ url: "https://x", copyFailed: false }, { kind: "pending", email: null })).toBe(true);
  });

  it("hides once the invite is addressed to an email — that's a different invite, not this link", () => {
    expect(showLinkCopyFallback({ url: "https://x", copyFailed: false }, { kind: "pending", email: "lawyer@x.com" })).toBe(false);
  });

  it("hides once the invite has been accepted", () => {
    expect(showLinkCopyFallback({ url: "https://x", copyFailed: false }, { kind: "accepted" })).toBe(false);
  });

  it("hides when there's no link invite to show at all", () => {
    expect(showLinkCopyFallback(null, { kind: "offer" })).toBe(false);
  });
});
