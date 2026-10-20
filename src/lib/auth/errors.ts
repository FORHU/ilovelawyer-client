import { ApiError } from "@/lib/api/fetch";

/** The API's machine-readable refusal codes the auth screens act on. */
export const WRONG_APP = "WRONG_APP";
export const EMAIL_REGISTERED_AS_LAWYER = "EMAIL_REGISTERED_AS_LAWYER";

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

/** True when the account belongs to the lawyer app, so the screen should point there. */
export function isLawyerAccountError(err: unknown): boolean {
  return isApiError(err) && (err.code === WRONG_APP || err.code === EMAIL_REGISTERED_AS_LAWYER);
}

type AuthStep = "signin" | "signup" | "otp" | "recover" | "reset";

/** What to tell the person when an auth call fails. The API's own message is used where it is
 * already written for people (e.g. WRONG_APP, OTP attempts); the rest get plainer wording. */
export function authErrorMessage(err: unknown, step: AuthStep): string {
  if (!isApiError(err)) return "Something went wrong. Try again.";
  if (err.status === 0 || err.status >= 500) return err.message;
  if (err.code) return err.message;

  switch (step) {
    case "signin":
      if (err.status === 401) return "Email or password is incorrect.";
      if (err.status === 428) return "Your password needs to be updated. Use Recover to set a new one.";
      return err.message;
    case "signup":
      // The username is generated (generateUsername), so a clash is ours to retry, not theirs to fix.
      if (err.status === 409 && /username/i.test(err.message)) return "That didn't go through. Try again.";
      if (err.status === 409 && /email/i.test(err.message)) {
        return "An account with this email already exists. Sign in, or use Recover if you forgot the password.";
      }
      return err.message;
    case "reset":
      if (err.status === 400) return "This link has expired or was already used. Request a new one.";
      return err.message;
    default:
      return err.message;
  }
}
