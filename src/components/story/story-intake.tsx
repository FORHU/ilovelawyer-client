"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, Check, Loader2, Mic, RotateCcw, Sparkles, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatBar, ChatScreen } from "@/components/mobile/chat";
import { useDevice } from "@/components/device/device-provider";
import { LiveDictationStatus } from "@/components/cases/live-dictation-status";
import { useT } from "@/components/site/language-provider";
import { cn } from "@/lib/cn";
import { STEP_COLUMN } from "@/components/steps/step-page";
import { OnboardingHeading } from "@/components/onboarding/onboarding-frame";
import { STORY_FIX_MAX_LENGTH, STORY_MAX_LENGTH, storySegments } from "@/lib/cases/story";
import type { IntakeStoryLine } from "@/lib/types";
import { useStory, type StoryController, type StoryProps } from "./use-story";

/** The story-first way into a new case: "What happened? Just tell us.", by voice or typing, then
 * "Here's your story so far" once the AI has read it. Phone and desktop share the screens; only
 * where the buttons sit differs (a bar at the bottom on a phone, under the text on a desktop). */
export function StoryIntake(props: StoryProps) {
  const t = useT();
  const s = useStory(props);
  const mobile = useDevice() === "mobile";
  const screen = screenName(s);
  const body = <ScreenBody s={s} props={props} />;
  // The first screen's buttons are its own big ones; while reading there's nothing to press yet.
  const actions = screen === "choose" || screen === "check-reading" ? null : <ScreenActions s={s} props={props} />;

  // Each new screen is announced from its heading, so a screen reader hears where it is. Not on the
  // first one (the page's own focus stands), and not away from a box the new screen put the cursor in.
  const heading = useRef<HTMLDivElement>(null);
  const firstScreen = useRef(true);
  useEffect(() => {
    if (firstScreen.current) {
      firstScreen.current = false;
      return;
    }
    const active = document.activeElement;
    if (active instanceof HTMLTextAreaElement && heading.current?.contains(active)) return;
    heading.current?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
  }, [screen]);

  const content = (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div ref={heading} className={cn("flex flex-col gap-5", mobile ? "px-4 py-6" : cn(STEP_COLUMN, "py-8"))}>
        {!s.online && (
          <p role="status" className="flex items-center gap-2 rounded-xl border border-warn-line bg-warn-bg px-3.5 py-2.5 text-[13.5px] leading-[1.45] text-warn-ink">
            <WifiOff size={16} className="shrink-0" aria-hidden="true" />
            {s.view === "check"
              ? t("You’re offline. We’ll carry on when you’re back online.")
              : t("You’re offline. What you’ve written stays here, and you can send it when you’re back online.")}
          </p>
        )}
        {body}
        {s.error && (
          <p role="alert" className="text-[14px] leading-[1.45] text-error">
            {s.error}
          </p>
        )}
        {!mobile && actions && <div className="flex flex-wrap items-center gap-3 pt-2">{actions}</div>}
      </div>
    </div>
  );

  if (!mobile) return <div className="flex min-h-0 flex-1 flex-col">{content}</div>;
  return (
    <ChatScreen>
      {content}
      {actions && (
        <ChatBar>
          <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>
        </ChatBar>
      )}
    </ChatScreen>
  );
}

/** The story's headings are the new-client flow's own (OnboardingHeading), so the story reads as the
 * next step after the privacy one. */
const Heading = OnboardingHeading;

