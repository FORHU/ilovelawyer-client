"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { PULL_THRESHOLD, canStartPull, pullDistance, reachedThreshold } from "@/lib/pull-to-refresh";

/** A screen's scroller with pull-to-refresh. The shell never scrolls the document (globals.css
 * turns off overscroll on html and body), so Chrome's own pull-to-refresh can't run on a phone;
 * this reads the touch itself. Pulling down from the top of the scroller and letting go past the
 * threshold refetches whatever queries are on screen. The content doesn't move, only the
 * indicator does, so sticky headers inside keep working. */
export function PullToRefresh({ children, className }: { children: React.ReactNode; className?: string }) {
  const queryClient = useQueryClient();
  const scroller = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let startY: number | null = null;
    let pulled = 0;

    const reset = () => {
      startY = null;
      pulled = 0;
      setDistance(0);
    };

    const onStart = (e: TouchEvent) => {
      if (busy.current || e.touches.length !== 1 || !canStartPull(el.scrollTop)) return;
      startY = e.touches[0].clientY;
    };

    const onMove = (e: TouchEvent) => {
      if (startY === null) return;
      if (!canStartPull(el.scrollTop)) return reset();
      pulled = pullDistance(e.touches[0].clientY - startY);
      if (pulled > 0) {
        e.preventDefault();
        setDistance(pulled);
      }
    };

    const onEnd = async () => {
      if (startY === null) return;
      const go = reachedThreshold(pulled);
      reset();
      if (!go) return;
      busy.current = true;
      setRefreshing(true);
      try {
        await queryClient.invalidateQueries();
      } catch {
        // Failed queries show their own error state; the spinner just goes away.
      } finally {
        busy.current = false;
        setRefreshing(false);
      }
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", reset);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", reset);
    };
  }, [queryClient]);

  const shown = refreshing ? PULL_THRESHOLD / 2 : distance;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        aria-hidden={!refreshing}
        role={refreshing ? "status" : undefined}
        className={cn(
          "pointer-events-none absolute left-1/2 top-0 z-20 flex size-9 -translate-x-1/2 items-center justify-center rounded-full border border-line bg-white text-ink-2 shadow-sm",
          !distance && "transition-[transform,opacity] duration-200",
        )}
        style={{ transform: `translate(-50%, ${shown - 36}px)`, opacity: shown > 0 ? Math.min(1, shown / 40) : 0 }}
      >
        {refreshing ? (
          <>
            <Loader2 size={18} className="animate-spin" aria-hidden />
            <span className="sr-only">Refreshing</span>
          </>
        ) : (
          <RefreshCw size={16} aria-hidden style={{ transform: `rotate(${(distance / PULL_THRESHOLD) * 180}deg)` }} />
        )}
      </div>
      <div ref={scroller} className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", className)} style={{ touchAction: "pan-y" }}>
        {children}
      </div>
    </div>
  );
}
