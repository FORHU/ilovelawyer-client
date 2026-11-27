"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, Check, Keyboard, Loader2, Mic, Plus, RotateCcw, Sparkles, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatBar, ChatScreen } from "@/components/mobile/chat";
import { useDevice } from "@/components/device/device-provider";
import { LiveDictationStatus } from "@/components/cases/live-dictation-status";
import { useT } from "@/components/site/language-provider";
import { cn } from "@/lib/cn";
import { STEP_COLUMN } from "@/components/steps/step-page";
import { OnboardingHeading } from "@/components/onboarding/onboarding-frame";
import { STORY_FIX_MAX_LENGTH, STORY_MAX_LENGTH, STORY_MIN_LENGTH, offersSuggestions, storySegments, storySuggestions } from "@/lib/cases/story";
import { useSite } from "@/components/site/site-provider";
import type { IntakeStoryLine } from "@/lib/types";
import type { StoryFact } from "@/lib/cases/api";
import { useStory, type StoryController, type StoryProps } from "./use-story";

/** The story-first way into a new case: "What happened? Just tell us.", by voice or typing, then
 * "Here's your story so far" once the AI has read it. Phone and desktop share the screens; only
 * where the buttons sit differs (a bar at the bottom on a phone, under the text on a desktop). */
export function StoryIntake(props: StoryProps) {
  const t = useT();
  const s = useStory(props);
  const mobile = useDevice() === "mobile";
  const screen = screenName(s, mobile);
  const body = <ScreenBody s={s} props={props} />;
  // The first screen's buttons are its own big ones; while reading there's nothing to press yet.
  // A desktop's Continue sits in the story card's footer (ScreenBody), under the words it sends.
  const actions =
    screen === "choose" || screen === "check-reading" || (!mobile && screen === "edit") ? null : <ScreenActions s={s} props={props} />;
  // The first screen on a phone: the mic and Type sit in a dock at the bottom, under the thumb.
  const dock = mobile && screen === "choose" ? <TalkDock s={s} /> : null;

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
      <div
        ref={heading}
        className={cn(
          "flex flex-col gap-5",
          mobile ? "px-4 py-5" : cn(STEP_COLUMN, "py-8"),
        )}
      >
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
      {dock && <ChatBar>{dock}</ChatBar>}
    </ChatScreen>
  );
}

/** The story's headings are the new-client flow's own (OnboardingHeading), so the story reads as the
 * next step after the privacy one. */
const Heading = OnboardingHeading;

/** The story while it's read: what they told us, and the facts picked out of it popping in as chips
 * ("Date Mar 3, 2026"), one after another, once they arrive. */
