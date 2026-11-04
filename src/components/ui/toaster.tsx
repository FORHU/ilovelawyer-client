"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CircleCheck, X } from "lucide-react";
import { useToasts, type Toast } from "@/lib/toast";

/** How long a toast stays up. Long enough to read two lines and follow its link. */
const TOAST_MS = 7000;

function ToastCard({ toast }: { toast: Toast }) {
  const dismiss = useToasts((s) => s.dismiss);
  useEffect(() => {
    const id = setTimeout(() => dismiss(toast.id), TOAST_MS);
    return () => clearTimeout(id);
  }, [toast.id, dismiss]);

  return (
    <div
      role="status"
      className="pointer-events-auto flex w-full max-w-[400px] items-start gap-3 rounded-card border border-success-line bg-white p-4 shadow-[0_10px_30px_rgb(0_0_0/0.12)]"
      style={{ animation: "fade-in .15s ease" }}
    >
      <CircleCheck size={18} className="mt-0.5 shrink-0 text-success-ink" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-[14px] font-semibold text-ink">{toast.title}</p>
        {toast.description && <p className="text-[13px] leading-[1.55] text-ink-2">{toast.description}</p>}
        {toast.link && (
          <Link href={toast.link.href} onClick={() => dismiss(toast.id)} className="mt-0.5 self-start text-[13px] font-medium">
            {toast.link.label}
          </Link>
        )}
      </div>
      <button type="button" aria-label="Dismiss" onClick={() => dismiss(toast.id)} className="-mr-1 -mt-1 flex size-8 shrink-0 items-center justify-center text-ink-2">
        <X size={16} />
      </button>
    </div>
  );
}

/** Mounted once in the signed-in app shell: the toasts from toast.success(), newest at the bottom.
 * Above modals, and above the phone's bottom tab bar. */
export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  if (toasts.length === 0) return null;
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-3 bottom-[84px] z-[60] flex flex-col items-center gap-2 md:inset-x-auto md:bottom-6 md:right-6 md:items-end">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>
  );
}
