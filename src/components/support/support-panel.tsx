"use client";

import { useRef, useState, type CSSProperties } from "react";
import { X } from "lucide-react";
import { useBodyScrollLock } from "@/components/mobile/use-body-scroll-lock";
import { useKeyboardViewport } from "@/components/mobile/use-keyboard-viewport";
import { useDialog } from "@/components/tour/use-dialog";
import { buttonClass } from "@/components/ui/button";
import { Avatar, initialsOf } from "@/components/ui/misc";
import { useSession } from "@/lib/auth/session";
import { firstName } from "@/lib/format";
import { useSupportContentQuery } from "@/lib/support/queries";
import { useSupport } from "@/lib/support/store";
import type { SupportSettings } from "@/lib/support/types";
import { SupportConversation } from "./support-conversation";

function AssistantAvatar({ settings }: { settings: SupportSettings | undefined }) {
  const [failed, setFailed] = useState(false);
  if (settings?.avatarUrl && !failed) {
    // eslint-disable-next-line @next/next/no-img-element -- an admin-chosen https image, shown at 40px
    return <img src={settings.avatarUrl} alt="" width={40} height={40} onError={() => setFailed(true)} className="size-10 shrink-0 rounded-full border border-line object-cover" />;
  }
  return <Avatar initials={initialsOf(settings?.assistantName ?? "Support", 1)} size={40} />;
}

function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading support" className="flex flex-1 flex-col gap-2.5 px-4 py-4">
      <div className="h-11 w-[62%] animate-pulse rounded-card bg-chip motion-reduce:animate-none" />
      <div className="h-11 w-[44%] animate-pulse rounded-card bg-chip motion-reduce:animate-none" />
    </div>
  );
}

/** The Support Chat itself: a sheet from the bottom on a phone, a panel on the right from a tablet
 * up. Loaded only when it is first opened (see support-sheet.tsx), so none of it is in a page's
 * first download. On a phone held sideways, where 85% of the height would leave a few lines, it
 * takes the whole height. */
export function SupportPanel() {
  const panel = useRef<HTMLDivElement>(null);
  const audience = useSupport((s) => s.audience);
  const startFlowId = useSupport((s) => s.startFlowId);
  const close = () => useSupport.getState().close();
  useDialog(panel, close);
  useBodyScrollLock();
  // The phone's on-screen keyboard covers the bottom of the layout: lift the sheet clear of it.
  const { inset } = useKeyboardViewport();
  const name = useSession((s) => s.user?.name);
  const content = useSupportContentQuery(audience);
  const settings = content.data?.settings;

  return (
    <>
      <div aria-hidden onClick={close} className="fixed inset-0 z-[9007] bg-[rgb(23_23_23/0.55)] motion-safe:animate-[fade-in_.15s_ease]" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-title"
        tabIndex={-1}
        style={{ "--kb": `${inset}px` } as CSSProperties}
        className="fixed inset-x-0 bottom-[var(--kb)] z-[9008] box-border flex h-[min(85dvh,calc(100dvh-var(--kb)-12px))] flex-col overflow-hidden rounded-t-[20px] bg-white shadow-[0_0_50px_rgb(0_0_0/0.2)] outline-none motion-safe:max-md:animate-[sheet-up_.22s_cubic-bezier(.22,1,.36,1)] [@media(max-height:500px)]:h-[calc(100dvh-var(--kb))] [@media(max-height:500px)]:rounded-t-none md:inset-x-auto md:inset-y-0 md:bottom-0 md:right-0 md:h-auto md:w-[400px] md:rounded-none"
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-line py-3 pl-4 pr-1">
          <AssistantAvatar settings={settings} />
          <div className="min-w-0 flex-1">
            <h2 id="support-title" className="truncate font-display text-[22px] leading-tight tracking-[-0.01em]">
              {settings?.assistantName ?? "Support"}
            </h2>
            {settings?.responseTimeLine && <p className="text-[12px] leading-snug text-ink-2">{settings.responseTimeLine}</p>}
          </div>
          <button type="button" aria-label="Close support" onClick={close} data-no-tap className="flex size-11 shrink-0 items-center justify-center text-ink-2">
            <X size={20} aria-hidden />
          </button>
        </header>

        {content.isPending && <Loading />}
        {content.isError && (
          <div role="alert" className="flex flex-1 flex-col items-start justify-center gap-3 px-6">
            <p className="text-[15px] leading-[1.5] text-ink">Support is unavailable right now.</p>
            <button type="button" onClick={() => void content.refetch()} disabled={content.isFetching} className={buttonClass("soft", "md")}>
              {content.isFetching ? "Trying…" : "Try again"}
            </button>
          </div>
        )}
        {content.data && (
          <SupportConversation
            content={content.data}
            audience={audience}
            firstName={firstName(name)}
            startFlowId={startFlowId}
          />
        )}
      </div>
    </>
  );
}
