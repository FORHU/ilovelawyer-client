import { ApiError } from "@/lib/api/fetch";
import type { T } from "@/lib/i18n/translate";
import { msg } from "@/lib/i18n/msg";

/** The API's machine-readable refusal codes the auth screens act on. */
export const WRONG_APP = "WRONG_APP";
export const EMAIL_REGISTERED_AS_LAWYER = "EMAIL_REGISTERED_AS_LAWYER";
/** The account was opened on another site (uk-client / ph-client / kr-client); the API says which,
 * and where that site is (`siteUrl`, null when it has none configured). */
export const WRONG_SITE = "WRONG_SITE";

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

/** True when the account belongs to the lawyer app, so the screen should point there. */
export function isLawyerAccountError(err: unknown): boolean {
  return isApiError(err) && (err.code === WRONG_APP || err.code === EMAIL_REGISTERED_AS_LAWYER);
}

/** For WRONG_SITE: the client app on the account's own site, so the screen can send them there. */
export function wrongSiteUrl(err: unknown): string | null {
  if (!isApiError(err) || err.code !== WRONG_SITE) return null;
  const url = err.body?.siteUrl;
  return typeof url === "string" && /^https?:\/\//.test(url) ? url : null;
}

type AuthStep = "signin" | "signup" | "otp" | "recover" | "reset";

/** The API's coded refusals, in the page's language. The API writes its messages in English; these
 * say the same thing, so a Korean screen doesn't show an English sentence. */
const CODED: Record<string, string> = {
  [WRONG_APP]: msg("This is a lawyer account. Sign in from the ilovelawyer lawyer app."),
  [EMAIL_REGISTERED_AS_LAWYER]: msg("This email is registered as a lawyer account. Use another email, or sign in from the lawyer app."),
  [WRONG_SITE]: msg("This account is on another ilovelawyer site. Sign in there instead."),
};

/** What to tell the person when an auth call fails, in `t`'s language. The API's own message is used
 * where it is already written for people (e.g. OTP attempts) and there's no translation of it; the
 * rest get plainer wording. */
export function authErrorMessage(err: unknown, step: AuthStep, t: T): string {
  if (!isApiError(err)) return t("Something went wrong. Try again.");
  if (err.status === 0) return t("Couldn't reach ilovelawyer. Check your connection and try again.");
  if (err.status >= 500) return t("Something went wrong on our side. Try again in a moment.");
  if (err.code && err.code in CODED) return t(CODED[err.code]);
  if (err.code) return err.message;

  switch (step) {
    case "signin":
      if (err.status === 401) return t("Email or password is incorrect.");
      if (err.status === 428) return t("Your password needs to be updated. Use Recover to set a new one.");
      return err.message;
    case "signup":
      // The username is generated (generateUsername), so a clash is ours to retry, not theirs to fix.
      if (err.status === 409 && /username/i.test(err.message)) return t("That didn't go through. Try again.");
      if (err.status === 409 && /email/i.test(err.message)) {
        return t("An account with this email already exists. Sign in, or use Recover if you forgot the password.");
      }
      return err.message;
    case "reset":
      if (err.status === 400) return t("This link has expired or was already used. Request a new one.");
      return err.message;
    default:
      return err.message;
  }
}
