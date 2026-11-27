import { describe, expect, it } from "vitest";
import { inviteCardState, inviteSignupUrl } from "../invite-own-lawyer-card";
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

describe("inviteCardState", () => {
  it("is 'pending' with the email when PENDING and addressed to one", () => {
    const invite: CaseLawyerInvite = { status: "PENDING", email: "lawyer@x.com", expiresAt: "2026-12-03T00:00:00Z", acceptedAt: null, revokedAt: null };

    expect(inviteCardState(invite)).toEqual({ kind: "pending", email: "lawyer@x.com" });
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
