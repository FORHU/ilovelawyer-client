import Link from "next/link";
import { HowFrame } from "./how-frame";
import { HOW_INTRO } from "./how-intro";
import type { StoryScroll } from "./story";
import type { HowModel } from "./use-how";

// A transform, because the scroll motion owns these elements' `translate`.
const CENTRED = { transform: "translateY(-50%)" };
const TITLE = "font-archivo m-0 text-[clamp(40px,5vw,84px)] font-[250] leading-none tracking-[-0.045em] text-balance";

export function HowDesktop({ model, scroll }: { model: HowModel; scroll: StoryScroll }) {
  return (
    <HowFrame
      model={model}
      scroll={scroll}
      mob={false}
      headingClass="top-[92px] text-[clamp(30px,3.6vw,58px)]"
      overHeadingClass="bottom-[128px] text-[clamp(30px,3.6vw,58px)]"
      intro={
        <>
          <h2
            data-how="l"
            className={`${TITLE} pointer-events-none absolute right-[calc(50%+200px)] top-1/2 z-10 max-w-[calc(50%-240px)] text-right text-white opacity-0`}
            style={CENTRED}
          >
            {HOW_INTRO.left}
          </h2>
          <div data-how="r" className="absolute left-[calc(50%+200px)] top-1/2 z-10 flex max-w-[calc(50%-240px)] flex-col items-start gap-[22px] text-white opacity-0" style={CENTRED}>
            <p aria-hidden className={TITLE}>
              {HOW_INTRO.right}
            </p>
            <p className="m-0 max-w-[34ch] text-pretty text-[17px] leading-normal text-white/86">{HOW_INTRO.sub}</p>
            <Link
              href="/signup"
              data-btn
              className="inline-flex min-h-[50px] items-center rounded-full bg-white px-[26px] py-3.5 text-[16px] font-medium text-[#0c0c0e]! transition-opacity duration-160 hover:opacity-85"
            >
              Start your case
            </Link>
          </div>
        </>
      }
    />
  );
}
