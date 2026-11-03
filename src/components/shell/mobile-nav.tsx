"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Folder, Scale, SlidersHorizontal } from "lucide-react";
import { SignOutButton } from "@/components/shell/sign-out-button";
import { GuideButton } from "@/components/tour/guide-button";
import { Avatar, Logo, initialsOf } from "@/components/ui/misc";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/cases", label: "Cases", Icon: Folder, match: /^\/cases/ },
  { href: "/lawyers", label: "Find a lawyer", Icon: Scale, match: /^\/lawyers/ },
  { href: "/settings", label: "Settings", Icon: SlidersHorizontal, match: /^\/settings/ },
];

/** Screens that bring their own header and a back button (a case, the new-case chat): they get the
 * whole screen, with no top bar and no tab bar, like a conversation in a messaging app. */
export function isImmersive(pathname: string) {
  return pathname === "/cases/new" || /^\/cases\/[^/]+$/.test(pathname);
}

/** The phone's top bar on the main screens: the logo, the guide, sign out and who you are. The
 * pages themselves are one tap away in the tab bar, so they are not repeated here. */
export function MobileTopBar({ name }: { name: string }) {
  return (
    <header className="flex min-h-[52px] shrink-0 items-center justify-between border-b border-line px-4">
      <Link href="/cases" aria-label="ilovelawyer, your cases" className="flex min-h-11 items-center">
        <Logo height={20} />
      </Link>
      <div className="flex items-center gap-1">
        <GuideButton variant="bar" />
        <SignOutButton compact />
        <Avatar initials={initialsOf(name || "You")} size={36} />
      </div>
    </header>
  );
}

/** The phone's main navigation: the three pages, icon and label, thumb-high. `data-tour="tab-bar"`
 * lets the tour keep its own controls clear of it. */
export function BottomTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      data-tour="tab-bar"
      className="grid shrink-0 grid-cols-3 border-t border-line bg-white pb-[env(safe-area-inset-bottom)]"
    >
      {TABS.map(({ href, label, Icon, match }) => {
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
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
