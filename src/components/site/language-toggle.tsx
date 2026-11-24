"use client";

import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { cn } from "@/lib/cn";
import { LANG_LABELS } from "@/lib/i18n/translate";
import { setLanguage, useLanguage } from "./language-provider";
import { SEGMENTED_TONES, type SegmentedTone } from "./segmented-tones";

/** The site's languages side by side, each named in itself (English · 한국어), the current one
 * marked: the app header's, the sign-in pages' and the landing's. Nothing on a site with one
 * language. */
export function LanguageSegmented({
  className,
  tone = "app",
  size = "sm",
}: {
  className?: string;
  tone?: SegmentedTone;
  /** The same three sizes as ThemeSegmented, so the two sit level: sm in the app's header, md in the
   * landing header's row of controls, lg a thumb-sized one in the landing's phone menu. */
  size?: "sm" | "md" | "lg";
}) {
  const { lang, offered, t } = useLanguage();
  const router = useRouter();
  if (offered.length < 2) return null;
  const colors = SEGMENTED_TONES[tone];
  return (
    <div role="radiogroup" aria-label={t("Language")} className={cn("flex items-center gap-0.5 rounded-full p-0.5", colors.group, className)}>
      {offered.map((l) => {
        const on = l === lang;
        return (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={on}
            lang={l}
            onClick={() => {
              if (on) return;
              setLanguage(l);
              router.refresh();
            }}
            data-no-tap
            className={cn(
              "rounded-full font-medium transition-colors",
              size === "lg" ? "h-10 px-4 text-[14px]" : size === "md" ? "h-[30px] px-3 text-[13px]" : "h-7 px-2.5 text-[12px]",
              on ? colors.on : colors.off,
            )}
          >
            {LANG_LABELS[l]}
          </button>
        );
      })}
    </div>
  );
}

/** Short names for the phone's top bar, where the full ones don't fit beside the other buttons. */
const SHORT: Record<string, string> = { en: "EN", ko: "한" };

/** The phone's: one button for the other language, the translate icon and its short name in itself
 * (EN / 한); the full name is its accessible label. */
export function LanguageButton({ className }: { className?: string }) {
  const { lang, offered, t } = useLanguage();
  const router = useRouter();
  if (offered.length < 2) return null;
  const other = offered.find((l) => l !== lang) ?? offered[0]!;
  return (
    <button
      type="button"
      lang={other}
      onClick={() => {
        setLanguage(other);
        router.refresh();
      }}
      aria-label={t("Switch to {language}", { language: LANG_LABELS[other] })}
      title={LANG_LABELS[other]}
      className={cn("flex min-h-11 items-center gap-1 rounded-full px-2 text-[13px] font-semibold text-ink-2 active:bg-chip", className)}
    >
      <Languages size={17} aria-hidden="true" />
      <span aria-hidden="true">{SHORT[other] ?? LANG_LABELS[other]}</span>
    </button>
  );
}
