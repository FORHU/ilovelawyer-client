"use client";

import { Responsive } from "@/components/device/responsive";
import { LawyersListDesktop } from "@/components/lawyers/lawyers-list.desktop";
import { LawyersListMobile } from "@/components/lawyers/lawyers-list.mobile";
import { useLawyersList } from "@/components/lawyers/use-lawyers-list";

/** Find a lawyer: one list (use-lawyers-list, held here so a device flip keeps the search and
 * filters), a dedicated view per device. */
export default function LawyersPage() {
  const v = useLawyersList();
  return <Responsive desktop={<LawyersListDesktop v={v} />} mobile={<LawyersListMobile v={v} />} />;
}
