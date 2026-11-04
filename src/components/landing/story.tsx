"use client";

import { useState } from "react";
import { Hero } from "./hero";
import { How } from "./how";
import { useHero } from "./use-hero";

/** How far the "How it works" story has scrolled (see lib/marketing/how-timeline). The story writes
 * it and the hero reads it each frame, so it stays out of React state. */
export interface StoryScroll {
  get: () => number;
  set: (d: number) => void;
}

function createStoryScroll(): StoryScroll {
  let d = -1;
  return {
    get: () => d,
    set: (next) => {
      d = next;
    },
  };
}

/** The hero and the story are one continuous piece: the hero's papers fly into the story's phone,
 * and the phone replays the problem chosen in the hero. */
export function Story() {
  const hero = useHero();
  const [scroll] = useState(createStoryScroll);
  return (
    <>
      <Hero model={hero} scroll={scroll} />
      <How hero={hero} scroll={scroll} />
    </>
  );
}
