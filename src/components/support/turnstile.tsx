"use client";

import { useEffect, useRef } from "react";

// Cloudflare Turnstile, the check that a signed-out visitor writing to the team is a person. The
// API verifies the token it produces (ilovelawyer-api src/utils/turnstile.ts).

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/** Whether a site key is set. Without one there is no widget, and the API (which has no secret in
 * development either) lets the form through; in production it refuses, and the form says so. */
export const TURNSTILE_ENABLED = !!SITE_KEY;

let loading: Promise<TurnstileApi> | null = null;

/** Loads Cloudflare's script once, however many forms ask for it. */
function load(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile did not load")));
    script.onerror = () => {
      loading = null;
      reject(new Error("Turnstile did not load"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/** The widget. `onToken` gets the token when the visitor passes, and "" when it expires or fails
 * (so the form can't send a stale one). Change `resetKey` to ask for a fresh check, e.g. after the
 * API refused the last token. */
export function Turnstile({ onToken, resetKey = 0 }: { onToken: (token: string) => void; resetKey?: number }) {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const callback = useRef(onToken);
  useEffect(() => {
    callback.current = onToken;
  });

  useEffect(() => {
    if (!SITE_KEY || !container.current) return;
    let live = true;
    const element = container.current;
    load().then(
      (turnstile) => {
        if (!live) return;
        widget.current = turnstile.render(element, {
          sitekey: SITE_KEY,
          callback: (token: string) => callback.current(token),
          "expired-callback": () => callback.current(""),
          "error-callback": () => callback.current(""),
        });
      },
      () => callback.current(""),
    );
    return () => {
      live = false;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, []);

  useEffect(() => {
    if (resetKey > 0 && widget.current) window.turnstile?.reset(widget.current);
  }, [resetKey]);

  if (!SITE_KEY) return null;
  return <div ref={container} aria-label="Security check" className="min-h-[65px]" />;
}
