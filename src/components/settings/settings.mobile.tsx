"use client";

import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { SettingsContent, useSections, type Section } from "./settings-content";
import { useT } from "@/components/site/language-provider";

/** The phone's Settings is two screens, like the system settings: a list of categories, and one
 * category's content under a back arrow. Each is a URL, so the browser's back button works and a
 * category can be linked to. */
export function SettingsMobile({ section }: { section: Section | undefined }) {
  const t = useT();
  const sections = useSections();
  if (!section) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 px-4 pb-6 pt-5">
          <h1 className="font-display text-[30px] leading-tight">{t("Settings")}</h1>
          <nav aria-label={t("Settings")}>
            <ul className="overflow-hidden rounded-card border border-line bg-surface">
              {sections.map((s) => (
                <li key={s.slug} className="border-b border-line last:border-b-0">
                  <Link
                    href={`/settings?section=${s.slug}`}
                    data-no-tap
                    className="flex min-h-14 items-center justify-between gap-3 px-4 text-[15px] font-medium text-ink no-underline transition-colors hover:text-ink active:bg-chip"
                  >
                    {t(s.label)}
                    <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <header className="sticky top-0 z-10 flex min-h-[52px] items-center gap-1 border-b border-line bg-surface px-2">
        <Link
          href="/settings"
          aria-label={t("Back to Settings")}
          data-no-tap
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-ink no-underline hover:text-ink active:bg-chip"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <h1 className="min-w-0 truncate font-display text-[20px] leading-tight">{t(section.label)}</h1>
      </header>
      <div className="px-4 py-5">
        <SettingsContent section={section} />
      </div>
    </div>
  );
}
