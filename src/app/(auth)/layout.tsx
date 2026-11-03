import { Suspense } from "react";
import { headers } from "next/headers";
import { DeviceProvider } from "@/components/device/device-provider";
import { deviceFromUserAgent } from "@/lib/device";

/** The auth pages are server-rendered, so the UA picks the first-paint tree here (the (app)
 * layout has no server paint and reads the viewport instead). `headers()` is request-time data,
 * hence the Suspense boundary under cacheComponents. */
async function RequestDevice({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const initial = deviceFromUserAgent(h.get("user-agent"), h.get("sec-ch-ua-mobile"));
  return <DeviceProvider initial={initial}>{children}</DeviceProvider>;
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <RequestDevice>{children}</RequestDevice>
    </Suspense>
  );
}
