"use client";

import { useRef } from "react";
import { ClosingCta, FaqSection, TrustSection, useReveals } from "./closing-parts";

const SHADE = "linear-gradient(0deg, rgba(0,0,0,.66) 0%, rgba(0,0,0,.4) 42%, rgba(0,0,0,0) 60%)";

export function ClosingMobile() {
  const root = useRef<HTMLDivElement>(null);
  useReveals(root);
  return (
    <div ref={root}>
      <TrustSection sidePad="px-4" />
      <FaqSection sidePad="px-4" grid="grid-cols-1 gap-6" />
      <ClosingCta mob shade={SHADE} copyClass="items-center justify-end text-center" copyStyle={{ padding: "0 20px 12vh" }} />
    </div>
  );
}
