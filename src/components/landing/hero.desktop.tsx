import { HeroFrame } from "./hero-frame";
import type { StoryScroll } from "./story";
import type { HeroModel } from "./use-hero";

const OVERLAY = "radial-gradient(ellipse 17% 40% at 50% 50%, rgba(5,4,3,.66) 0%, rgba(5,4,3,.5) 45%, rgba(5,4,3,.18) 78%, rgba(5,4,3,0) 100%)";

export function HeroDesktop({ model, scroll }: { model: HeroModel; scroll: StoryScroll }) {
  return (
    <HeroFrame
      model={model}
      scroll={scroll}
      mob={false}
      overlay={OVERLAY}
      selectedWidth={360}
      copyStyle={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: "clamp(340px, 30vw, 520px)" }}
    />
  );
}
