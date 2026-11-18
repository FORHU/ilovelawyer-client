"use client";

import { Responsive } from "@/components/device/responsive";
import { useSite } from "@/components/site/site-provider";
import { ComingSoon } from "@/components/site/coming-soon";
import type { Case } from "@/lib/types";
import { ConsultationDesktop } from "./consultation.desktop";
import { ConsultationMobile } from "./consultation.mobile";
import { useConsultation } from "./use-consultation";

/** The case's Interview chat: one conversation (use-consultation, held here so it survives a device
 * flip), a dedicated view per device. */
export function Consultation({ c }: { c: Case }) {
  // A site without its own intake persona has no chat yet (the API refuses CLIENT_AI_NOT_OPEN).
  if (useSite().intakeChat !== "open") return <ComingSoon feature="chat" />;
  return <OpenConsultation c={c} />;
}

function OpenConsultation({ c }: { c: Case }) {
  const consultation = useConsultation(c);
  return <Responsive desktop={<ConsultationDesktop c={c} consultation={consultation} />} mobile={<ConsultationMobile c={c} consultation={consultation} />} />;
}
