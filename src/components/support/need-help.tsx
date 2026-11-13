"use client";

import { useEffect } from "react";
import { useSupport } from "@/lib/support/store";
import { SupportSheet } from "./support-sheet";

/** "Need help?" in the footer of the sign-in screens: opens the Support Chat for someone who isn't
 * signed in (a shorter list of topics, and no account to look at). Closes the chat when the page
 * goes, so it never carries over into the app after signing in. */
export function NeedHelp() {
  useEffect(() => () => useSupport.getState().close(), []);
  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => useSupport.getState().openSupport({ audience: "SIGNED_OUT" })}
        className="inline-flex min-h-11 cursor-pointer items-center border-0 bg-transparent text-xs font-semibold uppercase tracking-[1.2px] text-muted underline decoration-line transition-colors hover:text-ink"
      >
        Need help?
      </button>
      <SupportSheet />
    </>
  );
}
