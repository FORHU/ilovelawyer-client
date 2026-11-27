import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { resetLanding } from "@/lib/landing";
import { useApp } from "@/lib/store";
import { useWizard } from "@/lib/wizard-store";
import {
  cancelSignup,
  deleteAccount,
  fetchMe,
  forgotPassword,
  googleLink,
  googleLogin,
  leaveToLogin,
  login,
  logout,
  resetPassword,
  restoreSession,
  sendOtp,
  signup,
  validateResetToken,
  verifyOtp,
  type AuthResponse,
} from "./api";
import { useSession } from "./session";
import { readSearchText } from "@/lib/marketing/search-prefill";
import { useSite } from "@/components/site/site-provider";
import { ONBOARDING_PRIVACY_PATH, SIGNED_IN_PATH, afterSignInPath } from "./after-sign-in";
import { listCases } from "@/lib/cases/api";

// TanStack Query hooks for every auth call. The request functions themselves live in ./api.ts;
// the signed-in session (token + account) lives in ./session.ts.

export { SIGNED_IN_PATH };

/** Where a sign-in lands: the cases, or the new-case chat when they arrived with a problem typed
 * into the landing page's search box. */
export function signedInPath() {
  return afterSignInPath({ isNewAccount: false, hasCases: null, storyIntake: false, searchText: readSearchText() });
}

/** Whether the account has a case, open or archived: one without goes on to make its first rather
 * than to an empty list. Null when it couldn't be checked (the sign-in isn't held up for it). */
async function hasAnyCase(): Promise<boolean | null> {
  try {
    if ((await listCases()).length) return true;
    return (await listCases(true)).length > 0;
  } catch {
    return null;
  }
}

export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
  resetToken: (token: string) => [...authKeys.all, "reset-token", token] as const,
};

/** A plain sign-in shows no banner: the app header already says "Welcome back". */
const NO_BANNER = "";
const DELETION_CANCELLED_BANNER = "Welcome back. Signing in cancelled your account deletion.";
const NEW_ACCOUNT_BANNER = "Welcome to ilovelawyer. Create your first case to get started.";
/** A returning client with no case, sent on to make one (where the site has no privacy step first). */
const FIRST_CASE_BANNER = "Welcome back. Create your first case to get started.";

/** Every successful sign-in path ends here: keep the session, make this browser's local data the
 * account's own, greet, and go to the cases, or, for an account made just now, on to its first
 * case (afterSignInPath). */
function useCompleteSignIn() {
  const router = useRouter();
  const storyIntake = useSite().storyIntake === "open";
  return async (data: AuthResponse, banner: string, { replace = false, isNewAccount = false } = {}) => {
    useSession.getState().setSession(data.user, data.accessToken);
    // The app store hydrates lazily (useHydrated); load it first so claimFor compares against
    // what this browser actually holds.
    await useApp.persist.rehydrate();
    useApp.getState().claimFor(data.user.id);
    // An account made just now has none; anyone else is checked, so a client who signed up and left
    // before their first case (or verified their email later, at Sign In) makes it now.
    const hasCases = isNewAccount ? false : await hasAnyCase();
    const path = afterSignInPath({ isNewAccount, hasCases, storyIntake, searchText: readSearchText() });
    // The onboarding says its own welcome; a banner would land on the first case's screen.
    useApp.getState().setBanner(path === ONBOARDING_PRIVACY_PATH ? NO_BANNER : hasCases === false && !isNewAccount ? FIRST_CASE_BANNER : banner);
    // Into the new-client flow, the sign-in page leaves the history: Back from the first case
    // mustn't land on a sign-up that's done.
    if (replace || path === ONBOARDING_PRIVACY_PATH) router.replace(path);
    else router.push(path);
  };
}

/** Resumes the session from the refresh cookie once per page load (see restoreSession), and
 * reports where it landed. Who is signed in is then read from useSession. */
export function useRestoreSessionQuery() {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: async () => {
      await restoreSession();
      return useSession.getState().status;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });
}

