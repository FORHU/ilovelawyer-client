"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FolderPlus, LayoutList, PanelLeft } from "lucide-react";
import { SignOutButton } from "@/components/shell/sign-out-button";
import { Avatar, Logo, initialsOf } from "@/components/ui/misc";
import { useSession } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { lawyerLabel, useApp } from "@/lib/store";

const railBtn =
  "flex size-[34px] shrink-0 items-center justify-center rounded-full border bg-white text-ink";

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { cases, lawyer, sidebarCollapsed: collapsed, toggleSidebar } = useApp();
  const fullName = useSession((s) => s.user?.name ?? "");
  const initials = initialsOf(fullName || "You");

  const activeId = /^\/cases\/(\d+)/.exec(pathname)?.[1];
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
          <button
            type="button"
            onClick={() => router.push("/cases/new")}
            data-no-tap
            className="flex h-10 items-center gap-2.5 rounded-full border border-line bg-white px-3.5 text-[13px] font-medium text-ink hover:border-line-hover"
          >
            <FolderPlus size={15} />
            New case
          </button>
          <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
            <Link
              href="/cases"
              className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[1px] text-muted no-underline"
            >
              All cases
            </Link>
            {cases.map((c) => {
              const law = lawyer.caseId === c.id && lawyer.status !== "none";
              return (
                <Link
                  key={c.id}
                  href={`/cases/${c.id}`}
                  className={cn(
                    "flex flex-col gap-0.5 rounded-[10px] px-2.5 py-[9px] no-underline",
                    activeId === String(c.id) ? "bg-chip" : "bg-transparent",
                  )}
                >
                  <span className="truncate text-[13px] font-medium text-ink">{c.title}</span>
                  <span className={cn("text-[11px]", law ? "text-gold" : "text-muted")}>
                    {law ? lawyerLabel(lawyer.status) : c.area}
                  </span>
                </Link>
              );
            })}
          </div>
          <div className="flex flex-col gap-1 rounded-input border border-line bg-white px-3.5 py-3">
            <div className="text-[13px] font-semibold">Pay per case</div>
            <div className="text-xs leading-[1.5] text-ink-2">
              $9.99 per case, with 50 chat credits included. Top up any time.
            </div>
          </div>
          <div className="flex items-center gap-2.5 border-t border-line px-2.5 pb-0.5 pt-3">
            <Avatar initials={initials} size={28} />
            <div className="flex-1 truncate text-[13px]">{fullName}</div>
            <SignOutButton />
          </div>
        </>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto">
            <button
              type="button"
              aria-label="New case"
              title="New case"
              onClick={() => router.push("/cases/new")}
              data-no-tap
              className={cn(railBtn, "border-line")}
            >
              <FolderPlus size={15} />
            </button>
            <button
              type="button"
              aria-label="All cases"
              title="All cases"
              onClick={() => router.push("/cases")}
              data-no-tap
              className={cn(railBtn, "border-line")}
            >
              <LayoutList size={15} />
            </button>
            {cases.map((c) => {
              const on = activeId === String(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-label={c.title}
                  title={c.title}
                  onClick={() => router.push(`/cases/${c.id}`)}
                  data-no-tap
                  className={cn(
                    "size-[34px] shrink-0 rounded-full border text-[11px] font-semibold text-ink",
                    on ? "border-gold bg-chip" : "border-line bg-white",
                  )}
                >
                  {c.title
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()}
                </button>
              );
            })}
          </div>
          <div className="flex flex-col items-center gap-2 border-t border-line pt-3">
            <Avatar initials={initials} size={28} />
            <SignOutButton compact />
          </div>
        </>
      )}
    </aside>
  );
}
