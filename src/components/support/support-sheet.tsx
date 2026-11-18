"use client";

import dynamic from "next/dynamic";
import { useSupport } from "@/lib/support/store";

// The chat is a lot of code (the assistant, the delete and export steps, the thread, the captcha)
// that most visits never open, so it is fetched the first time it is.
const SupportPanel = dynamic(() => import("./support-panel").then((m) => m.SupportPanel), { loading: () => null });

/** Opens the Support Chat while the store says so. Mounted only while open, like the guide, so every
 * opening starts a fresh conversation. */
export function SupportSheet() {
  return useSupport((s) => s.open) ? <SupportPanel /> : null;
}
