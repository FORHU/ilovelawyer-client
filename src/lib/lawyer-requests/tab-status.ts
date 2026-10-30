import type { ClientRequestStatus } from "@/lib/client-handoff";

export type TabStatusTone = "warn" | "error" | "success";

/** The short status pill on the Lawyer tab: what to look at, in a few words. A quote waiting on the
 * client, or no lawyer found, is the one that needs them, so it reads as an alert. */
export function lawyerTabStatus(status: ClientRequestStatus, lawyerFirstName?: string | null): { text: string; tone: TabStatusTone } {
  switch (status) {
    case "REQUESTED":
      return { text: "Sending request", tone: "warn" };
    case "ROUTED":
      return { text: "Finding a lawyer", tone: "warn" };
    case "CLAIMED":
      return { text: "Lawyer reviewing", tone: "warn" };
    case "QUOTED":
      return { text: "Quote to review", tone: "error" };
    case "CONFIRMED":
      return { text: "Finalising", tone: "warn" };
    case "ENGAGED":
      return { text: lawyerFirstName ? `Working with ${lawyerFirstName}` : "Working with your lawyer", tone: "success" };
    case "CLOSED":
      return { text: "Closed", tone: "warn" };
    case "EXPIRED":
      return { text: "No lawyer found", tone: "error" };
    case "WITHDRAWN":
      return { text: "Withdrawn", tone: "warn" };
  }
}
