import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import {
  cancelSignup,
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

// TanStack Query hooks for every auth call. The request functions themselves live in ./api.ts;
// the signed-in session (token + account) lives in ./session.ts.

export const SIGNED_IN_PATH = "/cases";

export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
  resetToken: (token: string) => [...authKeys.all, "reset-token", token] as const,
};

export function welcomeBack(name: string | null): string {
  const first = name?.trim().split(" ")[0];
  return first ? `Welcome back, ${first}.` : "Welcome back.";
}

const DELETION_CANCELLED_BANNER = "Welcome back. Signing in cancelled your account deletion.";

/** Every successful sign-in path ends here: keep the session, make this browser's local data the
 * account's own, greet, and go to the cases. */
function useCompleteSignIn() {
  const router = useRouter();
  return async (data: AuthResponse, banner: string, { replace = false } = {}) => {
    useSession.getState().setSession(data.user, data.accessToken);
    // The app store hydrates lazily (useHydrated); load it first so claimFor compares against
    // what this browser actually holds.
    await useApp.persist.rehydrate();
    useApp.getState().claimFor(data.user.id);
    useApp.getState().setBanner(banner);
    if (replace) router.replace(SIGNED_IN_PATH);
    else router.push(SIGNED_IN_PATH);
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
    onSuccess: (data) => complete(data, data.deletionCancelled ? DELETION_CANCELLED_BANNER : welcomeBack(data.user.name)),
  });
}

export function useGoogleLoginMutation() {
  const complete = useCompleteSignIn();
  return useMutation({
    mutationFn: ({ idToken, remember }: { idToken: string; remember: boolean }) => googleLogin(idToken, remember),
    onSuccess: (data) => complete(data, data.deletionCancelled ? DELETION_CANCELLED_BANNER : welcomeBack(data.user.name)),
  });
}

/** The GOOGLE_LINK_REQUIRED follow-up: same completion as a Google sign-in once the existing
 * account's password confirms the link. */
export function useGoogleLinkMutation() {
  const complete = useCompleteSignIn();
  return useMutation({
    mutationFn: ({ idToken, password, remember }: { idToken: string; password: string; remember: boolean }) =>
      googleLink(idToken, password, remember),
    onSuccess: (data) => complete(data, welcomeBack(data.user.name)),
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
      complete(
        data,
        source === "signup" ? "Welcome to ilovelawyer. Create your first case to get started." : welcomeBack(data.user.name),
      ),
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

/** Ends the session on the API, clears the account's local data and every cached query, then
 * reloads into /login (see leaveToLogin). A failed call still signs out here. */
export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      useApp.getState().signOut();
      queryClient.clear();
      leaveToLogin();
    },
  });
}
