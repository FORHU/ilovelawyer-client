"use client";

import { useEffect, useRef } from "react";
import { getAppSocket } from "@/lib/socket";
import { useRefetchSupportThread } from "./ticket-queries";

/** A reply from the team arrives as `support:reply` on the app's shared socket (lib/socket.ts). The
 * REST route stays the source of truth: the event only prompts a refetch, so a missed one costs
 * nothing worse than the reply showing up on the next focus or open. Mounted once in AppShell,
 * after useAppSocket (which connects and disconnects the socket). */
export function useSupportSocket(): void {
  const refetch = useRefetchSupportThread();
  const latest = useRef(refetch);
  useEffect(() => {
    latest.current = refetch;
  });

  useEffect(() => {
    const sock = getAppSocket();
    const onEvent = () => void latest.current();
    sock.on("support:reply", onEvent);
    // A reconnect may have missed a reply while the connection was down.
    sock.on("connect", onEvent);
    return () => {
      sock.off("support:reply", onEvent);
      sock.off("connect", onEvent);
    };
  }, []);
}
