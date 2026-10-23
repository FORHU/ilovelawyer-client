"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ActionMenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  /** Destructive: shown in the error colour. */
  danger?: boolean;
}

const MENU_WIDTH = 192;
const GAP = 6;
const EDGE = 8;

interface Placement {
  top: number;
  left: number;
  /** Opens upward when there's no room below the button. */
  up: boolean;
}

/**
 * A "…" button with a small menu under it. The menu is drawn in a portal at the button's screen
 * position, so a scrolling or clipping parent (the cases table scrolls sideways) can never cut it
 * off. It flips above the button near the bottom of the window, and closes on Escape, a click
 * outside, a scroll or a resize, and after a pick. Focus returns to the button.
 */
export function ActionMenu({ label, items, className }: { label: string; items: ActionMenuItem[]; className?: string }) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    setPlacement(null);
    if (restoreFocus) button.current?.focus();
  }, []);

  // Measured once the menu exists, so its real height decides whether it fits below.
  useLayoutEffect(() => {
    if (!open || !button.current || !menu.current) return;
    const b = button.current.getBoundingClientRect();
    const height = menu.current.offsetHeight;
    const fitsBelow = b.bottom + GAP + height <= window.innerHeight - EDGE;
    const left = Math.min(Math.max(EDGE, b.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - EDGE);
    setPlacement({ left, up: !fitsBelow, top: fitsBelow ? b.bottom + GAP : Math.max(EDGE, b.top - GAP - height) });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!menu.current?.contains(target) && !button.current?.contains(target)) close(false);
    };
    const onMove = () => close(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    // Capture, so a scroll inside any container (not just the window) closes it.
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, close]);

  // Moves focus into the menu once it is placed.
  useEffect(() => {
    if (placement) menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [placement]);

  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const entries = Array.from(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const at = entries.indexOf(document.activeElement as HTMLElement);
    const next = e.key === "ArrowDown" ? (at + 1) % entries.length : (at - 1 + entries.length) % entries.length;
    entries[next]?.focus();
  };

  return (
    <div className={className}>
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? close(false) : setOpen(true))}
        data-no-tap
        className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink-2 transition-colors hover:border-line-hover focus-visible:outline-2 focus-visible:outline-gold md:size-9"
      >
        <MoreHorizontal size={16} aria-hidden />
      </button>
      {open &&
        createPortal(
          <div
            ref={menu}
            role="menu"
            aria-label={label}
            onKeyDown={onMenuKey}
            // Drawn invisibly first so it can be measured, then placed.
            style={{ position: "fixed", top: placement?.top ?? 0, left: placement?.left ?? 0, width: MENU_WIDTH, visibility: placement ? "visible" : "hidden" }}
            className={cn("z-50 flex flex-col overflow-hidden rounded-card border border-line bg-white py-1 shadow-modal", placement?.up && "origin-bottom")}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
                  item.onSelect();
                }}
                className={cn(
                  "flex min-h-11 items-center gap-2.5 px-4 text-left text-[13px] hover:bg-subtle focus-visible:bg-subtle focus-visible:outline-none md:min-h-9",
                  item.danger ? "text-error" : "text-ink",
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
