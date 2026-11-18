"use client";

import { cn } from "@/lib/cn";
import { useSupportUnread } from "@/lib/support/ticket-queries";

/** The red dot for a reply from the support team. It carries no words of its own: the control it
 * sits on says "new support reply" in its name, and SupportUnreadAnnouncer says it once for the
 * whole page. */
export function SupportDot({ className }: { className?: string }) {
  return <span aria-hidden data-support-dot className={cn("absolute size-2.5 rounded-full border-2 border-white bg-error box-content", className)} />;
}

/** Says a new reply has arrived, once, to a screen reader, wherever the person is in the app. It is
 * silent while there is nothing new, so opening the conversation (which clears the count) says
 * nothing more. */
export function SupportUnreadAnnouncer() {
  const unread = useSupportUnread();
  return (
    <div role="status" className="sr-only">
      {unread > 0 ? `You have ${unread} new ${unread === 1 ? "reply" : "replies"} from support.` : ""}
    </div>
  );
}
