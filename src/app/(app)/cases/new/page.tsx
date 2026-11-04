"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
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
import {
  formHasContent,
  formOf,
  loadDraftFiles,
  loadDrafts,
  newDraftId,
  putDraft,
  registerOpenDraft,
  removeDraft,
  useDrafts,
  type DraftChat,
} from "@/lib/cases/drafts";
import { useFailedUploads } from "@/lib/failed-uploads";
import { useCreateCaseFromWizard, useStillHere } from "@/lib/cases/new-case";
import { uploadAll, useCreateCaseMutation } from "@/lib/cases/queries";
import { usePricingQuery } from "@/lib/pricing";
import { useApp } from "@/lib/store";
import { useWizard } from "@/lib/wizard-store";

type ChatState = { chat: DraftChat; files: File[] };

const SAVE_MS = 400;

function NewCase() {
  const router = useRouter();
  const device = useDevice();
  const wiz = useWizard();
  const { data: pricing } = usePricingQuery();
  const included = pricing?.case.credits ?? "…";
  const { create, creating, error } = useCreateCaseFromWizard();
  const createCaseDirect = useCreateCaseMutation();
  const stillHere = useStillHere();
  const [chatCreating, setChatCreating] = useState(false);
  const [chatError, setChatError] = useState("");

  const userId = useSession((s) => s.user?.id);
  const [ready, setReady] = useState(false);
  // The AI chat is the default way in; the 3-step form is the alternative.
  // From the URL, so a "New case" link always lands on the chat even when the form is showing.
  const mode = useSearchParams().get("mode") === "form" ? "form" : "chat";
  const setMode = (m: "chat" | "form") => router.replace(m === "form" ? "/cases/new?mode=form" : "/cases/new");
  const [hasDraft, setHasDraft] = useState(false);
  // Where the phone's Check step portals its Edit and Create icons (see IntakeChatMobile).
  const [actionsSlot, setActionsSlot] = useState<HTMLElement | null>(null);

  // What's here is saved as a draft as it changes (lib/cases/drafts.ts), so leaving it, for another
  // page or another New case, loses nothing; it's continued from Drafts. A case already being made
  // isn't a draft: it finishes in the background and its draft is deleted then.
  const draftId = useRef<string | null>(null);
  const chatState = useRef<ChatState | null>(null);
  // What the chat starts from when it mounts: the saved draft, or where it was before the form.
  const [chatStart, setChatStart] = useState<ChatState | null>(null);
  const modeNow = useRef<"chat" | "form">(mode);
  const busy = useRef(false);
  useEffect(() => {
    modeNow.current = mode;
    busy.current = creating || chatCreating;
  });

  const save = useCallback((): boolean => {
    const id = draftId.current;
    const w = useWizard.getState();
    // Another draft (or none) is open now: this one was deleted, made into a case, or switched away
    // from, and was saved on the way if it was kept.
    if (!id || !userId || busy.current || w.draftId !== id) return false;
    const chat = chatState.current;
    return putDraft({
      id,
      ownerId: userId,
      mode: modeNow.current,
      chat: chat?.chat ?? null,
      chatFiles: modeNow.current === "chat" ? (chat?.files ?? []) : [],
      form: formOf(w),
      formFiles: w.files,
    });
  }, [userId]);

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const saveSoon = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(save, SAVE_MS);
  }, [save]);

  const onChatChange = useCallback(
    (state: ChatState) => {
      chatState.current = state;
      saveSoon();
    },
    [saveSoon],
  );

  // Saved on every change to the form, on leaving (unmount, or the tab closing), and right away
  // when New case or another draft is opened (registerOpenDraft).
  useEffect(() => {
    if (!ready) return;
    const now = () => {
      clearTimeout(timer.current);
      return save();
    };
    const unregister = registerOpenDraft(now);
    const unsubscribe = useWizard.subscribe(saveSoon);
    window.addEventListener("pagehide", now);
    return () => {
      unregister();
      unsubscribe();
      window.removeEventListener("pagehide", now);
      now();
    };
  }, [ready, save, saveSoon]);
  useEffect(() => {
    if (ready) saveSoon();
  }, [mode, ready, saveSoon]);

  // Brings back the draft this tab is on (the stores hydrate lazily, see wizard-store and drafts),
  // or starts a new one, then starts at step 1.
  useEffect(() => {
    if (!userId) return;
    let live = true;
    void (async () => {
      await Promise.all([useWizard.persist.rehydrate(), loadDrafts()]);
      if (!live) return;
      useWizard.getState().claimFor(userId);
      let id = useWizard.getState().draftId;
      const saved = id ? useDrafts.getState().drafts[id] : undefined;
      if (saved?.ownerId === userId) {
        const files = saved.fileCount ? await loadDraftFiles(saved.id) : null;
        if (!live) return;
        useWizard.setState({ ...saved.form, files: files?.form ?? [] });
        const chat = saved.chat ? { chat: saved.chat, files: files?.chat ?? [] } : null;
        chatState.current = chat;
        setChatStart(chat);
      } else if (!id || saved) {
        id = newDraftId();
        useWizard.setState({ draftId: id });
      }
      draftId.current = id;
      useWizard.getState().enter();
      // The chat is always the way in. A form draft left behind is offered as a link, not forced.
      setHasDraft(formHasContent(formOf(useWizard.getState())));
      setReady(true);
    })();
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
    const id = draftId.current;
    let created;
    try {
      created = await createCaseDirect.mutateAsync(describeCasePayload(text));
    } catch (err) {
      setChatCreating(false);
      setChatError(err instanceof Error && err.message ? err.message : "We couldn't create the case. Try again.");
      return;
    }
    // It's a case now, not a draft. The next New case starts a new one.
    if (id) removeDraft(id);
    if (useWizard.getState().draftId === id) useWizard.setState({ draftId: null });
    const notUploaded = await uploadAll(created.id, files);
    useFailedUploads.getState().set(created.id, notUploaded);
    void sendMessage(created.id, text);
    setChatCreating(false);
    // Moved on while it was being made (another page, or New case again): it's finished all the
    // same and waits under Your cases, without pulling the client back to it.
    if (stillHere()) router.push(`/cases/${created.id}`);
    else useApp.getState().setBanner(`Your case "${created.title}" is created. You'll find it under Your cases.`);
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
            <div className="flex items-center gap-2">
              {device === "mobile" && <div ref={setActionsSlot} className="flex items-center gap-2" />}
              <GuideButton variant={device === "mobile" ? "bar" : "pill"} />
            </div>
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
          headerSlot={actionsSlot}
          onUseForm={() => setMode("form")}
          initial={chatStart ?? undefined}
          onChange={onChatChange}
        />
      </div>
    );
  }

  return (
    <NewCaseForm
      included={included}
      creating={creating}
      error={error}
      onBack={onBack}
      onNext={onNext}
      onChat={() => {
        // Back to the conversation where it was left, not a new one.
        setChatStart(chatState.current);
        setMode("chat");
      }}
    />
  );
}

export default function NewCasePage() {
  // New case or a draft opened while already here is the same URL, so nothing would remount: keyed
  // on the press instead, it starts that one rather than showing the one in progress.
  const round = useWizard((s) => s.round);
  return (
    <Suspense fallback={null}>
      <NewCase key={round} />
    </Suspense>
  );
}
