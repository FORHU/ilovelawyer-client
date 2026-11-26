import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Welcome } from "@/components/onboarding/welcome";
import { siteForHost } from "@/lib/tenant/resolve-host";
import { SITES } from "@/lib/tenant/sites";

/** The new-client flow's Welcome. A site without the story-first way in (PH) goes straight to the
 * ordinary sign-up. */
export default async function StartPage() {
  const h = await headers();
  if (SITES[siteForHost(h.get("x-forwarded-host") ?? h.get("host"))].storyIntake !== "open") redirect("/login?tab=signup");
  return <Welcome />;
}
