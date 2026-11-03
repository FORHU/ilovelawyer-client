"use client";

import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useKeyboardViewport } from "./use-keyboard-viewport";

/** A phone chat screen: fills the visible area under whatever is above it and lifts its bottom bar
 * above the on-screen keyboard. The conversation scrolls; `ChatBar` stays put. While the keyboard
 * is up, the page chrome marked `keyboard-hide` (headers, tabs) gets out of the way, so the
 * conversation keeps the room (see globals.css). */
export function ChatScreen({ children }: { children: ReactNode }) {
  const { inset, offsetTop } = useKeyboardViewport();
  const open = inset > 0;
  const screen = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    document.documentElement.dataset.keyboard = "true";
    // The latest message stays in view when the conversation shrinks.
    const log = screen.current?.querySelector<HTMLElement>('[role="log"]');
    if (log) log.scrollTop = log.scrollHeight;
    return () => {
      delete document.documentElement.dataset.keyboard;
    };
  }, [open, inset]);

  return (
    <div
      ref={screen}
      data-keyboard={open}
      className="group/chat flex min-h-0 flex-1 flex-col"
      style={open ? { paddingBottom: inset, marginTop: offsetTop } : undefined}
    >
      {children}
    </div>
  );
}

/** The bar under the conversation: replies, step choices, the composer. Clears the home indicator
 * (but not while the keyboard is up, which already covers it). `data-tour="sticky-bar"` is what the
 * tour measures to keep its own controls clear of this bar. */
export function ChatBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-tour="sticky-bar"
      className={cn(
        "shrink-0 border-t border-line bg-white px-3 pt-2.5 pb-[max(12px,env(safe-area-inset-bottom))] group-data-[keyboard=true]/chat:pb-2.5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** One-tap replies in a row that scrolls sideways, so they never push the conversation up. */
export function QuickReplies({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="no-scrollbar -mx-3 mb-2.5 flex gap-2 overflow-x-auto px-3">
      {children}
    </div>
  );
}

export function ReplyChip({ className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "min-h-11 shrink-0 whitespace-nowrap rounded-full border border-line-chip bg-subtle px-4 text-[14px] font-medium text-ink transition-colors active:bg-chip disabled:opacity-40",
        className,
      )}
      {...rest}
    />
  );
}

/** The composer's rounded container. The text box inside should be 16px so iOS doesn't zoom. */
export function ComposerPill({ children, className, ...rest }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-end gap-1 rounded-[26px] border border-line-input bg-white p-1.5 transition-colors focus-within:border-ink-2",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** A 44px round icon button for the composer. */
export function ComposerButton({
  className,
  tone = "plain",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "plain" | "send" }) {
  return (
    <button
      type="button"
      data-no-tap
      className={cn(
        "flex size-11 shrink-0 items-center justify-center self-end rounded-full transition-colors disabled:opacity-40",
        tone === "send" ? "bg-ink text-white active:bg-primary disabled:bg-chip disabled:text-muted disabled:opacity-100" : "text-ink-2 active:bg-chip",
        className,
      )}
      {...rest}
    />
  );
}
