import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/legal-page";
import { REFUNDS_SECTIONS } from "@/lib/marketing/copy";

export const metadata: Metadata = {
  title: "Refunds Policy | ilovelawyer",
  description: "When and how ilovelawyer refunds chat credit top-ups.",
};

export default function RefundsPage() {
  return <LegalPage title="Refunds Policy" updated="Last updated: [date]" sections={REFUNDS_SECTIONS} />;
}
