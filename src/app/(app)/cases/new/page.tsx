"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { IntakeChat } from "@/components/cases/intake-chat";
import { TourHint } from "@/components/tour/tour-hint";
import type { IntakeDraft } from "@/lib/cases/use-intake-chat";
import { StepBudget, StepDetails, StepDocuments, StepPeople } from "@/components/wizard/steps";
import { useSession } from "@/lib/auth/session";
import { sendMessage, sendVoiceMessage } from "@/lib/cases/api";
import { EMPTY_BUDGET_DRAFT } from "@/lib/cases/budget";
import { describeCasePayload } from "@/lib/cases/describe-case";
import { useFailedUploads } from "@/lib/failed-uploads";
import { newCaseFromDraft, useCreateCaseFromWizard } from "@/lib/cases/new-case";
import { uploadAll, useCreateCaseMutation } from "@/lib/cases/queries";
import { cn } from "@/lib/cn";
import { usePricingQuery } from "@/lib/pricing";
import { WIZARD_STEPS, useWizard } from "@/lib/wizard-store";

const STEPS = [
  { numeral: "I", title: "Case details", hint: "Title and place" },
  { numeral: "II", title: "People involved", hint: "Your side and the others" },
  { numeral: "III", title: "Budget", hint: "What you can spend. Optional" },
  { numeral: "IV", title: "Documents", hint: "Files for the AI to read" },
];

