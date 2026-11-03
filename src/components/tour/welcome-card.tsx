"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useDialog } from "./use-dialog";

const POINTS = ["Tell us what happened", "Answer a few questions", "Find a solicitor, only if you want to"];

/** T0: shown once over the empty Cases page after a first sign-in. A card, not a spotlight. */
export function WelcomeCard({ name, onShow, onSkip }: { name: string | null; onShow: () => void; onSkip: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  useDialog(panel, onSkip);

  return (
    <div className="fixed inset-0 z-[9005] flex items-center justify-center bg-[rgb(23_23_23/0.55)] px-3 md:px-6" style={{ animation: "fade-in .15s ease" }}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        tabIndex={-1}
        className="box-border flex max-h-full w-full max-w-[440px] flex-col gap-4 overflow-y-auto rounded-modal bg-white p-6 shadow-modal outline-none md:p-[30px]"
      >
        <div className="flex flex-col gap-2">
          <h2 id="welcome-title" className="font-display text-[26px] leading-tight tracking-[-0.02em]">
            {name ? `Welcome, ${name}` : "Welcome"}
          </h2>
          <p className="text-[14px] leading-[1.55] text-ink-2">
            Tell us about a legal problem. We&apos;ll help you organise it, then you can find a solicitor if you want one.
          </p>
        </div>
        <ol className="flex flex-col gap-2.5">
          {POINTS.map((p, i) => (
            <li key={p} className="flex items-center gap-3 text-[14px]">
              <span aria-hidden className="flex size-[26px] shrink-0 items-center justify-center rounded-full border border-gold font-display text-xs text-gold">
                {i + 1}
              </span>
              {p}
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-2">
          <Button size="lg" onClick={onShow}>
            Show me around
          </Button>
          <Button variant="ghost" size="lg" onClick={onSkip}>
            Skip for now
          </Button>
        </div>
        <p className="text-center text-[12px] text-muted">ilovelawyer isn&apos;t a law firm and doesn&apos;t give legal advice.</p>
      </div>
    </div>
  );
}
