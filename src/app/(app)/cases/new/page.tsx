"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { IntakeChat } from "@/components/cases/intake-chat";
import { GuideButton } from "@/components/tour/guide-button";
import { TourHint } from "@/components/tour/tour-hint";
import { useDevice } from "@/components/device/device-provider";
import type { IntakeDraft } from "@/lib/cases/use-intake-chat";
import { NewCaseForm } from "@/components/wizard/new-case-form";
import { useSession } from "@/lib/auth/session";
import { sendMessage } from "@/lib/cases/api";
import { describeCasePayload } from "@/lib/cases/describe-case";
import { useFailedUploads } from "@/lib/failed-uploads";
import { useCreateCaseFromWizard } from "@/lib/cases/new-case";
import { uploadAll, useCreateCaseMutation } from "@/lib/cases/queries";
import { usePricingQuery } from "@/lib/pricing";
import { useWizard } from "@/lib/wizard-store";

function NewCase() {
  const router = useRouter();
  const device = useDevice();
  const wiz = useWizard();
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

  // Still used by the scripted review screen reached via "Edit details" — an explicit, opt-in
  // path for someone who wants to check/adjust fields before anything is created, not the default.
  const onChatCreate = (draft: IntakeDraft, files: File[]) => {
    loadIntoWizard(draft, files);
    void create();
  };

  if (mode === "chat") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="keyboard-hide mx-auto w-full max-w-[768px] px-4 pt-5 max-md:pt-2 md:px-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push("/cases")}
              data-no-tap
              className="flex min-h-11 items-center gap-2 text-[10px] font-semibold uppercase tracking-[1.2px] text-ink-2 md:min-h-8"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Cases
            </button>
            {/* The phone has no top bar on this screen, so the guide is here; on a desktop it is here too, where the chat is. */}
            <GuideButton variant={device === "mobile" ? "bar" : "pill"} />
          </div>
          <TourHint className="mt-3" />
        </div>
        <IntakeChat
          creating={creating || chatCreating}
          error={error || chatError}
          onFirstMessage={onFirstMessage}
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

  return <NewCaseForm included={included} creating={creating} error={error} onBack={onBack} onNext={onNext} onChat={() => setMode("chat")} />;
}

export default function NewCasePage() {
  return (
    <Suspense fallback={null}>
      <NewCase />
    </Suspense>
  );
}
