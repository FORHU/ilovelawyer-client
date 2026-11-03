"use client";

import { Responsive } from "@/components/device/responsive";
import { IntakeChatDesktop } from "./intake-chat.desktop";
import { IntakeChatMobile } from "./intake-chat.mobile";
import type { IntakeChatProps } from "./use-intake-controller";

/** The case-creation chat: one conversation (use-intake-controller), a dedicated view per device. */
export function IntakeChat(props: IntakeChatProps) {
  return <Responsive desktop={<IntakeChatDesktop {...props} />} mobile={<IntakeChatMobile {...props} />} />;
}
