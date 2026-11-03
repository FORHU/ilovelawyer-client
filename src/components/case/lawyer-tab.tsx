"use client";

import { Responsive } from "@/components/device/responsive";
import type { LawyerRequest } from "@/lib/lawyer-requests/api";
import type { Case } from "@/lib/types";
import { LawyerTabDesktop } from "./lawyer-tab.desktop";
import { LawyerTabMobile } from "./lawyer-tab.mobile";

export interface LawyerTabProps {
  c: Case;
  request: LawyerRequest;
}

/** Where the lawyer request stands, the quotes and the conversation: one view per device, one hook
 * (use-lawyer-tab), and the stage cards both share (lawyer-stages). */
export function LawyerTab(props: LawyerTabProps) {
  return <Responsive desktop={<LawyerTabDesktop {...props} />} mobile={<LawyerTabMobile {...props} />} />;
}
