"use client";

import { LanguageSegmented } from "@/components/site/language-toggle";
import { ThemeSegmented } from "@/components/site/theme-toggle";
import { GuideButton } from "@/components/tour/guide-button";
import { useSession } from "@/lib/auth/session";
import { firstName } from "@/lib/format";
import { useT } from "@/components/site/language-provider";

/**
 * The desktop app's header, over every page: "Welcome back, Miguel" on the left (the sidebar
 * already says where you are, and signing in no longer shows a separate welcome banner); the guide,
 * the site's languages and light / dark mode on the right, one click away wherever you are. The
 * phone keeps its own top bar (mobile-nav.tsx), with the same controls.
 */
export function AppHeader() {
  const t = useT();
  const name = firstName(useSession((s) => s.user?.name));

  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between gap-4 border-b border-line bg-surface px-6">
      <p className="m-0 min-w-0 truncate font-display text-[17px] tracking-[-0.01em] text-ink">
        {name ? t("Welcome back, {name}", { name }) : t("Welcome back")}
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <GuideButton variant="pill" />
        <LanguageSegmented />
        <ThemeSegmented />
      </div>
    </header>
  );
}
