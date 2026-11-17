"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_CLIENT_TENANT_CODE, resolveClientTenantCode, type TenantCode } from "./client-tenant";

const subscribe = () => () => {};

/** The Tenant of the site the browser is on. The host can't change while the page is open, so there
 * is nothing to subscribe to; the server snapshot is the default region, which React swaps for the
 * real one right after hydration instead of flagging a mismatch. */
export function useTenantCode(): TenantCode {
  return useSyncExternalStore(
    subscribe,
    () => resolveClientTenantCode(window.location.host),
    () => DEFAULT_CLIENT_TENANT_CODE,
  );
}
