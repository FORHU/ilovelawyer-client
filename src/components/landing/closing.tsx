"use client";

import { Responsive } from "@/components/device/responsive";
import { LandingFooterView } from "./closing-parts";
import { ClosingDesktop } from "./closing.desktop";
import { ClosingMobile } from "./closing.mobile";
import { useAnchorScroll } from "./use-anchor-scroll";

/** Trust, questions and the closing call to action. */
export function Closing() {
  return <Responsive desktop={<ClosingDesktop />} mobile={<ClosingMobile />} />;
}

/** On desktop the footer sits still behind the closing section, which scrolls away to reveal it. */
export function LandingFooter() {
  const onAnchor = useAnchorScroll();
  return (
    <Responsive
      desktop={<LandingFooterView onAnchor={onAnchor} className="sticky bottom-0 z-0 px-8" grid="grid-cols-[1.6fr_1fr_1fr_1fr] gap-10" brandClass="" />}
      mobile={<LandingFooterView onAnchor={onAnchor} className="relative px-4" grid="grid-cols-2 gap-x-5 gap-y-8" brandClass="col-span-full" />}
    />
  );
}