function StoryBeingRead({ text, facts }: { text: string; facts: StoryFact[] }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-3">
      <blockquote className="line-clamp-6 whitespace-pre-wrap rounded-2xl border border-line bg-subtle px-4 py-3.5 text-[15px] leading-normal text-ink">
        {text}
      </blockquote>
      {facts.length > 0 && (
        <ul aria-label={t("What we picked out")} className="flex flex-wrap gap-2">
          {facts.map((fact) => (
            // Added one at a time as they're picked out (useStory), each popping in as it lands.
            <li key={fact.label} className="motion-fact-in rounded-full bg-chip px-3 py-1.5 text-[13px] leading-snug text-ink">
              <span className="font-semibold text-gold">{fact.label}</span> {fact.value}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** How many starters a phone shows before "More…", so the form link stays on the first screen. */
const PHONE_STARTERS = 4;

/** Ways to start (storySuggestions, with this site's own). A tap hands the suggestion over in the
 * client's language, to go in the box. `grouped` names each kind of problem over its prompts, where
 * there's room for it (a desktop); a phone shows the first few as one list, then "More…", and
 * "Something else" (`onOther`) for a problem none of them fits. */
function StorySuggestions({ onPick, onOther, grouped }: { onPick: (text: string) => void; onOther?: () => void; grouped: boolean }) {
  const t = useT();
  const groups = storySuggestions(useSite().code);
  const [all, setAll] = useState(false);
  const chip = (prompt: string) => (
    <button
      key={prompt}
      type="button"
      onClick={() => onPick(t(prompt))}
      className="flex min-h-11 items-center gap-1.5 rounded-full border border-line-input bg-surface py-2 pl-3 pr-4 text-left text-[14.5px] leading-snug text-ink transition-colors hover:border-line-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:bg-chip motion-reduce:transition-none"
    >
      <Plus size={15} className="shrink-0 text-gold" aria-hidden="true" />
      {t(prompt)}
    </button>
  );
  if (!grouped) {
    const prompts = groups.flatMap((group) => group.prompts);
    const shown = all ? prompts : prompts.slice(0, PHONE_STARTERS);
    const plain =
      "flex min-h-11 items-center rounded-full border border-dashed border-line-input px-4 py-2 text-[14.5px] font-medium text-ink-2 transition-colors hover:border-line-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold motion-reduce:transition-none";
    return (
      <div className="flex flex-wrap gap-2">
        {shown.map(chip)}
        {shown.length < prompts.length && (
          <button type="button" onClick={() => setAll(true)} className={plain}>
            {t("More…")}
          </button>
        )}
        {onOther && (
          <button type="button" onClick={onOther} className={plain}>
            {t("Something else")}
          </button>
        )}
      </div>
    );
  }
  // Columns follow the room it's given (a container query), not the window: the first screen's side
  // panel is narrower than the editor's full width.
  const starter = (prompt: string) => (
    <li key={prompt}>
      <button
        type="button"
        onClick={() => onPick(t(prompt))}
        className="group flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2 text-left text-[14px] leading-snug text-ink transition-colors hover:border-line-hover hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:bg-chip motion-reduce:transition-none"
      >
        <Plus size={15} className="shrink-0 text-gold" aria-hidden="true" />
        <span className="min-w-0">{t(prompt)}</span>
      </button>
    </li>
  );
  return (
    <div className="@container">
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 @md:grid-cols-2 @3xl:grid-cols-4">
        {groups.map((group) => (
          <div key={group.area} role="group" aria-labelledby={`starter-${group.area}`} className="flex flex-col gap-2">
            <p id={`starter-${group.area}`} className="text-[12.5px] font-semibold text-ink-2">
              {t(group.area)}
            </p>
            <ul className="flex flex-col gap-1.5">{group.prompts.map(starter)}</ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The big mic on a phone's first screen. A flat halo (no blur) marks it as the way in without a glow. */
function TalkButton({ s }: { s: StoryController }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={s.recorder.start}
      data-no-tap
      aria-label={t("Tap to start talking")}
      className="flex size-18 shrink-0 items-center justify-center rounded-full bg-gold text-white shadow-[0_0_0_8px_var(--color-gold-soft)] transition-[background-color,transform] hover:bg-gold-hover active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-[12px] focus-visible:outline-gold motion-reduce:transition-none"
    >
      <Mic size={28} aria-hidden="true" />
    </button>
  );
}

/** The way out to the form, and what the AI's answers are (and aren't). */
function FormLink({ onUseForm, center }: { onUseForm: () => void; center?: boolean }) {
  const t = useT();
  return (
    <div className={cn("flex flex-col gap-1", center ? "items-center text-center" : "items-start")}>
      <button type="button" onClick={onUseForm} data-no-tap className="min-h-11 text-[14px] font-medium text-ink-2 underline underline-offset-4 hover:text-ink">
        {t("Prefer a form? Fill it in instead")}
      </button>
    </div>
  );
}

function Disclaimer() {
  const t = useT();
  return <p className="text-[12.5px] text-ink-2">{t("AI guidance, not legal advice.")}</p>;
}

/** A phone's first screen, at the bottom: Type on the left, the mic in the middle, under the thumb. */
function TalkDock({ s }: { s: StoryController }) {
  const t = useT();
  return (
    <div className="flex flex-col items-center gap-1 pt-2">
      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center">
        <button
          type="button"
          onClick={s.typeInstead}
          className="flex min-h-11 items-center gap-1.5 justify-self-start rounded-full px-3 text-[14px] font-medium text-ink-2 hover:text-ink"
        >
          <Keyboard size={18} aria-hidden="true" />
          {t("Type")}
        </button>
        <TalkButton s={s} />
        <span />
      </div>
      <p className="pt-2 text-[13px] font-medium text-ink-2">{t("Tap to start talking")}</p>
      {/* In the dock, not the scroll area, so it's never hidden under the bar. */}
      <Disclaimer />
    </div>
  );
}

/** Puts the cursor at the end of the story box once it's on screen, after a suggestion fills it. */
function focusStoryEnd() {
  setTimeout(() => {
    const box = document.getElementById("story-text");
    if (!(box instanceof HTMLTextAreaElement)) return;
    box.focus();
    box.setSelectionRange(box.value.length, box.value.length);
  }, 0);
}

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
  note,
  tools,
  status,
  action,
  footer,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  label: string;
  placeholder: string;
  autoFocus?: boolean;
  rows?: number;
  /** Over the text, inside the card: e.g. a reminder to check words that were heard. */
  note?: ReactNode;
  /** The card's footer, left side: the mic and Start over. */
  tools?: ReactNode;
  /** The card's footer, right side, when the character count isn't showing. */
  status?: ReactNode;
  /** The card's footer, far right: the step's own button (Continue), on a desktop. */
  action?: ReactNode;
  /** Shown in place of the whole footer, e.g. while asking whether to clear the story. */
  footer?: ReactNode;
}) {
  const t = useT();
  const nearLimit = value.length > maxLength * 0.85;
  const right = nearLimit ? (
    <span className="tabular-nums">{t("{count} of {max} characters", { count: value.length, max: maxLength })}</span>
  ) : (
    status
  );
  return (
    <ComposerCard>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {note}
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        rows={rows}
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-describedby={right ? `${id}-status` : undefined}
        // Grows with the story where the browser can (field-sizing), so the footer stays under the last line.
        className="block max-h-[55svh] min-h-40 w-full resize-none bg-transparent px-4 py-3.5 text-base leading-[1.6] text-ink outline-none [field-sizing:content] placeholder:text-muted"
      />
      {footer ||
        ((tools || right || action) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line px-2 py-2">
            {tools}
            <div className="ml-auto flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
              {right && (
                <p id={`${id}-status`} aria-live="polite" className="px-2 text-[12.5px] text-muted">
                  {right}
                </p>
              )}
              {action}
            </div>
          </div>
        ))}
    </ComposerCard>
  );
}

/** The story's box: one card that holds the text (or the live words) and its tools, so moving
 * between typing and talking keeps everything in the same place. */
function ComposerCard({ children, live }: { children: ReactNode; live?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border bg-surface transition-colors focus-within:border-line-hover motion-reduce:transition-none",
        live ? "border-gold" : "border-line-input",
      )}
    >
      {children}
    </div>
  );
}

/** The mic inside the story card: big enough to find with a thumb, gold like the first screen's. */
function CardMic({ s, className }: { s: StoryController; className?: string }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={s.recorder.start}
      disabled={s.sending}
      data-no-tap
      className={cn(
        "flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-gold-soft px-4 text-[14px] font-medium text-ink transition-colors hover:bg-chip focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-50 motion-reduce:transition-none",
        className,
      )}
    >
      <span className="flex size-7 items-center justify-center rounded-full bg-gold text-white">
        <Mic size={15} aria-hidden="true" />
      </span>
      {s.text.trim() ? t("Keep talking") : t("Talk instead")}
    </button>
  );
}

function StartOver({ s, onAsk }: { s: StoryController; onAsk: () => void }) {
  const t = useT();
  return (
    <Button id="story-start-over" variant="quiet" size="sm" className="min-h-11" onClick={onAsk} disabled={s.sending}>
      <RotateCcw size={14} aria-hidden="true" />
      {t("Start over")}
    </Button>
  );
}

/** Asked in the story card's footer before Start over clears it: keeping is the default (it has the
 * focus, and Escape picks it), clearing is marked as the one that loses words. */
function ClearConfirm({ onClear, onKeep }: { onClear: () => void; onKeep: () => void }) {
  const t = useT();
  return (
    <div
      role="group"
      aria-labelledby="story-clear-title"
      aria-describedby="story-clear-text"
      onKeyDown={(e) => {
        if (e.key === "Escape") onKeep();
      }}
      className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-error-line bg-error-bg px-4 py-3"
    >
      <div className="flex min-w-[12rem] flex-1 items-start gap-2.5">
        <AlertCircle size={18} className="mt-0.5 shrink-0 text-error" aria-hidden="true" />
        <div className="flex flex-col gap-0.5">
          <p id="story-clear-title" className="text-[14px] font-semibold text-ink">
            {t("Clear your story?")}
          </p>
          <p id="story-clear-text" className="text-[13px] leading-[1.45] text-ink-2">
            {t("Everything you’ve written or said here will be deleted. You can’t undo this.")}
          </p>
        </div>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Button variant="soft" size="sm" className="min-h-11" onClick={onKeep} autoFocus>
          {t("Keep my story")}
        </Button>
        <Button variant="soft" size="sm" className="min-h-11 !border-error-line !text-error hover:!border-error" onClick={onClear}>
          {t("Clear story")}
        </Button>
      </div>
    </div>
  );
}

function ContinueButton({ s, className, size = "lg" }: { s: StoryController; className?: string; size?: "md" | "lg" }) {
  const t = useT();
  return (
    <Button variant="primary" size={size} className={className} onClick={s.send} disabled={!s.canSend} aria-busy={s.sending}>
      {s.sending && <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" />}
      {s.sending ? t("Saving your story…") : t("Continue")}
    </Button>
  );
}

/** Which screen shows, from where the story is: also what moves focus to a new heading. A desktop
 * opens on the text box (most people there type), with the mic inside it; a phone opens on the
 * big mic first. */
function screenName(s: StoryController, mobile: boolean): string {
  if (s.view === "fix") return "fix";
  if (s.view === "check") return `check-${s.reading}`;
  if (s.recorder.phase !== "idle") return "listening";
  return s.typing || s.text || !mobile ? "edit" : "choose";
}

/** A phone's first screen: the heading and a few starters, with the mic in the dock below
 * (TalkDock), so it all fits without scrolling. */
function ChooseScreen({ s, props }: { s: StoryController; props: StoryProps }) {
  const t = useT();
  const pick = (text: string) => {
    s.setText(text);
    s.typeInstead();
    focusStoryEnd();
  };
  return (
    <>
      <Heading eyebrow={t("Your story")} title={t("What happened? Just tell us.")}>
        {t("Talk the way you’d tell a friend. We’ll ask about anything we need.")}
      </Heading>
      {s.recorder.error && (
        <p role="alert" className="text-[14px] text-error">
          {t(s.recorder.error)}
        </p>
      )}
      <section aria-labelledby="story-suggestions-title" className="flex flex-col gap-2.5">
        <h2 id="story-suggestions-title" className="text-[14px] font-medium text-ink-2">
          {t("Or start from one of these")}
        </h2>
        <StorySuggestions
          grouped={false}
          onPick={pick}
          onOther={() => {
            s.typeInstead();
            focusStoryEnd();
          }}
        />
      </section>
      <FormLink onUseForm={props.onUseForm} center />
    </>
  );
}

function ScreenBody({ s, props }: { s: StoryController; props: StoryProps }) {
  const t = useT();
  const mobile = useDevice() === "mobile";
  const site = useSite().code;
  const name = screenName(s, mobile);
  // Start over is asking to confirm, in the story card's footer.
  const [clearing, setClearing] = useState(false);

  if (name === "choose") return <ChooseScreen s={s} props={props} />;

  if (name === "listening") {
    return (
      <>
        <Heading eyebrow={t("Your story")} title={t("Tell us what happened")}>
          {t("Take your time. Tap “I’m done talking” when you’ve said it all.")}
        </Heading>
        {/* The same card as the typed story, so the words stay where they'll land. */}
        <ComposerCard live>
          <div className="min-h-40 px-3 py-2">
            <LiveDictationStatus phase={s.recorder.phase} seconds={s.recorder.seconds} transcript={s.recorder.transcript} before={s.text} grow />
          </div>
        </ComposerCard>
      </>
    );
  }

  if (name === "edit") {
    const short = s.text.trim().length < STORY_MIN_LENGTH;
    return (
      <>
        <Heading eyebrow={t("Your story")} title={t("What happened? Just tell us.")}>
          {t("Start from the beginning. Plain words are fine, and so is a rough draft.")}
        </Heading>
        {s.recorder.error && (
          <p role="alert" className="flex items-start gap-2 text-[14px] leading-[1.45] text-error">
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            {t(s.recorder.error)}
          </p>
        )}
        <StoryBox
          id="story-text"
          value={s.text}
          onChange={s.setText}
          maxLength={STORY_MAX_LENGTH}
          label={t("Your story")}
          placeholder={t("For example: My manager let me go last week without any notice…")}
          autoFocus={!s.text}
          note={
            s.heard && (
              <p className="flex items-start gap-2 border-b border-line bg-gold-soft px-4 py-2.5 text-[13.5px] leading-[1.45] text-ink">
                <Check size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
                {t("We wrote down what we heard. Read it over and fix any words we got wrong.")}
              </p>
            )
          }
          // A phone's mic sits in the bottom bar beside Continue (ScreenActions), under the thumb and
          // above the keyboard; the card keeps only Start over and the hint, on one line.
          tools={
            <>
              {!mobile && <CardMic s={s} />}
              {s.text.trim() && <StartOver s={s} onAsk={() => setClearing(true)} />}
            </>
          }
          // Says why Continue is off: also when the box is empty.
          status={short ? t("A sentence or two is enough") : null}
          action={!mobile && <ContinueButton s={s} size="md" />}
          footer={
            clearing && (
              <ClearConfirm
                onClear={() => {
                  setClearing(false);
                  s.startOver();
                }}
                onKeep={() => {
                  setClearing(false);
                  // Back to the button that asked, once it's on screen again.
                  setTimeout(() => document.getElementById("story-start-over")?.focus(), 0);
                }}
              />
            )
          }
        />
        {offersSuggestions(s.text, t, site) && (
          <section aria-labelledby="story-starters-title" className="flex flex-col gap-3 pt-2">
            <div className="flex flex-col gap-0.5">
              <h2 id="story-starters-title" className="text-[15px] font-semibold text-ink">
                {t("Not sure where to start?")}
              </h2>
              <p className="text-[13.5px] text-ink-2">{t("Pick one, then change it however you like.")}</p>
            </div>
            <StorySuggestions
              grouped={!mobile}
              onPick={(text) => {
                s.setText(text);
                focusStoryEnd();
              }}
            />
          </section>
        )}
        {/* A desktop has no first screen of its own any more, so its way to the form is here. */}
        {!mobile && (
          <div className="flex flex-col items-center gap-1 text-center">
            <FormLink onUseForm={props.onUseForm} center />
            <Disclaimer />
          </div>
        )}
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
        <StoryBeingRead text={s.text} facts={s.facts} />
        <div role="status" className="flex items-center gap-2.5 text-[14px] text-ink-2">
          <Loader2 size={18} className="text-gold motion-safe:animate-spin" aria-hidden="true" />
          {t("Reading what you told us")}
        </div>
        {/* The case exists from here on (it's made when the story is sent), so they're told. */}
        <p className="flex items-start gap-2 text-[13.5px] leading-[1.45] text-ink-2">
          <Check size={16} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
          {t("Saved to your cases. You can come back to it any time.")}
        </p>
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
  const mobile = useDevice() === "mobile";
  const name = screenName(s, mobile);
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
    if (!mobile) return <ContinueButton s={s} />;
    return (
      <>
        <CardMic s={s} className="min-h-12" />
        <ContinueButton s={s} className="flex-1" />
      </>
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
