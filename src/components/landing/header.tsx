"use client";

import { useState, type MouseEvent } from "react";
import { Responsive } from "@/components/device/responsive";
import { useAnchorScroll } from "./use-anchor-scroll";
import { ScrollTrigger, useGSAP } from "./use-gsap-setup";
import { LandingHeaderDesktop } from "./header.desktop";
import { LandingHeaderMobile } from "./header.mobile";

export interface HeaderViewProps {
  solid: boolean;
  onAnchor: (e: MouseEvent<HTMLAnchorElement>) => void;
}

/** The fixed header: see-through over the hero, solid once scrolled past most of it. */
export function LandingHeader() {
  const [solid, setSolid] = useState(false);
  const onAnchor = useAnchorScroll();

  useGSAP(() => {
    ScrollTrigger.create({
      start: () => window.innerHeight * 0.7,
      end: "max",
      onToggle: (self) => setSolid(self.isActive),
    });
  });

  return (
    <Responsive
      desktop={<LandingHeaderDesktop solid={solid} onAnchor={onAnchor} />}
      mobile={<LandingHeaderMobile solid={solid} onAnchor={onAnchor} />}
    />
  );
}
