import type { Metadata } from "next";
import { Closing, LandingFooter } from "@/components/landing/closing";
import { LandingHeader } from "@/components/landing/header";
import { ScrollRestorer } from "@/components/landing/scroll-restorer";
import { Story } from "@/components/landing/story";

const TITLE = "ilovelawyer: legal trouble, made clear";
const DESCRIPTION =
  "Understand your legal problem, then get a verified UK solicitor. Free cases, pay only for the chat credits you use. AI guidance, not legal advice.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", siteName: "ilovelawyer", locale: "en_GB" },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

export default function LandingPage() {
  return (
    <>
      <LandingHeader />
      <main>
        <Story />
        <Closing />
      </main>
      <LandingFooter />
      <ScrollRestorer />
    </>
  );
}
