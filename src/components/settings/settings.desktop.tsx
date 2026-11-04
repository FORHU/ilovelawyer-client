"use client";

import { Eyebrow } from "@/components/ui/misc";
import { cn } from "@/lib/cn";
import { SECTIONS, SettingsContent, type Section } from "./settings-content";

export function SettingsDesktop({ section, onSection }: { section: Section; onSection: (s: Section) => void }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-8 px-5 py-8 md:px-10">
        <header className="flex flex-col gap-2">
          <Eyebrow muted>Account</Eyebrow>
          <h1 className="font-display text-[34px] leading-tight">Settings</h1>
        </header>
        <div className="grid items-start gap-6 md:grid-cols-[240px_1fr]">
          <nav aria-label="Settings" className="flex gap-1 overflow-x-auto md:flex-col">
            {SECTIONS.map((s) => (
              <button
                key={s.slug}
                type="button"
                aria-current={section.slug === s.slug ? "page" : undefined}
                onClick={() => onSection(s)}
                className={cn(
                  "shrink-0 rounded-input px-4 py-3 text-left text-[14.5px] transition-colors",
                  section.slug === s.slug ? "bg-chip font-semibold text-ink" : "text-ink-2 hover:text-ink",
                )}
              >
                {s.label}
              </button>
            ))}
          </nav>
          <SettingsContent section={section} />
        </div>
      </div>
    </div>
  );
}
