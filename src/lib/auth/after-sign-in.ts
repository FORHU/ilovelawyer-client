// Where a completed sign-in goes (used by lib/auth/mutations.ts). Pure, so it can be tested.

export const SIGNED_IN_PATH = "/cases";

/** The new-client flow's second step (app/(onboarding)/start/privacy), before the first story. It
 * goes straight on to the first case when the client has already agreed. */
export const ONBOARDING_PRIVACY_PATH = "/start/privacy";

/** Making the first case in the app: the chat or the form, on a site without the onboarding's story. */
export const FIRST_CASE_PATH = "/cases/new";

/** The onboarding's own first case, after the privacy step: the story, then its questions and
 * evidence (app/(onboarding)/start/case), apart from the app's New case. */
export const ONBOARDING_STORY_PATH = "/start/case";

/**
 * A client with no case yet never lands on an empty list: an account made (or verified) just now,
 * or one that signs in before making its first case, goes on to make one. On a site with the
 * story-first way in that's the privacy step and then the story; elsewhere the new-case screen. Any
 * other sign-in lands on the cases, or on a new case when a problem was typed into the landing
 * page's search box first.
 *
 * `hasCases` is null when it couldn't be checked: the sign-in then lands as a returning client's.
 */
export function afterSignInPath({
  isNewAccount,
  hasCases,
  storyIntake,
  searchText,
}: {
  isNewAccount: boolean;
  hasCases: boolean | null;
  storyIntake: boolean;
  searchText: string | null;
}) {
  const firstCase = isNewAccount || hasCases === false;
  if (firstCase && storyIntake) return ONBOARDING_PRIVACY_PATH;
  if (firstCase || searchText) return FIRST_CASE_PATH;
  return SIGNED_IN_PATH;
}
