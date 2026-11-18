import Link from "next/link";
import { HowFrame } from "./how-frame";
import { useLandingContent } from "./landing-content";
import type { StoryScroll } from "./story";
import type { HowModel } from "./use-how";

const TITLE = "font-archivo m-0 text-[34px] font-[250] leading-none tracking-[-0.045em] text-balance";

export function HowMobile({ model, scroll }: { model: HowModel; scroll: StoryScroll }) {
  const { how } = useLandingContent();
  return (
    <HowFrame
      model={model}
      scroll={scroll}
      mob
      headingClass="top-[76px] text-[28px]"
      overHeadingClass="top-[76px] bottom-[128px] text-[28px]"
      intro={
        <>
          <h2 data-how="l" className={`${TITLE} pointer-events-none absolute inset-x-4 top-[78px] z-10 text-center text-white opacity-0`}>
            {how.intro.left}
          </h2>
          <div data-how="r" className="absolute inset-x-4 bottom-[22px] z-10 flex flex-col items-center gap-3.5 text-white opacity-0">
            <p aria-hidden className={TITLE}>
              {how.intro.right}
            </p>
            <Link
              href="/signup"
              data-btn
              className="inline-flex min-h-[50px] items-center rounded-full bg-white px-[26px] py-3.5 text-[16px] font-medium text-[#0c0c0e]!"
            >
              {how.cta}
            </Link>
          </div>
        </>
      }
    />
  );
}
