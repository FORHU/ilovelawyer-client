import { Suspense } from "react";
import { headers } from "next/headers";
import localFont from "next/font/local";
import { DeviceProvider } from "@/components/device/device-provider";
import { ServerSite } from "@/components/site/server-site";
import { deviceFromUserAgent } from "@/lib/device";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./landing.css";

// Only the landing page uses these, so they load here and not in the root layout.
const archivo = localFont({ src: "../fonts/archivo-latin.woff2", variable: "--font-archivo", weight: "100 600" });
const mono = localFont({ src: "../fonts/jetbrains-mono-latin.woff2", variable: "--font-mono", weight: "400 600" });
const caslonItalic = localFont({
  src: "../fonts/libre-caslon-text-italic.woff2",
  variable: "--font-caslon-italic",
  weight: "400",
  style: "italic",
  adjustFontFallback: "Times New Roman",
});

/** The server's guess at the device paints first (ADR 0001), so phones don't flash the desktop tree.
 * The site comes from the host the same way, so a KR visitor never sees the UK page first. */
async function ServerDevice({ children }: { children: React.ReactNode }) {
  const h = await headers();
  return (
    <ServerSite>
      <DeviceProvider initial={deviceFromUserAgent(h.get("user-agent"), h.get("sec-ch-ua-mobile"))}>
        {children}
      </DeviceProvider>
    </ServerSite>
  );
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`landing-root ${archivo.variable} ${mono.variable} ${caslonItalic.variable}`}>
      <Suspense fallback={<div className="min-h-svh bg-black" />}>
        <ServerDevice>{children}</ServerDevice>
      </Suspense>
    </div>
  );
}