export function useLoginMutation() {
  const complete = useCompleteSignIn();
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => complete(data, data.deletionCancelled ? DELETION_CANCELLED_BANNER : NO_BANNER),
  });
}

export function useGoogleLoginMutation() {
  const complete = useCompleteSignIn();
  return useMutation({
    mutationFn: ({ idToken, remember }: { idToken: string; remember: boolean }) => googleLogin(idToken, remember),
    onSuccess: (data) => complete(data, data.deletionCancelled ? DELETION_CANCELLED_BANNER : NO_BANNER, { isNewAccount: data.isNewAccount === true }),
  });
}

/** The GOOGLE_LINK_REQUIRED follow-up: same completion as a Google sign-in once the existing
 * account's password confirms the link. */
export function useGoogleLinkMutation() {
  const complete = useCompleteSignIn();
  return useMutation({
    mutationFn: ({ idToken, password, remember }: { idToken: string; password: string; remember: boolean }) =>
      googleLink(idToken, password, remember),
    onSuccess: (data) => complete(data, NO_BANNER),
  });
}

/** Creates the unverified account; the caller then sends the code (useSendOtpMutation). */
export function useSignupMutation() {
  return useMutation({ mutationFn: signup });
}

export function useSendOtpMutation() {
  return useMutation({ mutationFn: (email: string) => sendOtp(email) });
}

/** `source` only picks the greeting: a new account's, or a returning one's (Sign In found the
 * email unverified). */
export function useVerifyOtpMutation() {
  const complete = useCompleteSignIn();
  return useMutation({
    mutationFn: ({ email, code }: { email: string; code: string; source: "signup" | "signin" }) => verifyOtp(email, code),
    onSuccess: (data, { source }) =>
      complete(data, source === "signup" ? NEW_ACCOUNT_BANNER : NO_BANNER, {
        isNewAccount: source === "signup",
      }),
  });
}

/** "Use a different email" on the code step. Fire and forget: the UI moves on either way. */
export function useCancelSignupMutation() {
  return useMutation({ mutationFn: (email: string) => cancelSignup(email) });
}

export function useForgotPasswordMutation() {
  return useMutation({ mutationFn: (email: string) => forgotPassword(email) });
}

/** Whether a reset link is still usable, checked before the person types a new password. */
export function useValidateResetTokenQuery(token: string) {
  return useQuery({
    queryKey: authKeys.resetToken(token),
    queryFn: () => validateResetToken(token),
    enabled: !!token,
    staleTime: Infinity,
  });
}

export function useResetPasswordMutation() {
  const complete = useCompleteSignIn();
  return useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }): Promise<AuthResponse> => {
      const { accessToken, deletionCancelled } = await resetPassword(token, password);
      // The reset signs in but answers with a token only: load the account it belongs to.
      useSession.getState().setAccessToken(accessToken);
      const user = await fetchMe();
      return { user, accessToken, deletionCancelled };
    },
    onSuccess: (data) =>
      complete(
        data,
        data.deletionCancelled
          ? "Your password is updated, and signing in cancelled your account deletion."
          : "Your password is updated. You're signed in.",
        // Not back to the reset page: its link is used up.
        { replace: true },
      ),
  });
}

/** Drops everything of the account this browser holds: its local data and every cached query. */
function clearAccountData(queryClient: QueryClient) {
  useApp.getState().signOut();
  useWizard.getState().claimFor("");
  resetLanding();
  queryClient.clear();
}

/** Ends the session on the API, clears the account's local data and every cached query, then
 * reloads into /login (see leaveToLogin). A failed call still signs out here. */
export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearAccountData(queryClient);
      leaveToLogin();
    },
  });
}

/** Where a deleted account lands: the sign-in page, saying so. */
export const DELETED_ACCOUNT_PATH = "/login?deleted=1";

/** Schedules the account for deletion. The API has already ended every session, so there is
 * nothing more to log out of: clear this browser and go to the sign-in page. */
export function useDeleteAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (password?: string) => deleteAccount(password),
    onSuccess: () => {
      useSession.getState().clear();
      clearAccountData(queryClient);
      leaveToLogin(DELETED_ACCOUNT_PATH);
    },
  });
}
