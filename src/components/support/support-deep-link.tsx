"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSupport } from "@/lib/support/store";

// The email telling a client the support team has replied links to /?support=open.

/** In the signed-in app: `?support=open` opens the Support Chat, then the parameter goes, so a
 * reload doesn't open it again. */
export function SupportDeepLink() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const wanted = params.get("support") === "open";

  useEffect(() => {
    if (!wanted) return;
    useSupport.getState().openSupport({ audience: "SIGNED_IN" });
    const rest = new URLSearchParams(params.toString());
    rest.delete("support");
    const query = rest.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [wanted, params, pathname, router]);

  return null;
}

/** On the landing page, which is where the email's link points: carry the request into the app. A
 * visitor who isn't signed in is sent on to sign in by the app itself. */
export function SupportLinkRedirect() {
  const router = useRouter();
  const wanted = useSearchParams().get("support") === "open";

  useEffect(() => {
    if (wanted) router.replace("/cases?support=open");
  }, [wanted, router]);

  return null;
}
