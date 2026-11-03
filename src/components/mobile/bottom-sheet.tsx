"use client";

import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useDialog } from "@/components/tour/use-dialog";
import { useBodyScrollLock } from "./use-body-scroll-lock";
import { cn } from "@/lib/cn";

/** Pulling the sheet down past this many px lets it go. */
const DISMISS_DISTANCE = 90;

/** A phone sheet: rises from the bottom over a dimmed page, closes with the X, the dimmed area,
 * Escape or by pulling the handle down. Focus moves in and is trapped, and returns on close, and
 * the page behind doesn't scroll. Clears the home indicator. Only mounted while `open`. */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  if (!open) return null;
  return createPortal(
    <Sheet onClose={onClose} title={title} className={className}>
      {children}
    </Sheet>,
    document.body,
  );
}

function Sheet({ onClose, title, children, className }: { onClose: () => void; title: string; children: ReactNode; className?: string }) {
  const panel = useRef<HTMLDivElement>(null);
  const start = useRef<number | null>(null);
  const [drag, setDrag] = useState(0);
  const [pulling, setPulling] = useState(false);
  useDialog(panel, onClose);
  useBodyScrollLock();

  const end = () => {
    if (start.current === null) return;
    start.current = null;
    setPulling(false);
    if (drag > DISMISS_DISTANCE) onClose();
    else setDrag(0);
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-end bg-[rgba(20,20,20,.45)]" style={{ animation: "fade-in .15s ease" }}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{ transform: drag ? `translateY(${drag}px)` : undefined, transition: pulling ? "none" : "transform .2s ease" }}
        className={cn(
          "flex max-h-[88dvh] w-full flex-col rounded-t-3xl bg-white pb-[max(16px,env(safe-area-inset-bottom))] shadow-modal outline-none motion-safe:animate-[sheet-up_.22s_ease-out]",
          className,
        )}
      >
        {/* The handle and title are what you pull. A visible close button is the real way out. */}
        <div
          className="touch-none select-none"
          onPointerDown={(e) => {
            // Not on the Close button: capturing the pointer would send its click to this wrapper.
            if ((e.target as HTMLElement).closest("button")) return;
            start.current = e.clientY;
            setPulling(true);
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => start.current !== null && setDrag(Math.max(0, e.clientY - start.current))}
          onPointerUp={end}
          onPointerCancel={end}
        >
          <div aria-hidden="true" className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line-input" />
          <div className="flex items-center justify-between gap-3 pl-5 pr-2 pt-1">
            <h2 className="font-display text-[20px] tracking-[-0.01em]">{title}</h2>
            <button type="button" aria-label="Close" onClick={onClose} data-no-tap className="flex size-11 items-center justify-center rounded-full text-ink-2 active:bg-chip">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-1 pt-1">{children}</div>
      </div>
    </div>
  );
}

/** A row in a sheet's list: 52px tall, the label on the left, the state on the right. */
export function SheetRow({
  children,
  onSelect,
  icon,
  danger,
  selected,
  disabled,
}: {
  children: ReactNode;
  onSelect: () => void;
  icon?: ReactNode;
  danger?: boolean;
  selected?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      data-no-tap
      className={cn(
        "flex min-h-[52px] w-full items-center gap-3 rounded-card px-3 text-left text-[16px] font-medium active:bg-chip disabled:opacity-40",
        danger ? "text-error" : "text-ink",
      )}
    >
      {icon && <span aria-hidden="true" className="flex shrink-0 text-ink-2">{icon}</span>}
      <span className="min-w-0 flex-1">{children}</span>
      {selected && <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-gold" />}
    </button>
  );
}
