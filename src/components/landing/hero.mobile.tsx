import { HeroFrame } from "./hero-frame";
import type { StoryScroll } from "./story";
import type { HeroModel } from "./use-hero";

const OVERLAY = "radial-gradient(ellipse 70% 30% at 50% 68%, rgba(5,4,3,.72) 0%, rgba(5,4,3,.5) 50%, rgba(5,4,3,0) 100%)";

export function HeroMobile({ model, scroll }: { model: HeroModel; scroll: StoryScroll }) {
  return (
    <HeroFrame
      model={model}
      scroll={scroll}
      mob
      overlay={OVERLAY}
      selectedWidth={240}
      copyStyle={{ left: "50%", top: "50%", transform: "translate(-50%, 0)", width: "min(440px, 90vw)" }}
    />
  );
}