/** A story line, its **marked** detail in bold. Never HTML: every piece is plain text. */
function LineText({ text }: { text: string }) {
  return (
    <>
      {storySegments(text).map((part, i) =>
        part.bold ? (
          <strong key={i} className="font-semibold text-ink">
            {part.text}
          </strong>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}

function StoryLines({ lines }: { lines: IntakeStoryLine[] }) {
  const t = useT();
  return (
    <ul className="flex flex-col gap-3" aria-label={t("What we understood")}>
      {lines.map((line) => (
        <li key={line.id} className="grid grid-cols-[22px_minmax(0,1fr)] gap-2.5 text-[15.5px] leading-[1.5] text-ink">
          {line.kind === "DEADLINE" ? (
            <AlertCircle size={18} className="mt-[3px] text-error" aria-label={t("Deadline")} />
          ) : (
            <Check size={18} className="mt-[3px] text-success" aria-hidden="true" />
          )}
          <span>
            <LineText text={line.text} />
            {line.kind === "DEADLINE" && <span className="text-ink-2"> {t("We’ll keep that date in front of you.")}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function AiNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-subtle px-4 py-3.5">
      <p className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[1.2px] text-gold">
        <Sparkles size={12} aria-hidden="true" />
        ilovelawyer
      </p>
      <p className="mt-1.5 text-[14.5px] leading-[1.5] text-ink">{children}</p>
    </div>
  );
}

function StoryBox({
  id,
  value,
  onChange,
  maxLength,
  label,
  placeholder,
  autoFocus,
  rows = 8,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  label: string;
  placeholder: string;
  autoFocus?: boolean;
  rows?: number;
}) {
  const t = useT();
  const nearLimit = value.length > maxLength * 0.85;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        rows={rows}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="w-full resize-y rounded-2xl border border-line-input bg-surface px-4 py-3.5 text-base leading-[1.6] text-ink outline-none placeholder:text-muted focus:border-line-hover"
      />
      {nearLimit && (
        <p className="self-end text-[12px] tabular-nums text-muted">{t("{count} of {max} characters", { count: value.length, max: maxLength })}</p>
      )}
    </div>
  );
}

function StartOver({ s }: { s: StoryController }) {
  const t = useT();
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <Button variant="quiet" size="sm" onClick={() => setAsking(true)} disabled={s.sending}>
        <RotateCcw size={14} aria-hidden="true" />
        {t("Start over")}
      </Button>
    );
  }
  return (
    <div role="group" aria-label={t("Start over?")} className="flex flex-wrap items-center gap-2 text-[13px] text-ink-2">
      <span>{t("Clear your story and start again?")}</span>
      <Button
        variant="soft"
        size="sm"
        onClick={() => {
          setAsking(false);
          s.startOver();
        }}
      >
        {t("Clear it")}
      </Button>
      <Button variant="quiet" size="sm" onClick={() => setAsking(false)}>
        {t("Keep it")}
      </Button>
    </div>
  );
}

/** Which screen shows, from where the story is: also what moves focus to a new heading. */
function screenName(s: StoryController): string {
  if (s.view === "fix") return "fix";
  if (s.view === "check") return `check-${s.reading}`;
  if (s.recorder.phase !== "idle") return "listening";
  return s.typing || s.text ? "edit" : "choose";
}

function ScreenBody({ s, props }: { s: StoryController; props: StoryProps }) {
  const t = useT();
  const name = screenName(s);

  if (name === "choose") {
    return (
      <>
        <Heading eyebrow={t("Your story")} title={t("What happened? Just tell us.")}>
          {t("Talk the way you’d tell a friend. Don’t worry about missing something. We’ll ask about anything we need.")}
        </Heading>
        <div className="flex flex-col items-center gap-3 py-6">
          <button
            type="button"
            onClick={s.recorder.start}
            data-no-tap
            className="flex size-28 items-center justify-center rounded-full bg-gold text-white shadow-[0_12px_30px_-12px_rgba(140,98,0,0.6)] transition-colors hover:bg-gold-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            aria-describedby="story-talk-label"
          >
            <Mic size={40} aria-hidden="true" />
            <span className="sr-only">{t("Tap to start talking")}</span>
          </button>
          <p id="story-talk-label" className="text-[15px] font-medium text-ink">
            {t("Tap to start talking")}
          </p>
          <Button variant="soft" size="md" onClick={s.typeInstead}>
            {t("Type it instead")}
          </Button>
        </div>
        {s.recorder.error && (
          <p role="alert" className="text-center text-[14px] text-error">
            {t(s.recorder.error)}
          </p>
        )}
        <div className="flex flex-col items-center gap-1 text-center">
          <button type="button" onClick={props.onUseForm} data-no-tap className="min-h-11 text-[14px] font-medium text-ink-2 underline underline-offset-4">
            {t("Prefer a form? Fill it in instead")}
          </button>
          <p className="text-[11.5px] text-muted">{t("AI guidance, not legal advice.")}</p>
        </div>
      </>
    );
  }

  if (name === "listening") {
    return (
      <>
        <Heading eyebrow={t("Your story")} title={t("Tell us what happened")}>
          {t("Take your time. Tap “I’m done talking” when you’ve said it all.")}
        </Heading>
        <div className="rounded-2xl border border-line bg-surface px-3 py-2">
          <LiveDictationStatus phase={s.recorder.phase} seconds={s.recorder.seconds} transcript={s.recorder.transcript} before={s.text} />
        </div>
      </>
    );
  }

  if (name === "edit") {
    return (
      <>
        <Heading eyebrow={t("Your story")} title={t("What happened?")}>
          {t("Start from the beginning. Plain words are fine, and so is a rough draft. Fix anything we misheard.")}
        </Heading>
        <StoryBox
          id="story-text"
          value={s.text}
          onChange={s.setText}
          maxLength={STORY_MAX_LENGTH}
          label={t("Your story")}
          placeholder={t("For example: My manager let me go last week without any notice…")}
          autoFocus={!s.text}
        />
        {s.recorder.error && (
          <p role="alert" className="text-[14px] text-error">
            {t(s.recorder.error)}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="soft" size="sm" onClick={s.recorder.start} disabled={s.sending}>
            <Mic size={15} aria-hidden="true" />
            {s.text.trim() ? t("Keep talking") : t("Talk instead")}
          </Button>
          {s.text.trim() && <StartOver s={s} />}
        </div>
      </>
    );
  }

  if (name === "fix") {
    return (
      <>
        <Heading eyebrow={t("What we understood")} title={t("What did we get wrong?")}>
          {t("Tell us what to fix. We’ll read your story again with it.")}
        </Heading>
        <StoryBox
          id="story-fix"
          value={s.fix}
          onChange={s.setFix}
          maxLength={STORY_FIX_MAX_LENGTH}
          label={t("What to fix")}
          placeholder={t("For example: It was my supervisor, not my manager.")}
          autoFocus
          rows={4}
        />
      </>
    );
  }

  // Checking what we understood.
  if (s.reading === "reading" || s.reading === "slow") {
    return (
      <>
        <Heading eyebrow={t("Your story")} title={t("Understanding your story…")}>
          {s.reading === "slow"
            ? t("This is taking longer than usual. You can carry on, and it will be on your case when it’s ready.")
            : t("This takes a few seconds.")}
        </Heading>
        <div role="status" className="flex items-center gap-2.5 text-[14px] text-ink-2">
          <Loader2 size={18} className="text-gold motion-safe:animate-spin" aria-hidden="true" />
          {t("Reading what you told us")}
        </div>
      </>
    );
  }

  if (s.reading === "unread") {
    return (
      <>
        <Heading eyebrow={t("Your story")} title={t("We’ve saved your story")}>
          {t("We couldn’t read it just now. You can carry on, and we’ll ask about anything we need.")}
        </Heading>
        <blockquote className="whitespace-pre-wrap rounded-2xl border border-line bg-subtle px-4 py-3 text-[14.5px] leading-[1.55] text-ink-2">{s.text.trim()}</blockquote>
      </>
    );
  }

  const lines = s.intake?.storySoFar ?? [];
  return (
    <>
      <Heading eyebrow={t("What we understood")} title={t("Here’s your story so far")} />
      {lines.length > 0 ? (
        <StoryLines lines={lines} />
      ) : (
        <p className="whitespace-pre-wrap text-[15.5px] leading-[1.55] text-ink">{s.intake?.summary || s.text.trim()}</p>
      )}
      <AiNote>{t("To build your case, I need a few more details. I’ll ask one question at a time. Talk, type, or tap a suggestion.")}</AiNote>
    </>
  );
}

function ScreenActions({ s, props }: { s: StoryController; props: StoryProps }) {
  const t = useT();
  const name = screenName(s);
  const mobile = useDevice() === "mobile";
  const wide = mobile ? "w-full" : "";

  if (name === "choose") return null;

  if (name === "listening") {
    return (
      <>
        <Button variant="quiet" size="lg" onClick={s.recorder.cancel}>
          <X size={16} aria-hidden="true" />
          {t("Cancel")}
        </Button>
        <Button variant="primary" size="lg" className={cn(mobile && "flex-1")} onClick={s.recorder.stop} disabled={s.recorder.phase !== "recording"}>
          {t("I’m done talking")}
        </Button>
      </>
    );
  }

  if (name === "edit") {
    return (
      <Button variant="primary" size="lg" className={wide} onClick={s.send} disabled={!s.canSend} aria-busy={s.sending}>
        {s.sending && <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" />}
        {s.sending ? t("Saving your story…") : t("Continue")}
      </Button>
    );
  }

  if (name === "fix") {
    return (
      <>
        <Button variant="quiet" size="lg" onClick={s.closeFix} disabled={s.sendingFix}>
          {t("Cancel")}
        </Button>
        <Button variant="primary" size="lg" className={cn(mobile && "flex-1")} onClick={s.sendFix} disabled={!s.fix.trim() || s.sendingFix || !s.online} aria-busy={s.sendingFix}>
          {s.sendingFix && <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" />}
          {t("Send fix")}
        </Button>
      </>
    );
  }

  const caseId = s.caseId!;
  if (s.reading === "reading") return null;
  const startQuestions = (
    <Button variant="primary" size="lg" className={wide} onClick={() => props.onContinue(caseId)}>
      {t("Start questions")}
    </Button>
  );
  if (s.reading === "slow") return startQuestions;
  return (
    <>
      {startQuestions}
      <Button variant="quiet" size="sm" className={wide} onClick={s.openFix}>
        {t("Something’s not right")}
      </Button>
    </>
  );
}
