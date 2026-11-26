import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { siteForHost } from "@/lib/tenant/resolve-host";
import { SITES } from "@/lib/tenant/sites";

// Sign up lives as a tab on the unified /login page; this route keeps /signup links working. On a
// site with the story-first way in, every "sign up" link (the landing page's buttons among them)
// starts at the new-client Welcome instead, which leads on to the same tab.
export default async function SignupRedirect() {
  const h = await headers();
  const site = SITES[siteForHost(h.get("x-forwarded-host") ?? h.get("host"))];
  redirect(site.storyIntake === "open" ? "/start" : "/login?tab=signup");
}
