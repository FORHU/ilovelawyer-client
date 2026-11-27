"use client";

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUp, Loader2, Mic, Sparkles, Square, WifiOff, X } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { ChatBar, ChatScreen, ComposerButton, ComposerPill, QuickReplies, ReplyChip } from "@/components/mobile/chat";
import { TypingDots } from "@/components/ui/typing-dots";
import { LiveDictationStatus } from "@/components/cases/live-dictation-status";
import { useDevice } from "@/components/device/device-provider";
import { useT } from "@/components/site/language-provider";
import { ApiError } from "@/lib/api/fetch";
import { endMessageOf, progressOf, threadOf, type ThreadTurn } from "@/lib/cases/questions";
import { StepPage, StepTopRow } from "@/components/steps/step-page";
import { useQuestions, type QuestionsController } from "./use-questions";

/** The Questions step after the story (/cases/:id/questions): the details the case still needs, one
 * at a time, each with why it's asked and answers to tap. Phone and desktop share the screen; on a
 * phone the answer bar sits at the bottom, clear of the keyboard. */
export function QuestionsScreen({ caseId }: { caseId: string }) {
  const q = useQuestions(caseId);
  const t = useT();
  const mobile = useDevice() === "mobile";
  const caseHref = `/cases/${caseId}`;

  let body: ReactNode;
  let bar: ReactNode = null;
  if (q.query.isError) {
    body = <Unavailable q={q} caseHref={caseHref} />;
  } else if (!q.state) {
    body = (
      <div role="status" className="flex items-center gap-2.5 px-1 py-10 text-[15px] text-ink-2">
        <Loader2 size={18} className="text-gold motion-safe:animate-spin" aria-hidden="true" />
        {q.preparing === "reading" ? t("Still reading your story…") : t("Getting your questions ready…")}
      </div>
    );
  } else {
    body = <Thread q={q} />;
    bar = q.state.status === "DONE" ? <Finished caseId={caseId} caseHref={caseHref} /> : <AnswerBar q={q} />;
  }

  const header = <Header q={q} caseHref={caseHref} />;
  if (mobile) {
    return (
      <ChatScreen>
        {header}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 py-4">{body}</div>
        </div>
        {bar && <ChatBar>{bar}</ChatBar>}
      </ChatScreen>
    );
  }
  return (
    <StepPage header={header} bar={bar}>
      {body}
    </StepPage>
  );
}

function Header({ q, caseHref }: { q: QuestionsController; caseHref: string }) {
  const t = useT();
  const progress = q.state ? progressOf(q.state) : null;
  return (
    <header className="flex shrink-0 flex-col gap-2.5 px-4 pt-3 pb-2 md:px-0 md:pt-6">
      <StepTopRow
        caseHref={caseHref}
        aside={
          progress &&
          progress.total > 0 && (
            <span className="text-[11px] font-semibold uppercase tracking-[1.2px] text-ink-2 tabular-nums">
              {t("{done} of {total} details", { done: progress.done, total: progress.total })}
            </span>
          )
        }
      />
      <h1 className="font-display text-[26px] leading-[1.15] tracking-[-0.02em] md:text-[30px]">{t("Questions")}</h1>
      {progress && progress.total > 0 && (
        <div
          role="progressbar"
          aria-label={t("Details answered")}
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={progress.done}
          className="h-1 overflow-hidden rounded-full bg-line"
        >
          <div className="h-full rounded-full bg-gold transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${progress.percent}%` }} />
        </div>
      )}
    </header>
  );
}

function AiBubble({ text, why }: { text: string; why?: string }) {
  const t = useT();
  return (
    <div className="flex items-start gap-2">
      <span aria-hidden="true" className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-warn-bg text-gold">
        <Sparkles size={14} />
      </span>
      <div className="min-w-0 max-w-[calc(100%-36px)] rounded-[4px_18px_18px_18px] bg-bubble px-3.5 py-2.5 text-[15px] leading-normal text-ink">
        <span className="sr-only">{t("ilovelawyer AI:")} </span>
        <span className="whitespace-pre-line">{text}</span>
        {why && (
          <span className="mt-1 block text-[12.5px] leading-[1.45] text-ink-2">
            {t("Why we ask:")} {why}
          </span>
        )}
      </div>
    </div>
  );
}

function MyBubble({ text, skipped }: { text: string | null; skipped: boolean }) {
  const t = useT();
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap wrap-break-word rounded-[18px_4px_18px_18px] bg-primary px-3.5 py-2.5 text-[15px] leading-normal text-white">
        <span className="sr-only">{t("You:")} </span>
        {skipped ? <span className="italic">{t("I’m not sure.")}</span> : text}
      </div>
    </div>
  );
}

function Turn({ turn }: { turn: ThreadTurn }) {
  return turn.kind === "question" ? <AiBubble text={turn.text} why={turn.why} /> : <MyBubble text={turn.text} skipped={turn.skipped} />;
}

/** The conversation: what's been asked and answered, the question now, the answer being saved, and
 * the closing message once done. Kept scrolled to the newest. */
function Thread({ q }: { q: QuestionsController }) {
  const t = useT();
  const state = q.state!;
  const turns = threadOf(state);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [turns.length, q.pending, state.status]);

  return (
    <div role="log" aria-label={t("Questions about your case")} aria-live="polite" className="flex flex-col gap-3">
      {turns.map((turn) => (
        <Turn key={turn.key} turn={turn} />
      ))}
      {q.pending && (
        <>
          <MyBubble text={q.pending.text} skipped={q.pending.skipped} />
          <div role="status" aria-label={t("Saving your answer")} className="flex items-center gap-1.5 pl-9">
            <TypingDots />
          </div>
        </>
      )}
      {state.status === "DONE" && <AiBubble text={t(endMessageOf(state))} />}
      <div ref={end} />
    </div>
  );
}

