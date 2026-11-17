// Pure decision logic pulled out of route.ts so it can be tested without a request/response
// harness (vitest here runs pure-function tests only). Same rules as ilovelawyer-app's
// app/files/[token]/response.ts.

// Lives here because a route file may only export route handlers and route config; Next's build
// type check rejects anything else.
// Bounds only the time to get a response (headers) from S3 — cleared as soon as fetch() settles,
// so it never cuts off the download of a large file.
export const UPSTREAM_FETCH_TIMEOUT_MS = 10_000;

/** Where this server calls GET /api/files/resolve. A build with an empty API_URL (deployed dev: the
 * browser reaches the API through this app's own domain, whose /api/* Caddy sends to the API) has
 * no host for a server-side fetch, which can't take a relative URL — so it calls back through the
 * domain the request came in on. That origin comes from the Host header, which is only safe because
 * the container listens on 127.0.0.1 and Caddy only forwards this app's own hostnames to it. */
export function resolveEndpoint(apiUrl: string, requestOrigin: string): string {
  return `${apiUrl || requestOrigin}/api/files/resolve`;
}

/** Maps a GET /api/files/resolve failure onto what the browser sees. 410 (token expired or
 * revoked, per the API) passes through; everything else — bad token, network error, API down —
 * collapses to a generic 404 so nothing about the failure reason leaks. */
export function resolveErrorStatus(resolveStatus: number): number {
  return resolveStatus === 410 ? 410 : 404;
}

// Headers safe to mirror from the upstream S3 response onto ours. Everything else (esp. any
// S3/CloudFront-identifying header, e.g. x-amz-*, Server: AmazonS3) is dropped.
const PASSTHROUGH_HEADERS = ["content-type", "content-length", "content-disposition", "content-range", "accept-ranges"];

export interface UpstreamLike {
  ok: boolean;
  status: number;
  headers: Headers;
}

/** This route's own status and headers from the upstream S3 fetch, or null when the caller should
 * 404 instead (upstream failed and it wasn't a Range 206). */
export function buildFileResponseInit(upstream: UpstreamLike): { status: number; headers: Headers } | null {
  if (!upstream.ok && upstream.status !== 206) return null;

  const headers = new Headers();
  for (const name of PASSTHROUGH_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("Cache-Control", "private, no-store");

  return { status: upstream.status, headers };
}
