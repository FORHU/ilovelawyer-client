"use client";

import { Responsive } from "@/components/device/responsive";
import { IntakeChatDesktop } from "./intake-chat.desktop";
import { IntakeChatMobile } from "./intake-chat.mobile";
import { useIntakeController, type IntakeChatProps } from "./use-intake-controller";

/** The case-creation chat: one conversation (use-intake-controller, held here so it survives a
 * device flip), a dedicated view per device. */
export function IntakeChat(props: IntakeChatProps) {
  const controller = useIntakeController(props);
  return <Responsive desktop={<IntakeChatDesktop {...props} controller={controller} />} mobile={<IntakeChatMobile {...props} controller={controller} />} />;
}
