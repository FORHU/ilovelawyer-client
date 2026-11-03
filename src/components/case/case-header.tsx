"use client";

import { Responsive } from "@/components/device/responsive";
import type { Case } from "@/lib/types";
import { CaseHeaderDesktop } from "./case-header.desktop";
import { CaseHeaderMobile } from "./case-header.mobile";

export function CaseHeader({ c }: { c: Case }) {
  return <Responsive desktop={<CaseHeaderDesktop c={c} />} mobile={<CaseHeaderMobile c={c} />} />;
}
