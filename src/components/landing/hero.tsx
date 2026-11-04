"use client";

import { Responsive } from "@/components/device/responsive";
import { HeroDesktop } from "./hero.desktop";
import { HeroMobile } from "./hero.mobile";
import type { StoryScroll } from "./story";
import type { HeroModel } from "./use-hero";

/** The hero: one model (use-hero), so the selection survives a rotation, and a view per device. */
export function Hero({ model, scroll }: { model: HeroModel; scroll: StoryScroll }) {
  return <Responsive desktop={<HeroDesktop model={model} scroll={scroll} />} mobile={<HeroMobile model={model} scroll={scroll} />} />;
}
