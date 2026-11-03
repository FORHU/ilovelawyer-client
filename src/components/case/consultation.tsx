"use client";

import { Responsive } from "@/components/device/responsive";
import type { Case } from "@/lib/types";
import { ConsultationDesktop } from "./consultation.desktop";
import { ConsultationMobile } from "./consultation.mobile";

/** The case's Interview chat: one conversation (use-consultation), a dedicated view per device. */
export function Consultation({ c }: { c: Case }) {
  return <Responsive desktop={<ConsultationDesktop c={c} />} mobile={<ConsultationMobile c={c} />} />;
}
