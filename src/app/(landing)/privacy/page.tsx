import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/legal-page";
import { PRIVACY_SECTIONS } from "@/lib/marketing/copy";

export const metadata: Metadata = {
  title: "Privacy Policy | ilovelawyer",
  description: "How ilovelawyer handles your information, including what you tell the AI.",
};

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" updated="Last updated: [date]" sections={PRIVACY_SECTIONS} />;
}
