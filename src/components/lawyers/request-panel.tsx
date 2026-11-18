"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Info } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { useCaseAvailability } from "@/components/lawyers/use-case-availability";
import { useCasesQuery } from "@/lib/cases/queries";
import { useSession } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { formatDateTime, firstName } from "@/lib/format";
import { useLawyerRequestForm, useOpenLawyerRequestQuery } from "@/lib/lawyer-requests/api";
import { useChosenLawyer } from "@/lib/lawyers/chosen-lawyer";
import { firstConsultationLabel, takesCase, useMarketplaceCase, type ClientLawyer } from "@/lib/lawyers/marketplace";

import { useT } from "@/components/site/language-provider";
import { useSite } from "@/components/site/site-provider";
/** Why the request button is off, in words, with the step that fixes it when there is one. */
interface BlockedReason {
  title: string;
  body: string;
  link?: { href: string; label: string };
}

function BlockedNotice({ reason, onLeave }: { reason: BlockedReason; onLeave?: () => void }) {
  return (
    <div role="status" className="flex gap-2.5 rounded-input border border-line bg-subtle p-3.5">
      <Info size={16} className="mt-0.5 shrink-0 text-ink-2" aria-hidden />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-[13.5px] font-semibold text-ink">{reason.title}</p>
        <p className="text-[13px] leading-[1.6] text-ink-2">{reason.body}</p>
        {reason.link && (
          <Link href={reason.link.href} onClick={onLeave} className="mt-0.5 self-start text-[13px] font-medium">
            {reason.link.label}
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Asking this lawyer: the case to send, then the request form (useLawyerRequestForm) with their
 * name, so only they are offered it for 24 hours before it goes to every matching lawyer. Once sent,
 * the case's open request says so here. On the lawyer's profile, and in the marketplace card's
 * Request modal. `available` is the profile's; a listed lawyer is always taking requests. `onLeave`
 * runs before the request form opens or a link is followed, so a modal holding this can close first.
 */
export function RequestPanel({
  lawyer,
  id,
  className,
  onLeave,
}: {
  lawyer: ClientLawyer & { available?: boolean };
  id?: string;
  className?: string;
  onLeave?: () => void;
}) {
  const t = useT();
  const { data: cases = [] } = useCasesQuery();
  const picked = useMarketplaceCase((s) => s.caseId);
  const [chosen, setChosen] = useState<string | null>(null);
  // The case picked on the marketplace, if it still exists, else the first.
  const caseId = chosen ?? (cases.some((c) => c.id === picked) ? picked : null) ?? cases[0]?.id ?? null;
  const theCase = cases.find((c) => c.id === caseId) ?? null;
  const availability = useCaseAvailability(caseId);
  const { data: open } = useOpenLawyerRequestQuery(caseId ?? "");
  const name = firstName(lawyer.name) ?? lawyer.name;
  const available = lawyer.available ?? true;

  const sentToThem = open && open.caseId === caseId && open.requestedLawyer?.id === lawyer.id ? open : null;
  const { regionQuestion } = useSite();
  const fits = !!theCase && takesCase(lawyer, theCase);
  const canAsk = !!caseId && availability.canRequest && available && fits;

  const router = useRouter();
  const userId = useSession((s) => s.user?.id);
  // No case for them yet: tell us about it on New case, which keeps this lawyer for it, and the
  // case offers to send it to them once it has what a lawyer needs (lib/lawyers/chosen-lawyer.ts).
  const startCase = () => {
    if (!userId) return;
    useChosenLawyer.getState().choose(lawyer, userId);
    onLeave?.();
    router.push("/cases/new");
  };

  const openForm = (named: boolean) => {
    if (!caseId) return;
    onLeave?.();
    useLawyerRequestForm.getState().openFor(caseId, named ? { id: lawyer.id, name: lawyer.name } : undefined);
  };

  // Why "Request" is off, and what to do about it: the case's own reasons (the API's eligibility)
  // first, since they stop any request, then this lawyer's.
  let blocked: BlockedReason | null = null;
  if (theCase && availability.code === "REQUEST_ALREADY_OPEN") {
    const holder = open?.requestedOnly && open.requestedLawyer ? (firstName(open.requestedLawyer.name) ?? open.requestedLawyer.name) : null;
    blocked = {
      title: t("This case already has a request open"),
      body: `${holder ? t("“{title}” is with {name} right now.", { title: theCase.title, name: holder }) : t("“{title}” has been sent to matching lawyers already.", { title: theCase.title })} ${t("A case can only have one request at a time. To ask {name} instead, withdraw that request from the case’s Lawyer tab first.", { name })}`,
      link: { href: `/cases/${theCase.id}`, label: t("Open the case’s Lawyer tab") },
    };
  } else if (theCase && availability.code) {
    blocked = {
      title:
        availability.code === "NOT_UK_CASE"
          ? t("This case isn’t in the UK")
          : availability.code === "REGION_UNKNOWN"
            ? t("Which part of the UK is this case in?")
            : t("We can’t send this case to a lawyer"),
      body: availability.reason ?? "",
      link:
        availability.code === "NOT_UK_CASE" || availability.code === "REGION_UNKNOWN"
          ? { href: `/cases/${theCase.id}`, label: t("Check the case’s details") }
          : undefined,
    };
  } else if (!available) {
    blocked = {
      title: t("{name} isn’t taking new requests right now", { name }),
      body: t("They may be busy or away. You can still let us match you with other verified lawyers who handle cases like yours."),
    };
  } else if (theCase && availability.canRequest && !fits) {
    const caseAreas = theCase.areas.map((a) => a.name).join(", ") || t("its type of issue");
    const handles = lawyer.practiceAreas.join(", ") || t("other areas");
    blocked = {
      title: t("{name} doesn’t take cases like this one", { name }),
      // The UK's parts of the UK only on the UK: another site's lawyers take its whole country.
      body: regionQuestion
        ? `“${theCase.title}” is about ${caseAreas} in ${theCase.ukJurisdiction ?? "outside the UK"}. ${name} handles ${handles} in ${lawyer.qualifiedJurisdictions.join(", ") || "other parts of the UK"}. Choose another case, or let us match you with a lawyer who fits.`
        : t("“{title}” is about {areas}. {name} handles {handles}. Choose another case, or let us match you with a lawyer who fits.", { title: theCase.title, areas: caseAreas, name, handles }),
    };
  }

  return (
    <div id={id} className={cn("flex flex-col gap-4", className)}>
      <dl className="flex flex-col text-[15px]">
        <div className="flex justify-between py-2.5">
          <dt className="text-ink-2">{t("First consultation")}</dt>
          <dd className="font-semibold">{firstConsultationLabel(lawyer)}</dd>
        </div>
      </dl>

      {cases.length === 0 ? (
        <div className="flex flex-col gap-2.5">
          <p className="text-[13px] leading-[1.6] text-ink-2">
            {t("Tell us what's going on first. Once your case has what a lawyer needs, we'll offer to send it to {name}.", { name })}
          </p>
          <Button variant="dark" size="xl" className="w-full !text-[14px]" disabled={!available} onClick={startCase}>
            {t("Tell us about your case")}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`request-case-${lawyer.id}`} className="text-xs font-semibold text-ink-2">
              {t("For which case")}
            </label>
            <select
              id={`request-case-${lawyer.id}`}
              value={caseId ?? ""}
              onChange={(e) => setChosen(e.target.value)}
              className="h-11 rounded-input border border-line-input bg-white px-3.5 text-sm text-ink outline-none focus:border-ink-2"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          {!sentToThem && available && (
            <button type="button" onClick={startCase} className="-mt-2 self-start border-0 bg-transparent p-0 text-[13px] font-medium text-ink underline underline-offset-4">
              Or start a new case for {name}
            </button>
          )}

          {sentToThem ? (
            <div className="flex flex-col gap-3 rounded-input border border-line bg-subtle p-4">
              <div className="flex items-center gap-2 text-[14px] font-semibold">
                <span className="flex size-6 items-center justify-center rounded-full bg-success-bg text-success-ink">
                  <Check size={14} aria-hidden />
                </span>
                {sentToThem.requestedOnly ? t("Sent to {name}", { name }) : t("Sent to {name} and other lawyers", { name })}
              </div>
              <p className="text-[13px] leading-[1.6] text-ink-2">
                {sentToThem.requestedOnly && sentToThem.routingExpiresAt
                  ? t("{name} has until {date} to take it up. If they don’t, it goes to other verified lawyers who match.", { name, date: formatDateTime(sentToThem.routingExpiresAt) })
                  : t("{name} couldn’t take it up in time, so other verified lawyers who match can now send you a quote.", { name })}
              </p>
              <Link
                href={`/cases/${sentToThem.caseId}`}
                onClick={onLeave}
                className={cn(buttonClass("dark", "sm"), "self-start text-white no-underline hover:text-white")}
              >
                {t("Go to my case")}
              </Link>
            </div>
          ) : (
            <>
              {blocked && <BlockedNotice reason={blocked} onLeave={onLeave} />}
              <Button variant="dark" size="xl" className="w-full !text-[14px]" disabled={!canAsk} onClick={() => openForm(true)}>
                {t("Request {name}", { name })}
              </Button>
              <Button variant="soft" size="lg" className="w-full" disabled={!availability.canRequest} onClick={() => openForm(false)}>
                {t("Let us match me instead")}
              </Button>
            </>
          )}
        </>
      )}
      <p className="text-[12.5px] leading-[1.6] text-ink-2">
        {t("Only {name} gets this request at first. They’ll check for conflicts and can send you a quote. If they pass, or don’t take it up within 24 hours, it goes to other verified lawyers who match.", { name })}
      </p>
    </div>
  );
}
