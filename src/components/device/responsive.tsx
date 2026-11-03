"use client";

import type { ReactNode } from "react";
import { useDevice } from "./device-provider";

/** Renders one of two dedicated trees, never both. Pass elements, not components, so only the
 * chosen one is ever mounted by its parent: `<Responsive desktop={<X.Desktop/>} mobile={<X.Mobile/>} />`. */
export function Responsive({ desktop, mobile }: { desktop: ReactNode; mobile: ReactNode }) {
  return useDevice() === "mobile" ? mobile : desktop;
}
