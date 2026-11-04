"use client";

import { useRef } from "react";
import { ClosingCta, FaqSection, TrustSection, useReveals } from "./closing-parts";

const SHADE = "linear-gradient(90deg, rgba(0,0,0,.66) 0%, rgba(0,0,0,.42) 34%, rgba(0,0,0,.1) 50%, rgba(0,0,0,0) 58%)";

export function ClosingDesktop() {
  const root = useRef<HTMLDivElement>(null);
  useReveals(root);
  return (
    <div ref={root}>
      <TrustSection sidePad="px-8" />
      <FaqSection sidePad="px-8" grid="grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-12" />
      <ClosingCta mob={false} shade={SHADE} copyClass="items-start justify-center text-left" copyStyle={{ padding: "0 6vw" }} />
    </div>
  );
}
