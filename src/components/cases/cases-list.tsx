"use client";

import { Responsive } from "@/components/device/responsive";
import { CasesListDesktop } from "./cases-list.desktop";
import { CasesListMobile } from "./cases-list.mobile";

/** The cases list: one set of data and rules (use-cases-list), a dedicated view per device. */
export function CasesList() {
  return <Responsive desktop={<CasesListDesktop />} mobile={<CasesListMobile />} />;
}
