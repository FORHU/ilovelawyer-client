"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { MOBILE_QUERY, type DeviceClass } from "@/lib/device";

const DeviceContext = createContext<DeviceClass>("desktop");

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const readClient = (): DeviceClass => (window.matchMedia(MOBILE_QUERY).matches ? "mobile" : "desktop");

/** Which component tree to render. `initial` is the server's guess (the UA, see lib/device.ts):
 * it paints first, then the real viewport width takes over, so a resize, a rotation or a wrong
 * guess flips the tree with no reload. Without `initial` (the signed-in app, which paints nothing
 * until the client has hydrated) it is just the viewport. */
export function DeviceProvider({ initial = "desktop", children }: { initial?: DeviceClass; children: ReactNode }) {
  const device = useSyncExternalStore(subscribe, readClient, () => initial);
  return <DeviceContext.Provider value={device}>{children}</DeviceContext.Provider>;
}

export function useDevice(): DeviceClass {
  return useContext(DeviceContext);
}
