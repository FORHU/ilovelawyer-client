"use client";

import { Responsive } from "@/components/device/responsive";
import type { Case } from "@/lib/types";
import { DocumentsDesktop } from "./overview-docs.desktop";
import { DocumentsMobile } from "./overview-docs.mobile";

// Overview moved to components/case/overview/overview.tsx (#45). This file keeps the Documents
// tab, which Overview's document links switch to (via focusDocumentId below).

export interface DocumentsProps {
  c: Case;
  /** Scrolled into view and selected — a document link from Overview (#45). */
  focusDocumentId?: string | null;
  onFocused?: () => void;
  /** Switches to the Overview tab, from the "Cited in your overview" links. */
  onOpenOverview: () => void;
}

/** The case's files: one view per device, one hook (use-documents). */
export function Documents(props: DocumentsProps) {
  return <Responsive desktop={<DocumentsDesktop {...props} />} mobile={<DocumentsMobile {...props} />} />;
}
