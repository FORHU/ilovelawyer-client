"use client";

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { THEME_CHOICES, useTheme, useThemeChoice, type ThemeChoice } from "@/lib/theme";
import { useT } from "./language-provider";
import { SEGMENTED_TONES, type SegmentedTone } from "./segmented-tones";

const ICONS: Record<ThemeChoice, LucideIcon> = { light: Sun, dark: Moon, system: Monitor };

/** Light / Dark / Match my device as three icon buttons in one pill: the app header's, the sign-in
 * pages' and the landing's. */
export function ThemeSegmented({
  className,
  tone = "app",
  size = "sm",
}: {
  className?: string;
  tone?: SegmentedTone;
  /** sm: 34px, the app's header. md: 36px, the landing header's row of links and buttons. lg: 46px,
   * a thumb-sized one in a phone menu. */
  size?: "sm" | "md" | "lg";
}) {
  const setChoice = useTheme((s) => s.setChoice);
  const choice = useThemeChoice();
  const t = useT();
  const colors = SEGMENTED_TONES[tone];
  return (
    <div role="radiogroup" aria-label={t("Appearance")} className={cn("flex items-center gap-0.5 rounded-full p-0.5", colors.group, className)}>
      {THEME_CHOICES.map(({ value, label }) => {
        const Icon = ICONS[value];
        const on = choice === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={t(label)}
            title={t(label)}
            onClick={() => setChoice(value)}
            data-no-tap
            className={cn(
              "flex items-center justify-center rounded-full transition-colors",
              size === "lg" ? "size-10" : size === "md" ? "size-[30px]" : "size-7",
              on ? colors.on : colors.off,
            )}
          >
            <Icon size={size === "sm" ? 14 : 15} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

/** One round button that steps Light → Dark → Match my device: the phone's top bar, where three
 * buttons don't fit. Its label says what it is now and what a tap does. */
export function ThemeCycleButton({ className }: { className?: string }) {
  const setChoice = useTheme((s) => s.setChoice);
  const choice = useThemeChoice() ?? "system";
  const t = useT();
  const index = THEME_CHOICES.findIndex((c) => c.value === choice);
  const next = THEME_CHOICES[(index + 1) % THEME_CHOICES.length]!;
  const Icon = ICONS[choice];
  const now = t(THEME_CHOICES[index]!.label);
  return (
    <button
      type="button"
      onClick={() => setChoice(next.value)}
      aria-label={t("Appearance: {now}. Switch to {next}", { now, next: t(next.label) })}
      title={now}
      className={cn("flex size-11 items-center justify-center rounded-full text-ink-2 active:bg-chip", className)}
    >
      <Icon size={19} aria-hidden="true" />
    </button>
  );
}
