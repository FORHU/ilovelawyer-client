import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveClientTenantCode } from "@/lib/tenant/client-tenant";

// Resolves the client site's Tenant from the request host and hands it to server components as the
// `x-tenant-code` request header (read with getTenantCode()). Presentation context only: the API
// decides which Tenant an account is in. No rewrites, every region renders the same routes.
export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-code", resolveClientTenantCode(request.headers.get("host")));
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|brand/|.*\\.[a-zA-Z0-9]+$).*)"],
};
