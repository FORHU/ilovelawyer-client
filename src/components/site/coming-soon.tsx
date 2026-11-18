"use client";

import { Clock } from "lucide-react";
import { useSite } from "./site-provider";
import { useT } from "./language-provider";

/** What a site shows where a feature that isn't open there yet would be (lib/tenant/sites.ts):
 * the AI chat, or finding a lawyer. */
export function ComingSoon({ feature }: { feature: "chat" | "lawyers" }) {
  const { country } = useSite();
  const t = useT();
  const where = t(country);
  const copy =
    feature === "chat"
      ? {
          title: t("The AI chat is coming soon"),
          body: t("We're preparing an AI that knows the law in {country}. Until then, keep your case's details and documents here, and they'll be ready when it opens.", { country: where }),
        }
      : {
          title: t("Lawyers are coming soon"),
          body: t("You'll be able to find and hire a verified lawyer in {country} here. Keep your case's details and documents up to date, and they'll be ready to share.", { country: where }),
        };
  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-subtle text-ink-2">
        <Clock size={20} aria-hidden="true" />
      </span>
      <h2 className="font-display text-[22px] tracking-[-0.02em]">{copy.title}</h2>
      <p className="text-[14px] leading-[1.6] text-ink-2">{copy.body}</p>
    </div>
  );
}
