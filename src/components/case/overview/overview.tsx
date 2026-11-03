"use client";

import { Responsive } from "@/components/device/responsive";
import type { Case } from "@/lib/types";
import { OverviewDesktop } from "./overview.desktop";
import { OverviewMobile } from "./overview.mobile";

export interface OverviewProps {
  c: Case;
  onOpenDocument: (documentId: string) => void;
  onOpenChat: () => void;
}

/** What the AI has gathered about the case: one view per device, one hook (use-overview). */
export function Overview(props: OverviewProps) {
  return <Responsive desktop={<OverviewDesktop {...props} />} mobile={<OverviewMobile {...props} />} />;
}
