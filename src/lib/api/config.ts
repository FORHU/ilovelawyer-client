// Shared by src/lib/api/fetch.ts (runtime requests) and next.config.ts (rewrites(), which runs at
// config-load time and can't import fetch.ts — that pulls in the zustand session store). Kept
// dependency-free so both can import it.

/** ilovelawyer-api's origin. Inlined at build time by Next (NEXT_PUBLIC_*), so set it in .env.local. */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/$/, "");

/** The auth endpoints that set or read the refreshToken httpOnly cookie. They're proxied
 * same-origin through next.config.ts's rewrites(), so the cookie lands on the client's own host
 * — set by a direct cross-origin call, it would belong to the API's host and the client's
 * /api/auth/refresh on page load would never see it. Every other call goes to the API directly. */
export const COOKIE_PATHS = [
  "/api/auth/login",
  "/api/auth/verify-otp",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/auth/reset-password",
] as const;