function NewCase() {
  const router = useRouter();
  const wiz = useWizard();
  const { step, maxStep, title, region, side, budget } = wiz;
  const { data: pricing } = usePricingQuery();
  const included = pricing?.case.credits ?? "…";
  const { create, creating, error } = useCreateCaseFromWizard();
  const createCaseDirect = useCreateCaseMutation();
  const [chatCreating, setChatCreating] = useState(false);
  const [chatError, setChatError] = useState("");

  const userId = useSession((s) => s.user?.id);
  const [ready, setReady] = useState(false);
  // The AI chat is the default way in; the 3-step form is the alternative.
  // From the URL, so a "New case" link always lands on the chat even when the form is showing.
  const mode = useSearchParams().get("mode") === "form" ? "form" : "chat";
  const setMode = (m: "chat" | "form") => router.replace(m === "form" ? "/cases/new?mode=form" : "/cases/new");
  const [hasDraft, setHasDraft] = useState(false);

  // Brings back this account's saved draft (the store hydrates lazily, see wizard-store), then starts
  // at step 1.
  useEffect(() => {
    if (!userId) return;
    let live = true;
    void Promise.resolve(useWizard.persist.rehydrate()).then(() => {
      if (!live) return;
      useWizard.getState().claimFor(userId);
      useWizard.getState().enter();
      // The chat is always the way in. A form draft left behind is offered as a link, not forced.
      const saved = useWizard.getState();
      setHasDraft(!!(saved.title.trim() || saved.areas.length || saved.region || saved.happened || saved.wants));
      setReady(true);
    });
    return () => {
      live = false;
    };
  }, [userId]);

  const stepDone = (n: number) => (n === 1 ? !!title.trim() && !!region : n === 2 ? !!side : n === 3 ? !!budget.choice || !!budget.fee : false);

  if (!ready) return null;

  const onNext = () => {
    if (wiz.next()) void create();
  };
  const onBack = () => {
    if (wiz.back()) router.push("/cases");
  };

  // What the chat gathered goes into the wizard's draft, so creating from the chat and editing in
  // the form share one path (and the form is prefilled instead of making the client retype).
  const loadIntoWizard = (draft: IntakeDraft, files: File[]) => {
    const w = useWizard.getState();
    w.reset();
    w.set({
      title: draft.title,
      areas: draft.areas,
      region: draft.region,
      where: draft.where,
      side: draft.side,
      happened: draft.happened,
      wants: draft.wants,
    });
    draft.others.forEach((o) => {
      w.addOther();
      const added = useWizard.getState().others.at(-1);
      if (added) w.updateOther(added.id, { name: o.name, role: o.role });
    });
    w.addFiles(files);
  };

  // The client's first message IS the submission — no scripted question-by-question gate first.
  // A bare placeholder case is created immediately (describeCasePayload), the client's own text
  // runs as its first message, and chat-wonder's create_case tool reads that and writes the real
  // case details for real, in the background, while the client is already on their case page.
  const onFirstMessage = async (text: string, files: File[]) => {
    if (chatCreating || !text.trim()) return;
    setChatCreating(true);
    setChatError("");
    let created;
    try {
      created = await createCaseDirect.mutateAsync(describeCasePayload(text));
    } catch (err) {
      setChatCreating(false);
      setChatError(err instanceof Error && err.message ? err.message : "We couldn't create the case. Try again.");
      return;
    }
    const notUploaded = await uploadAll(created.id, files);
    useFailedUploads.getState().set(created.id, notUploaded);
    void sendMessage(created.id, text);
    setChatCreating(false);
    router.push(`/cases/${created.id}`);
  };

  // Same placeholder-case-first shape as onFirstMessage above, but for a spoken first message:
  // the case is created with a generic title (there's no text yet to derive one from — the real
  // title comes from chat-wonder's create_case tool once the recording is transcribed), then the
  // recording itself is sent as a voice message, same endpoint and pipeline an existing case's
  // Interview tab uses (transcribe, answer, synthesize the reply's audio).
  const onFirstVoiceMessage = async (blob: Blob) => {
    if (chatCreating) return;
    setChatCreating(true);
    setChatError("");
    try {
      const created = await createCaseDirect.mutateAsync(describeCasePayload(""));
      // Awaited, unlike onFirstMessage's fire-and-forget sendMessage: a voice message uploads the
      // whole recording to S3 before the message even exists, which takes long enough that
      // navigating away first landed on the new case's empty "Tell me about your situation"
      // screen with no sign anything was happening. Staying here with chatCreating still true
      // (the composer's own disabled/"Sending…" state) until the upload actually lands avoids that.
      await sendVoiceMessage(created.id, blob);
      router.push(`/cases/${created.id}`);
    } catch (err) {
      setChatError(err instanceof Error && err.message ? err.message : "We couldn't send that recording. Try again.");
    } finally {
      setChatCreating(false);
    }
  };

  // Still used by the scripted review screen reached via "Edit details" — an explicit, opt-in
  // path for someone who wants to check/adjust fields before anything is created, not the default.
  const onChatCreate = async (draft: IntakeDraft, files: File[]) => {
    if (chatCreating) return;
    setChatCreating(true);
    setChatError("");
    let created;
    try {
      created = await createCaseDirect.mutateAsync(newCaseFromDraft({ ...draft, budget: EMPTY_BUDGET_DRAFT }));
    } catch (err) {
      setChatCreating(false);
      setChatError(err instanceof Error && err.message ? err.message : "We couldn't create the case. Try again.");
      return;
    }
    const notUploaded = await uploadAll(created.id, files);
    useFailedUploads.getState().set(created.id, notUploaded);
    const text = [draft.happened, draft.wants].filter((s) => s.trim()).join("\n\n");
    if (text) void sendMessage(created.id, text);
    setChatCreating(false);
    router.push(`/cases/${created.id}`);
  };

  if (mode === "chat") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mx-auto w-full max-w-[768px] px-4 pt-5 md:px-6">
          <button
            type="button"
            onClick={() => router.push("/cases")}
            data-no-tap
            className="flex min-h-8 items-center gap-2 text-[10px] font-semibold uppercase tracking-[1.2px] text-ink-2"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Cases
          </button>
          <TourHint className="mt-3" />
        </div>
        <IntakeChat
          creating={chatCreating}
          error={chatError}
          onFirstMessage={onFirstMessage}
          onFirstVoiceMessage={onFirstVoiceMessage}
          onCreate={onChatCreate}
          onEditDetails={(draft, files) => {
            loadIntoWizard(draft, files);
            useWizard.getState().enter();
            setMode("form");
          }}
          hasDraft={hasDraft}
          onUseForm={() => setMode("form")}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto grid w-full max-w-[1080px] grid-cols-1 items-start gap-5 px-4 py-7 md:grid-cols-[260px_minmax(0,1fr)] md:gap-12 md:px-10">
        <div className="flex flex-col gap-5">
          <button
            type="button"
            onClick={() => router.push("/cases")}
            data-no-tap
            className="flex min-h-8 items-center gap-2 self-start text-[10px] font-semibold uppercase tracking-[1.2px] text-ink-2"
          >
            <ArrowLeft size={14} />
            Cases
          </button>
          <div className="hidden flex-col gap-2.5 md:flex">
            <h1 className="font-display text-[40px] font-normal leading-none tracking-[-0.02em]">
              New case
            </h1>
            <p className="text-[13px] leading-[1.6] text-ink-2">
              Tell us what happened, who is involved, what you can spend, and add your documents. You can edit
              everything later. A case is free and includes {included} chat credits.
            </p>
            <button
              type="button"
              onClick={() => setMode("chat")}
              data-no-tap
              className="min-h-11 self-start text-[13px] font-semibold underline underline-offset-4 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Chat with us instead
            </button>
          </div>
          <ol className="flex flex-row justify-between gap-1 md:flex-col">
            {STEPS.map((s, i) => {
              const n = i + 1;
              const done = n < step && stepDone(n);
              const cur = n === step;
              return (
                <li key={s.numeral} className="flex-1 md:flex-none">
                  <button
                    type="button"
                    onClick={() => wiz.goTo(n)}
                    disabled={n > maxStep}
                    aria-current={cur ? "step" : undefined}
                    data-no-tap
                    className="flex w-full flex-col items-center gap-3 py-3 text-center disabled:cursor-default md:flex-row md:border-t md:border-line md:text-left"
                  >
                    <span
                      className={cn(
                        "box-border flex size-[26px] shrink-0 items-center justify-center rounded-full border font-display text-xs",
                        done
                          ? "border-gold bg-gold text-white"
                          : cur
                            ? "border-gold bg-white text-gold"
                            : "border-line-input bg-white text-muted",
                      )}
                    >
                      {done ? <Check size={13} strokeWidth={3} /> : s.numeral}
                    </span>
                    <span>
                      <span
                        className={cn(
                          "block text-[13px] font-medium",
                          done || cur ? "text-ink" : "text-muted",
                        )}
                      >
                        {s.title}
                      </span>
                      <span className="mt-0.5 hidden text-[11.5px] text-muted md:block">
                        {s.hint}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {step === 1 && <TourHint />}
          {step === 1 && <StepDetails />}
          {step === 2 && <StepPeople />}
          {step === 3 && <StepBudget />}
          {step === 4 && <StepDocuments />}
          {error && <ErrorBox message={error} />}

          <div className="sticky bottom-0 z-[2] -mx-4 flex items-center justify-between gap-2.5 border-t border-line bg-white px-4 pb-[30px] pt-3 md:static md:mx-0 md:border-t-0 md:bg-transparent md:p-0">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <div className="flex items-center gap-3.5">
              <div className="hidden text-xs text-muted md:block">
                Free · includes {included} chat credits
              </div>
              <Button className="px-[26px] disabled:!opacity-60" onClick={onNext} disabled={creating}>
                {step < WIZARD_STEPS ? "Continue" : creating ? "Creating…" : "Create case"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewCasePage() {
  return (
    <Suspense fallback={null}>
      <NewCase />
    </Suspense>
  );
}
