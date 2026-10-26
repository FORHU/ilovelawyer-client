import type { NextRequest } from "next/server";
import { API_URL } from "@/lib/api/config";
import { buildFileResponseInit, resolveErrorStatus } from "./response";

const RESOLVE_TIMEOUT_MS = 5_000;

// Bounds only the time to get a response (headers) from S3 — cleared as soon as fetch() settles,
// so it never cuts off the download of a large file.
export const UPSTREAM_FETCH_TIMEOUT_MS = 10_000;

/** Who is opening the file, for the API's file.accessed security audit row — without these the
 * API would record this server's own address and Node's user agent. Only the last X-Forwarded-For
 * hop is passed on: that's the one the proxy in front of this app added. */
function viewerHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  const userAgent = req.headers.get("user-agent");
  if (userAgent) headers["user-agent"] = userAgent;
  const lastHop = req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  if (lastHop) headers["x-forwarded-for"] = lastHop;
  return headers;
}

/** Opens a /files/<token> link the API hands out (GET /api/client/cases/:id/documents/:docId/url):
 * resolves the token against the API and streams the file back same-origin, so the browser never
 * sees an S3 host, bucket or signature. The token is the only auth — a new tab can't carry the
 * app's Bearer access token. Mirrors ilovelawyer-app's app/files/[token]/route.ts. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let presignedUrl: string;
  try {
    const resolveRes = await fetch(`${API_URL}/api/files/resolve?token=${encodeURIComponent(token)}`, {
      signal: AbortSignal.timeout(RESOLVE_TIMEOUT_MS),
      headers: viewerHeaders(req),
    });
    if (!resolveRes.ok) return new Response(null, { status: resolveErrorStatus(resolveRes.status) });
    ({ url: presignedUrl } = await resolveRes.json());
  } catch (err) {
    console.error("files/[token]: resolve call failed", err);
    return new Response(null, { status: 404 });
  }

  const range = req.headers.get("range");
  const upstreamController = new AbortController();
  const upstreamTimeout = setTimeout(() => upstreamController.abort(), UPSTREAM_FETCH_TIMEOUT_MS);
  let upstream: Response;
  try {
    upstream = await fetch(presignedUrl, { ...(range ? { headers: { range } } : {}), signal: upstreamController.signal });
  } catch (err) {
    console.error("files/[token]: upstream fetch failed", err);
    return new Response(null, { status: 404 });
  } finally {
    clearTimeout(upstreamTimeout);
  }

  const init = buildFileResponseInit(upstream);
  if (!init) return new Response(null, { status: 404 });

  return new Response(upstream.body, init);
}
