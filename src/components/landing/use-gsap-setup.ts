"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// The one place the landing page registers GSAP's plugins. Import gsap from here, so the plugins
// are always registered and GSAP stays out of every other route's bundle.
gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollToPlugin, CustomEase);

// The phone's address bar showing and hiding shouldn't re-measure every trigger mid-scroll.
ScrollTrigger.config({ ignoreMobileResize: true });

// The design's easings: cubic-bezier(.16,1,.3,1) in, cubic-bezier(.7,0,.84,0) out.
CustomEase.create("landingRise", "M0,0 C0.16,1 0.3,1 1,1");
CustomEase.create("landingLeave", "M0,0 C0.7,0 0.84,0 1,1");

export { gsap, useGSAP, ScrollTrigger };
