import { apiFetch, hasSessionHint, refreshAccessToken } from "@/lib/api/fetch";
import { useSession, type SessionUser } from "./session";

/** What every sign-in style endpoint returns. `deletionCancelled` is true when signing in
 * cancelled a scheduled account deletion (the API restores the account). */
export interface AuthResponse {
  user: SessionUser;
  accessToken: string;
  deletionCancelled?: boolean;
}

/** Trimmed + lowercased, matching the API's normalizeEmail, so what the UI echoes back (the OTP
 * screen) matches what's stored. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** The API requires a unique username at signup; the client never shows one. Same "name.1234"
 * shape ilovelawyer-app and the API's Google signup use. */
export function generateUsername(fullName: string): string {
  const base =
    fullName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s.]/g, "")
      .replace(/\s+/g, ".")
      .replace(/\.+/g, ".")
      .replace(/^\.|\.$/g, "") || "user";
  return `${base}.${Math.floor(1000 + Math.random() * 9000)}`;
}

function post<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body), skipAuthRefresh: true });
}

/** Creates an unverified account; no session yet. Follow with sendOtp + verifyOtp. */
export function signup(input: { name: string; email: string; password: string }) {
  return post<{ id: string; email: string; name: string | null }>("/api/auth/signup", {
    username: generateUsername(input.name),
    name: input.name.trim(),
    email: normalizeEmail(input.email),
    password: input.password,
    // Callers only sign up after the Terms dialog and checkbox (unified-auth.tsx).
    acceptedTerms: true,
  });
}

/** Always answers 200 (the API never reveals whether the email exists); ignored by the API within
 * its 30-second resend cooldown. */
export function sendOtp(email: string) {
  return post<{ message: string }>("/api/auth/send-otp", { email: normalizeEmail(email) });
}

export function verifyOtp(email: string, code: string) {
  return post<AuthResponse>("/api/auth/verify-otp", { email: normalizeEmail(email), code });
}

/** "Use a different email": deletes the unverified account the abandoned signup left behind. */
export function cancelSignup(email: string) {
  return post<{ message: string }>("/api/auth/cancel-signup", { email: normalizeEmail(email) });
}

export function login(input: { email: string; password: string; remember: boolean }) {
  return post<AuthResponse>("/api/auth/login", { ...input, email: normalizeEmail(input.email) });
}

export function forgotPassword(email: string) {
  return post<{ message: string }>("/api/auth/forgot-password", { email: normalizeEmail(email) });
}

export async function validateResetToken(token: string): Promise<boolean> {
  const { valid } = await apiFetch<{ valid: boolean }>(
    `/api/auth/reset-password/validate?token=${encodeURIComponent(token)}`,
    { skipAuthRefresh: true },
  );
  return valid;
}

/** Sets the new password and signs in; the API ends every other session of the account. */
export function resetPassword(token: string, password: string) {
  return post<{ accessToken: string; deletionCancelled?: boolean }>("/api/auth/reset-password", { token, password });
}

export function fetchMe() {
  return apiFetch<SessionUser>("/api/users/me");
}

let restoring: Promise<void> | null = null;

/** Runs once per page load: resumes the session from the refresh cookie (refresh → /users/me) when
 * the hasSession hint says one may exist, else settles straight to signed out without a request. */
export function restoreSession(): Promise<void> {
  if (useSession.getState().status !== "unknown") return Promise.resolve();
  restoring ??= (async () => {
    const session = useSession.getState();
    if (!hasSessionHint()) return session.clear();
    try {
      const accessToken = await refreshAccessToken();
      const user = await fetchMe();
      session.setSession(user, accessToken);
    } catch {
      session.clear();
    }
  })().finally(() => {
    restoring = null;
  });
  return restoring;
}

/** Goes to /login with a full page load instead of a client-side navigation. With cacheComponents,
 * Next keeps recently visited routes mounted but hidden (React <Activity>), state included: a
 * router navigation would bring back the old /login exactly as it was left (the OTP step, or the
 * typed email and password) and keep the signed-out account's /cases tree in memory. A fresh
 * document drops all of it. */
export function leaveToLogin(): void {
  window.location.replace("/login");
}

/** Ends this device's session on the API (clearing both cookies), then locally. A failed call
 * still signs out here: the refresh cookie expires on its own. */
export async function logout(): Promise<void> {
  try {
    await post("/api/auth/logout", {});
  } finally {
    useSession.getState().clear();
  }
}
