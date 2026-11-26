"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Folder, Scale, SlidersHorizontal } from "lucide-react";
import { SignOutButton } from "@/components/shell/sign-out-button";
import { GuideButton } from "@/components/tour/guide-button";
import { LanguageButton } from "@/components/site/language-toggle";
import { ThemeCycleButton } from "@/components/site/theme-toggle";
import { Avatar, Logo, initialsOf } from "@/components/ui/misc";
import { cn } from "@/lib/cn";
import { useSite } from "@/components/site/site-provider";
import { useT } from "@/components/site/language-provider";
import { msg } from "@/lib/i18n/msg";

const TABS = [
  { href: "/cases", label: msg("Cases"), Icon: Folder, match: /^\/cases/ },
  { href: "/lawyers", label: msg("Find a lawyer"), Icon: Scale, match: /^\/lawyers/ },
  { href: "/settings", label: msg("Settings"), Icon: SlidersHorizontal, match: /^\/settings/ },
];

/** Screens that bring their own header and a back button (a case, its questions and evidence, the new-case chat): they get the
 * whole screen, with no top bar and no tab bar, like a conversation in a messaging app. */
export function isImmersive(pathname: string) {
  return pathname === "/cases/new" || /^\/cases\/[^/]+(?:\/questions|\/evidence)?$/.test(pathname);
}

/** The phone's top bar on the main screens: the logo, the other language (on a site with two),
 * light / dark mode, the guide, sign out and who you are. The pages themselves are one tap away in
 * the tab bar, so they are not repeated here. */
export function MobileTopBar({ name }: { name: string }) {
  const t = useT();
  return (
    <header className="flex min-h-[52px] shrink-0 items-center justify-between border-b border-line px-4">
      <Link href="/cases" aria-label={t("ilovelawyer, your cases")} className="flex min-h-11 items-center">
        <Logo height={20} />
      </Link>
      <div className="flex items-center gap-0.5">
        <LanguageButton />
        <ThemeCycleButton />
        <GuideButton variant="bar" />
        <SignOutButton compact />
        <Avatar initials={initialsOf(name || t("You"))} size={36} />
      </div>
    </header>
  );
}

/** The phone's main navigation: the three pages, icon and label, thumb-high. `data-tour="tab-bar"`
 * lets the tour keep its own controls clear of it. */
export function BottomTabBar() {
  const pathname = usePathname();
  const t = useT();
  // No "Find a lawyer" on a site without lawyers yet.
  const lawyersOpen = useSite().clientRequests === "open";
  const tabs = TABS.filter((t) => lawyersOpen || t.href !== "/lawyers");
  return (
    <nav
      aria-label={t("Main")}
      data-tour="tab-bar"
      className={cn("grid shrink-0 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]", tabs.length === 3 ? "grid-cols-3" : "grid-cols-2")}
    >
      {tabs.map(({ href, label, Icon, match }) => {
        const on = match.test(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[12px] font-medium transition-colors active:bg-subtle",
              on ? "text-ink" : "text-ink-2",
            )}
          >
            <span aria-hidden="true" className={cn("absolute inset-x-6 top-0 h-0.5 rounded-full", on ? "bg-gold" : "bg-transparent")} />
            <Icon size={22} strokeWidth={on ? 2.2 : 1.8} aria-hidden="true" />
            {t(label)}
          </Link>
        );
      })}
    </nav>
  );
}
