import { Suspense } from "react";
import { ServerSite } from "@/components/site/server-site";

/** Sign-in, sign-up and password pages: the site and language come from the request, so a KR
 * visitor's first paint is already the KR site in Korean (see ServerSite). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ServerSite>{children}</ServerSite>
    </Suspense>
  );
}
