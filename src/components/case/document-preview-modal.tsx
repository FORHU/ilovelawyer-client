"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FileText, X } from "lucide-react";
import { DocumentPreview, OpenInNewTab } from "./document-preview";

const FOCUSABLE = "a[href],button:not([disabled])";

/** A document opened over the page: a title bar with open-in-a-new-tab and close, and the file
 * below. Escape or a click outside closes it, focus stays inside, and the page behind doesn't
 * scroll. `url` is the same-origin /files/<token> link the API hands out. */
export function DocumentPreviewModal({ name, url, onClose }: { name: string; url: string; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
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
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center overscroll-contain bg-[rgba(20,20,20,.45)] md:items-center md:p-6"
      style={{ animation: "fade-in .15s ease" }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={name}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="flex h-[92dvh] w-full max-w-[880px] flex-col overflow-hidden rounded-t-3xl bg-white shadow-modal outline-none md:h-[80vh] md:rounded-modal"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-subtle px-5 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <FileText size={16} className="shrink-0 text-ink-2" aria-hidden />
            <span className="truncate text-sm font-medium">{name}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <OpenInNewTab url={url} />
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              data-no-tap
              className="flex size-9 items-center justify-center rounded-full text-ink-2 hover:bg-chip hover:text-ink"
            >
              <X size={18} aria-hidden />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 bg-subtle">
          <DocumentPreview name={name} url={url} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
