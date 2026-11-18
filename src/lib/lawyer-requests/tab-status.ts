import type { ClientRequestStatus } from "@/lib/client-handoff";
import { tr } from "@/lib/i18n/translate";

export type TabStatusTone = "warn" | "error" | "success";

/** The short status pill on the Lawyer tab: what to look at, in a few words. A quote waiting on the
 * client, or no lawyer found, is the one that needs them, so it reads as an alert. */
export function lawyerTabStatus(status: ClientRequestStatus, lawyerFirstName?: string | null): { text: string; tone: TabStatusTone } {
  switch (status) {
    case "REQUESTED":
      return { text: tr("Sending request"), tone: "warn" };
    case "ROUTED":
      return { text: tr("Finding a lawyer"), tone: "warn" };
    case "CLAIMED":
      return { text: tr("Lawyer reviewing"), tone: "warn" };
    case "QUOTED":
      return { text: tr("Quote to review"), tone: "error" };
    case "CONFIRMED":
      return { text: tr("Finalising"), tone: "warn" };
    case "ENGAGED":
      return { text: lawyerFirstName ? tr("Working with {name}", { name: lawyerFirstName }) : tr("Working with your lawyer"), tone: "success" };
    case "CLOSED":
      return { text: tr("Closed"), tone: "warn" };
    case "EXPIRED":
      return { text: tr("No lawyer found"), tone: "error" };
    case "WITHDRAWN":
      return { text: tr("Withdrawn"), tone: "warn" };
  }
}
