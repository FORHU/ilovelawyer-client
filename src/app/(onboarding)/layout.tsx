import { Suspense } from "react";
import { ServerSite } from "@/components/site/server-site";

/** The new-client flow's own pages (Welcome, the privacy step): no app shell around them, and the
 * site and language from the request, so a KR visitor's first paint is already Korean. */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-page" />}>
      <ServerSite>{children}</ServerSite>
    </Suspense>
  );
}