function AnswerBar({ q }: { q: QuestionsController }) {
  const t = useT();
  const current = q.current;
  const box = useRef<HTMLTextAreaElement>(null);
  const listening = q.recorder.phase !== "idle";
  // Each new question puts the cursor in the box on a desktop. Not on a phone, where that would
  // open the keyboard over the question and its chips.
  const mobile = useDevice() === "mobile";
  const currentId = current?.id;
  useEffect(() => {
    if (!mobile && currentId) box.current?.focus({ preventScroll: true });
  }, [currentId, mobile]);
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      q.sendText();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {!q.online && (
        <p role="status" className="flex items-center gap-2 text-[13px] text-warn-ink">
          <WifiOff size={15} className="shrink-0" aria-hidden="true" />
          {t("You’re offline. You can answer when you’re back online.")}
        </p>
      )}
      {(q.error || q.recorder.error) && (
        <p role="alert" className="px-1 text-[13px] text-error">
          {q.error || t(q.recorder.error)}
        </p>
      )}
      {current && current.chips.length > 0 && !listening && (
        <QuickReplies label={t("Suggested answers")}>
          {current.chips.map((chip) => (
            <ReplyChip key={chip} onClick={() => q.tap(chip)} disabled={q.saving || !q.online} data-no-tap>
              {chip}
            </ReplyChip>
          ))}
        </QuickReplies>
      )}
      <ComposerPill>
        {listening ? (
          <>
            <ComposerButton onClick={q.recorder.cancel} aria-label={t("Cancel recording")}>
              <X size={20} aria-hidden="true" />
            </ComposerButton>
            <LiveDictationStatus phase={q.recorder.phase} seconds={q.recorder.seconds} transcript={q.recorder.transcript} before={q.text} />
            <ComposerButton tone="send" onClick={q.recorder.stop} disabled={q.recorder.phase !== "recording"} aria-label={t("Stop recording")}>
              <Square size={16} className="fill-current" aria-hidden="true" />
            </ComposerButton>
          </>
        ) : (
          <>
            <textarea
              ref={box}
              id="question-answer"
              rows={1}
              value={q.text}
              onChange={(e) => q.setText(e.target.value)}
              onKeyDown={onKey}
              maxLength={1500}
              placeholder={t("Type your answer")}
              aria-label={t("Type your answer")}
              enterKeyHint="send"
              className="min-h-11 min-w-0 flex-1 resize-none bg-transparent px-3 py-2.5 text-base leading-6 text-ink outline-none placeholder:text-muted"
            />
            <ComposerButton onClick={q.recorder.start} disabled={q.saving || !q.online} aria-label={t("Answer by voice")}>
              <Mic size={20} aria-hidden="true" />
            </ComposerButton>
            <ComposerButton tone="send" onClick={q.sendText} disabled={!q.text.trim() || q.saving || !q.online} aria-label={t("Send")}>
              <ArrowUp size={20} aria-hidden="true" />
            </ComposerButton>
          </>
        )}
      </ComposerPill>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
        {/* Suggestions are mentioned only when there are some to tap. */}
        <span className="text-[12.5px] text-muted">{current?.chips.length ? t("Talk, type, or tap a suggestion.") : t("Talk or type your answer.")}</span>
        <button
          type="button"
          onClick={q.skip}
          disabled={q.saving || !q.online || listening}
          data-no-tap
          className="min-h-11 text-[13.5px] font-medium text-ink-2 underline underline-offset-4 hover:text-ink disabled:opacity-40"
        >
          {t("I don’t know, skip")}
        </button>
      </div>
    </div>
  );
}

function Finished({ caseId, caseHref }: { caseId: string; caseHref: string }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-2.5 md:flex-row">
      {/* Next comes the evidence step, in the same flow: the proof the story and answers call for. */}
      <Link href={`/cases/${caseId}/evidence`} className={buttonClass("primary", "lg", "w-full md:w-auto")}>
        {t("Add your proof")}
      </Link>
      <Link href={caseHref} className={buttonClass("soft", "lg", "w-full md:w-auto")}>
        {t("Open my case")}
      </Link>
    </div>
  );
}

/** The questions couldn't be shown: the list couldn't be written, or the wait ran out. The case's
 * chat asks the same things freely, so it's always a way on. */
function Unavailable({ q, caseHref }: { q: QuestionsController; caseHref: string }) {
  const t = useT();
  const err = q.query.error;
  const message =
    err instanceof ApiError && err.code === "INTAKE_RUNNING"
      ? t("We’re still reading your story. Try again in a moment, or carry on in your case.")
      : t("We couldn’t prepare your questions just now. Try again, or carry on in your case, where we’ll ask as we go.");
  return (
    <div className="flex flex-col gap-4 py-6">
      <p role="alert" className="text-[15px] leading-[1.55] text-ink">
        {message}
      </p>
      <div className="flex flex-wrap gap-2.5">
        <Button variant="primary" size="lg" onClick={() => void q.query.refetch()} disabled={q.query.isFetching}>
          {q.query.isFetching ? t("Trying again…") : t("Try again")}
        </Button>
        <Link href={caseHref} className={buttonClass("soft", "lg")}>
          {t("Go to my case")}
        </Link>
      </div>
    </div>
  );
}
