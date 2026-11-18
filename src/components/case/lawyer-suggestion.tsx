"use client";

import { useRouter } from "next/navigation";
import { Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDevice } from "@/components/device/device-provider";
import { cn } from "@/lib/cn";
import { useCaseQuery } from "@/lib/cases/queries";
import { lawyerKind, useLawyerReadinessQuery } from "@/lib/cases/readiness";
import { firstName } from "@/lib/format";
import { useLawyerRequestForm } from "@/lib/lawyer-requests/api";
import { chosenLawyerFit, useChosenLawyer } from "@/lib/lawyers/chosen-lawyer";
import { useMarketplaceCase } from "@/lib/lawyers/marketplace";
import { areasLabel } from "@/lib/types";

import { useT } from "@/components/site/language-provider";
/**
 * Under the chat, after the AI's latest answer: suggests a lawyer once the case has what a lawyer
 * needs (checked by the API, see lib/cases/readiness.ts), and until then shows what's still
 * missing, so it's never a mystery why we haven't. With the check switched off on the API, offers a
 * lawyer as before. With a lawyer chosen first (Find a lawyer, lib/lawyers/chosen-lawyer.ts), it
 * offers that lawyer by name, or says why they don't take this case and offers a match instead.
 *
 * On a phone the card is full width with a full-width button under its text; on desktop it lines
 * up with the AI's text, past the avatar, with the button beside it.
 */
export function LawyerSuggestion({ caseId, latestAnswerId }: { caseId: string; latestAnswerId: string }) {
  const t = useT();
  const mobile = useDevice() === "mobile";
  const openForm = () => useLawyerRequestForm.getState().openFor(caseId);
  const { data: r } = useLawyerReadinessQuery(caseId, latestAnswerId);
  const { data: theCase } = useCaseQuery(caseId);
  const chosen = useChosenLawyer((s) => s.byCase[caseId] ?? null);
  const router = useRouter();
  const chosenName = chosen ? (firstName(chosen.name) ?? chosen.name) : null;
  const pickAnother = () => {
    useMarketplaceCase.getState().set(caseId);
    useChosenLawyer.getState().forget(caseId);
    router.push("/lawyers");
  };

  // Desktop lines up with the AI's text; on a phone everything is full width.
  const indent = mobile ? "" : "ml-[38px]";
  const card = cn(
    "rounded-card border border-line bg-subtle",
    mobile ? "flex flex-col gap-3 p-4" : `${indent} flex flex-wrap items-center gap-4 px-[18px] py-4`,
  );
  const action = (
    <Button size={mobile ? "lg" : "sm"} className={mobile ? "w-full" : undefined} onClick={openForm}>
      {t("Get a lawyer")}
    </Button>
  );

  if (!r || r.unavailable) return null;

  // The case is ready (or the check is off) and the client chose a lawyer first: them by name if
  // they take it, else why not. Until the case's area is known, it's offered and the API checks.
  if (chosen && chosenName && !r.blockedBy && (!r.enabled || r.ready)) {
    const fit = theCase ? chosenLawyerFit(chosen, theCase) : "unknown";
    if (fit === "mismatch" && theCase) {
      return (
        <div className={card}>
          <div className={mobile ? undefined : "min-w-[200px] flex-1"}>
            <div className="text-sm font-semibold">{t("{name} doesn't take cases like this one", { name: chosenName })}</div>
            <div className="text-[13px] leading-[1.45] text-ink-2">
              {t("Your case is about {area} in {place}, which {name} doesn't handle. We can match you with verified lawyers who do, or you can pick someone else.", {
                area: areasLabel(theCase.areas) || t("this type of issue"),
                place: theCase.ukJurisdiction ?? "",
                name: chosenName,
              })}
            </div>
          </div>
          <div className={cn("flex gap-2", mobile && "flex-col")}>
            <Button size={mobile ? "lg" : "sm"} className={mobile ? "w-full" : undefined} onClick={openForm}>
              {t("Let us match me")}
            </Button>
            <Button variant="soft" size={mobile ? "lg" : "sm"} className={mobile ? "w-full" : undefined} onClick={pickAnother}>
              {t("Pick another lawyer")}
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className={card}>
        <div className={mobile ? undefined : "min-w-[200px] flex-1"}>
          <div className="text-sm font-semibold">{t("Your case is ready for {name}", { name: chosenName })}</div>
          <div className="text-[13px] leading-[1.45] text-ink-2">
            {t("Only {name} sees it at first. If they can't take it up within 24 hours, it goes to other verified lawyers who match.", { name: chosenName })}
          </div>
        </div>
        <div className={cn("flex gap-2", mobile && "flex-col")}>
          <Button
            size={mobile ? "lg" : "sm"}
            className={mobile ? "w-full" : undefined}
            onClick={() => useLawyerRequestForm.getState().openFor(caseId, { id: chosen.id, name: chosen.name })}
          >
            {t("Request {name}", { name: chosenName })}
          </Button>
          <Button variant="soft" size={mobile ? "lg" : "sm"} className={mobile ? "w-full" : undefined} onClick={openForm}>
            {t("Let us match me instead")}
          </Button>
        </div>
      </div>
    );
  }

  if (!r.enabled) {
    return (
      <div className={card}>
        <div className={mobile ? undefined : "min-w-[200px] flex-1"}>
          <div className="text-sm font-semibold">{t("Want a lawyer to look at this case?")}</div>
          <div className="text-[13px] leading-[1.45] text-ink-2">{t("A verified lawyer reviews this case and your chat. Included with your case.")}</div>
        </div>
        {action}
      </div>
    );
  }

  if (r.blockedBy) {
    return (
      <div className={cn(indent, "text-[13px] leading-[1.45] text-ink-2")}>
        {r.blockedBy === "OUTSIDE_UK"
          ? t("Lawyers are only available for cases in the UK for now. You can keep asking the AI about it.")
          : t("We can't connect personal injury cases with a lawyer yet. You can keep asking the AI about it.")}
      </div>
    );
  }

  if (r.ready) {
    return (
      <div className={card}>
        <div className={mobile ? undefined : "min-w-[200px] flex-1"}>
          <div className="text-sm font-semibold">{t("Your case has what a lawyer needs")}</div>
          <div className="text-[13px] leading-[1.45] text-ink-2">
            {t("We'd look for {who}. A verified lawyer reviews this case and your chat.", { who: lawyerKind(r) })}
          </div>
        </div>
        {action}
      </div>
    );
  }

  const missing = r.criteria.filter((c) => !c.met);
  return (
    <div className={cn(indent, "flex flex-col gap-2 rounded-card border border-dashed border-line py-3.5", mobile ? "px-4" : "px-[18px]")}>
      <div className="text-[13px] font-semibold">
        {missing.length === 1 ? t("To suggest the right lawyer, tell me a little more about this:") : t("To suggest the right lawyer, tell me a little more about these:")}
      </div>
      <ul className="flex flex-col gap-1">
        {r.criteria.map((c) => (
          <li key={c.key} className={`flex items-center gap-2 text-[13px] ${c.met ? "text-muted" : "text-ink"}`}>
            {c.met ? <Check size={13} className="text-success" /> : <Circle size={11} className="text-muted" />}
            {c.label}
          </li>
        ))}
      </ul>
      {chosenName && <div className="text-[13px] text-ink-2">{t("Then we'll offer to send it to {name}.", { name: chosenName })}</div>}
    </div>
  );
}
