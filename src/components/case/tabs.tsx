"use client";

import { Responsive } from "@/components/device/responsive";
import { TabsDesktop } from "./tabs.desktop";
import { TabsMobile } from "./tabs.mobile";

export interface TabDef {
  id: string;
  label: string;
  dot?: boolean;
  /** A count beside the label, e.g. how many documents. */
  count?: number;
  /** A short status beside the label, e.g. "Finding a lawyer". */
  status?: { text: string; tone: "warn" | "error" | "success" };
}

export interface TabsProps {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs(props: TabsProps) {
  return <Responsive desktop={<TabsDesktop {...props} />} mobile={<TabsMobile {...props} />} />;
}
