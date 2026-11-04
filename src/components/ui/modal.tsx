"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),textarea,select,[tabindex]:not([tabindex="-1"])';

interface Props {
  open: boolean;
  onClose: () => void;
  /** When true, backdrop click, close button and Escape are ignored (payment processing). */
  locked?: boolean;
  title: string;
  subtitle?: string;
  /** How wide on web: md 480 (the default), lg 640 for long text such as a consent, xl 880 for
   * content laid out side by side. Wider wraps less, so a long modal fits without scrolling. */
  size?: keyof typeof WIDTHS;
  children: ReactNode;
}

const WIDTHS = { md: "max-w-[480px]", lg: "max-w-[640px]", xl: "max-w-[880px]" } as const;

/**
 * Centered card on web (max 480, or wider with `size`), bottom sheet on phone.
 * Escape closes, focus is trapped and restored, and the page behind doesn't scroll: it's rendered
 * into <body> (pages scroll inside their own container, which body's lock doesn't reach, and a modal
 * opened from inside one, like a card's, would scroll it), and scrolling never carries past it.
 */
export function Modal({ open, onClose, locked, title, subtitle, size = "md", children }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const lockedRef = useRef(locked);
  const closeRef = useRef(onClose);
  useEffect(() => {
    lockedRef.current = locked;
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !lockedRef.current) {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const items = Array.from(
        panel.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  // Only mounted while open, which is only ever after a click, so document is always there.
  return createPortal(
    <div
      onClick={() => !locked && onClose()}
      className="fixed inset-0 z-50 flex items-end justify-center overscroll-contain bg-[rgba(20,20,20,.45)] md:items-center md:p-6"
      style={{ animation: "fade-in .15s ease" }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        // Children never shrink: content taller than the screen scrolls rather than squashing a button.
        className={`box-border flex max-h-full w-full ${WIDTHS[size]} flex-col gap-[18px] overflow-y-auto overscroll-contain rounded-t-3xl bg-white p-6 shadow-modal outline-none md:rounded-modal [&>*]:shrink-0`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl tracking-[-0.02em]">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-[13px] leading-[1.5] text-ink-2">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={locked}
            className="-mr-2 -mt-2 flex size-10 shrink-0 items-center justify-center text-ink-2"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
