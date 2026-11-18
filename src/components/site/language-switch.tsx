"use client";

import { useRouter } from "next/navigation";
import { LANG_LABELS } from "@/lib/i18n/translate";
import { setLanguage, useLanguage } from "./language-provider";

/** Switches to the site's other language (KR: 한국어 ⇄ English), named in that language. Nothing on a
 * site with only one. The page is drawn again on the server, which reads the new choice. */
export function LanguageSwitch({ className }: { className?: string }) {
  const { lang, offered } = useLanguage();
  const router = useRouter();
  if (offered.length < 2) return null;
  const other = offered.find((l) => l !== lang) ?? offered[0];
  return (
    <button
      type="button"
      lang={other}
      onClick={() => {
        setLanguage(other);
        router.refresh();
      }}
      className={className ?? "whitespace-nowrap px-2 py-2.5 text-[14px] underline-offset-4 hover:underline"}
    >
      {LANG_LABELS[other]}
    </button>
  );
}
