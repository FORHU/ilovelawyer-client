"use client";

import { Responsive } from "@/components/device/responsive";
import type { Case } from "@/lib/types";
import { ConsultationDesktop } from "./consultation.desktop";
import { ConsultationMobile } from "./consultation.mobile";
import { useConsultation } from "./use-consultation";

/** The case's Interview chat: one conversation (use-consultation, held here so it survives a device
 * flip), a dedicated view per device. */
export function Consultation({ c }: { c: Case }) {
  const consultation = useConsultation(c);
  return <Responsive desktop={<ConsultationDesktop c={c} consultation={consultation} />} mobile={<ConsultationMobile c={c} consultation={consultation} />} />;
}
