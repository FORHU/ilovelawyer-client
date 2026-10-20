import { useSession } from "@/lib/auth/session";
import { API_URL, COOKIE_PATHS } from "./config";

/** A failed API call. `status` is 0 when the API couldn't be reached at all. `code` is the API's
 * optional machine-readable reason (e.g. WRONG_APP), absent on most errors. */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const COOKIE_PATH_SET = new Set<string>(COOKIE_PATHS);

// Cookie paths go same-origin through next.config.ts's rewrite; everything else straight to the API.
function resolveUrl(path: string): string {
  return COOKIE_PATH_SET.has(path) ? path : `${API_URL}${path}`;
}

function buildHeaders(extra?: HeadersInit): Record<string, string> {
  const { accessToken } = useSession.getState();
  return {
    "Content-Type": "application/json",
    // Tells the API this is the client app: a new account is created as a USER, and a lawyer
    // account is refused here (409 WRONG_APP). Without it the API treats the call as the lawyer
    // app, so every request must carry it.
    "X-Client-App": "user",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(extra as Record<string, string> | undefined),
  };
}

/** Non-httpOnly companion of the refresh cookie (a bare "1" flag). Lets a page skip a refresh
 * that's bound to fail when no session cookie can exist, e.g. a first visit to /login. */
export function hasSessionHint(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c === "hasSession=1");
}

let refreshPromise: Promise<string> | null = null;

async function redeemRefreshCookie(): Promise<string> {
  const res = await fetch(resolveUrl("/api/auth/refresh"), {
    method: "POST",
    credentials: "include",
    headers: buildHeaders(),
  });
  if (!res.ok) throw new ApiError("Your session has ended. Sign in again.", res.status);
  const { accessToken } = (await res.json()) as { accessToken: string };
  useSession.getState().setAccessToken(accessToken);
  return accessToken;
}

/** The refresh token is single-use: the API rotates it on every refresh. Concurrent callers share
 * one in-flight request, and a Web Lock serializes tabs, so a second redemption never sends a
 * cookie the first one already spent. */
export function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  const redeemed = locks
    ? (locks.request("ilovelawyer-client-auth-refresh", redeemRefreshCookie) as unknown as Promise<string>)
    : redeemRefreshCookie();
  refreshPromise = redeemed.finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

type FetchOptions = Omit<RequestInit, "credentials"> & {
  /** For the auth calls themselves: a 401 there is an answer, not an expired access token. */
  skipAuthRefresh?: boolean;
};

async function send(path: string, options: FetchOptions): Promise<Response> {
  const { skipAuthRefresh, headers, ...init } = options;
  void skipAuthRefresh; // apiFetch's own option, not a fetch() one
  try {
    return await fetch(resolveUrl(path), { ...init, credentials: "include", headers: buildHeaders(headers) });
  } catch {
    throw new ApiError("Couldn't reach ilovelawyer. Check your connection and try again.", 0);
  }
}

async function throwIfNotOk(res: Response): Promise<void> {
  if (res.ok) return;
  const body = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
  const message = res.status >= 500 ? "Something went wrong on our side. Try again in a moment." : (body.message ?? "Request failed");
  throw new ApiError(message, res.status, body.code);
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  let res = await send(path, options);

  if (res.status === 401 && !options.skipAuthRefresh) {
    try {
      await refreshAccessToken();
    } catch (err) {
      useSession.getState().clear();
      throw err;
    }
    res = await send(path, options);
  }

  await throwIfNotOk(res);
  // 204s have no body; res.json() would throw on the empty string.
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
