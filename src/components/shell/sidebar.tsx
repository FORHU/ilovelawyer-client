"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Folder, PanelLeft, Plus, Scale, SlidersHorizontal, type LucideIcon } from "lucide-react";
import { Avatar, Logo, initialsOf } from "@/components/ui/misc";
import { useSession } from "@/lib/auth/session";
import { useCasesQuery } from "@/lib/cases/queries";
import { cn } from "@/lib/cn";
import { clientRequestStatusLabel, useOpenLawyerRequestsQuery } from "@/lib/lawyer-requests/api";
import { useApp } from "@/lib/store";
import { areasLabel } from "@/lib/types";

const railBtn =
  "flex size-[34px] shrink-0 items-center justify-center rounded-full border bg-white text-ink";

const NAV: { href: string; label: string; icon: LucideIcon; match: RegExp }[] = [
  { href: "/cases", label: "Cases", icon: Folder, match: /^\/cases(?!\/new)/ },
  { href: "/lawyers", label: "Find a lawyer", icon: Scale, match: /^\/lawyers/ },
  { href: "/settings", label: "Settings", icon: SlidersHorizontal, match: /^\/settings/ },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed: collapsed, toggleSidebar } = useApp();
  const { data: cases = [] } = useCasesQuery();
  const { data: openRequests } = useOpenLawyerRequestsQuery();
  const fullName = useSession((s) => s.user?.name ?? "");
  const initials = initialsOf(fullName || "You");

  const activeId = /^\/cases\/([^/]+)/.exec(pathname)?.[1];
  const label = collapsed ? "Expand sidebar" : "Collapse sidebar";

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col gap-[14px] overflow-hidden border-r border-line bg-subtle transition-[width] duration-200 ease-in-out md:flex",
        collapsed ? "w-[52px] px-1.5 py-3" : "w-[264px] px-3 py-4",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2",
          collapsed ? "justify-center" : "justify-between px-1.5",
        )}
      >
        {!collapsed && <Logo height={22} />}
        <button
          type="button"
          aria-label={label}
          title={label}
          onClick={toggleSidebar}
          data-no-tap
          className="flex size-[34px] items-center justify-center rounded-[10px] text-ink-2 hover:bg-chip"
        >
          <PanelLeft size={18} />
        </button>
      </div>

      {!collapsed ? (
        <>
          <Link
            href="/cases/new"
            data-no-tap
            className="flex h-10 items-center gap-2.5 rounded-full border border-line bg-white px-3.5 text-[13px] font-medium text-ink no-underline hover:border-line-hover hover:text-ink"
          >
            <Plus size={15} />
            New case
          </Link>
          <nav aria-label="Main" className="flex flex-col gap-0.5">
            {NAV.map(({ href, label: text, icon: Icon, match }) => (
              <Link
                key={href}
                href={href}
                aria-current={match.test(pathname) ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] font-medium text-ink no-underline hover:text-ink",
                  match.test(pathname) ? "bg-chip" : "hover:bg-chip/60",
                )}
              >
                <Icon size={16} aria-hidden />
                {text}
              </Link>
            ))}
          </nav>
          <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
            {cases.length > 0 && (
              <div className="px-2.5 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[1px] text-muted">Your cases</div>
            )}
            {cases.map((c) => {
              const openRequest = openRequests?.get(c.id);
              const active = activeId === c.id;
              return (
                <Link
                  key={c.id}
                  href={`/cases/${c.id}`}
                  className={cn(
                    "flex flex-col gap-0.5 rounded-[10px] border px-2.5 py-[9px] no-underline",
                    active ? "border-line bg-white" : "border-transparent bg-transparent",
                  )}
                >
                  <span className="text-[13px] font-medium leading-snug text-ink">{c.title}</span>
                  <span className={cn("text-[11px]", openRequest || active ? "text-gold" : "text-muted")}>
                    {openRequest ? clientRequestStatusLabel(openRequest.status) : areasLabel(c.areas)}
                  </span>
                </Link>
              );
            })}
          </div>
          <Link
            href="/settings"
            aria-label="Account settings"
            className="flex items-center gap-2.5 border-t border-line px-2.5 pb-0.5 pt-3 text-ink no-underline hover:text-ink"
          >
            <Avatar initials={initials} size={28} className="border-0 bg-ink text-white" />
            <div className="flex-1 truncate text-[13px]">{fullName}</div>
            <ChevronRight size={15} className="text-ink-2" aria-hidden />
          </Link>
        </>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto">
            <Link href="/cases/new" aria-label="New case" title="New case" data-no-tap className={cn(railBtn, "border-line text-ink no-underline hover:text-ink")}>
              <Plus size={15} />
            </Link>
            {NAV.map(({ href, label: text, icon: Icon, match }) => (
              <Link
                key={href}
                href={href}
                aria-label={text}
                title={text}
                data-no-tap
                className={cn(railBtn, "no-underline hover:text-ink", match.test(pathname) ? "border-gold bg-chip" : "border-line")}
              >
                <Icon size={15} />
              </Link>
            ))}
            {cases.map((c) => {
              const on = activeId === c.id;
              return (
                <Link
                  key={c.id}
                  href={`/cases/${c.id}`}
                  aria-label={c.title}
                  title={c.title}
                  data-no-tap
                  className={cn(
                    "flex size-[34px] shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold text-ink no-underline hover:text-ink",
                    on ? "border-gold bg-chip" : "border-line bg-white",
                  )}
                >
                  {c.title
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()}
                </Link>
              );
            })}
          </div>
          <div className="flex flex-col items-center border-t border-line pt-3">
            <Link href="/settings" aria-label="Account settings" title="Account settings">
              <Avatar initials={initials} size={28} className="border-0 bg-ink text-white" />
            </Link>
          </div>
        </>
      )}
    </aside>
  );
}
