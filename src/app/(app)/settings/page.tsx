"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Responsive } from "@/components/device/responsive";
import { SECTIONS, sectionOf } from "@/components/settings/settings-content";
import { SettingsDesktop } from "@/components/settings/settings.desktop";
import { SettingsMobile } from "@/components/settings/settings.mobile";

/** The chosen category is in the URL (`?section=account`), so it survives a device flip, the back
 * button works on a phone, and a category can be linked to. No category shows the phone's list of
 * them, and Account on a desktop, which has no list screen. */
function Settings() {
  const router = useRouter();
  const section = sectionOf(useSearchParams().get("section"));
  return (
    <Responsive
      desktop={<SettingsDesktop section={section ?? SECTIONS[SECTIONS.length - 1]} onSection={(s) => router.replace(`/settings?section=${s.slug}`)} />}
      mobile={<SettingsMobile section={section} />}
    />
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <Settings />
    </Suspense>
  );
}
