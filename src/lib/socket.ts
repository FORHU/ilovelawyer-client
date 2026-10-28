"use client";

import { useEffect, useSyncExternalStore } from "react";
import { io, type Socket } from "socket.io-client";
import { API_URL } from "@/lib/api/config";
import { useSession } from "@/lib/auth/session";

// The app's one connection to ilovelawyer-api's Socket.IO (same auth as the lawyer app's
// lib/notifications/socket.ts). The API puts it in the signed-in account's own room, and every
// live push the client app gets arrives on it: lawyer requests (lib/lawyer-requests/socket.ts)
// and AI chat replies (lib/cases/chat-socket.ts).
//
// useAppSocket owns connecting and disconnecting. Feature hooks only add and remove their own
// listeners: one disconnecting in its cleanup would cut off every other feature too.

let socket: Socket | null = null;

let connected = false;
const statusListeners = new Set<() => void>();

function setConnected(next: boolean) {
  if (connected === next) return;
  connected = next;
  statusListeners.forEach((listener) => listener());
}

/** Lazily created, once per tab. `auth` is a callback so it reads the current access token on
 * every (re)connection attempt, not just the one at creation time — the token rotates on refresh
 * (lib/api/fetch.ts), same reasoning as the lawyer app's socket. */
export function getAppSocket(): Socket {
  if (socket) return socket;
  socket = io(API_URL, {
    autoConnect: false,
    withCredentials: true,
    auth: (cb) => cb({ token: useSession.getState().accessToken }),
  });
  socket.on("connect", () => setConnected(true));
  socket.on("disconnect", () => setConnected(false));
  return socket;
}

/** Mounted once in AppShell, before the feature hooks. Connects while signed in, reconnects on a
 * fresh token, and disconnects on sign-out. */
export function useAppSocket(): void {
  const accessToken = useSession((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) return;
    const sock = getAppSocket();
    sock.connect();
    return () => {
      sock.disconnect();
    };
  }, [accessToken]);
}

function subscribeStatus(listener: () => void) {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

/** Whether the socket is connected right now. While it isn't, nothing tells the app that an AI
 * reply has finished, so the chat says it's reconnecting. */
export function useSocketConnected(): boolean {
  return useSyncExternalStore(
    subscribeStatus,
    () => connected,
    () => false,
  );
}
