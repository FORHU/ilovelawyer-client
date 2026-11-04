"use client";

import { Responsive } from "@/components/device/responsive";
import { HowDesktop } from "./how.desktop";
import { HowMobile } from "./how.mobile";
import { HowStatic } from "./how-static";
import type { StoryScroll } from "./story";
import type { HeroModel } from "./use-hero";
import { useHow } from "./use-how";

export function How({ hero, scroll }: { hero: HeroModel; scroll: StoryScroll }) {
  const model = useHow(hero);
  if (hero.reduced) return <HowStatic />;
  return <Responsive desktop={<HowDesktop model={model} scroll={scroll} />} mobile={<HowMobile model={model} scroll={scroll} />} />;
}
