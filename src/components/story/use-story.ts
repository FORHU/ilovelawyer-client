"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/site/language-provider";
import { useSensitiveInfoGate } from "@/lib/consent/sensitive-info";
import {
  STORY_MAX_LENGTH,
  STORY_MIN_LENGTH,
  STORY_SPEECH_MAX_SECONDS,
  storyReading,
  useCorrectStoryMutation,
  useRefreshStoryCase,
  useStartStoryMutation,
  useStoryIntakeQuery,
} from "@/lib/cases/story";
import { clearSearchText } from "@/lib/marketing/search-prefill";
import { appendSpoken } from "@/lib/voice/live-dictation";
import { useLiveDictation } from "@/lib/voice/use-live-dictation";
import { useOnline } from "@/lib/use-online";

export interface StoryProps {
  /** Where the story starts from: what was typed on the landing page, or a saved draft. */
  initialText: string;
  /** The story as it changes, before it's sent, to keep as a draft. */
  onTextChange?: (text: string) => void;
  /** The case exists now: it's no longer a draft. */
  onCreated: (caseId: string) => void;
  /** "Start questions": on to the case. */
  onContinue: (caseId: string) => void;
  /** The form instead, for someone who'd rather not tell it. */
  onUseForm: () => void;
}

/** Which screen: telling the story, checking what we understood, or fixing it. */
export type StoryView = "tell" | "check" | "fix";

function messageOf(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/** Everything the story screen does, apart from how it's laid out: the story and its recording,
 * sending it, waiting for the reading, and the fix. */
export function useStory({ initialText, onTextChange, onCreated }: Pick<StoryProps, "initialText" | "onTextChange" | "onCreated">) {
  const t = useT();
  const [text, setText] = useState(initialText);
  // Typing was chosen (or there's already something to read over): the editor shows.
  const [typing, setTyping] = useState(initialText.trim().length > 0);
  const [view, setView] = useState<StoryView>("tell");
  const [caseId, setCaseId] = useState<string | null>(null);
  const [fix, setFix] = useState("");
  const [error, setError] = useState("");
  // When the current reading started, and the time now, ticking only while it's being waited on.
  const [readingSince, setReadingSince] = useState(0);
  const [now, setNow] = useState(0);

  const ensureAgreed = useSensitiveInfoGate();
  const start = useStartStoryMutation();
  const correct = useCorrectStoryMutation(caseId);
  const intake = useStoryIntakeQuery(caseId);
  const refreshCase = useRefreshStoryCase();

  // Spoken words go after anything already there, to read over and fix before sending. One
  // recording carries on past the API's 3 minutes, up to STORY_SPEECH_MAX_SECONDS.
  const recorder = useLiveDictation({
    onText: (spoken) => {
      setText((before) => appendSpoken(before, spoken));
      setTyping(true);
    },
    chainUpTo: STORY_SPEECH_MAX_SECONDS,
  });

  // What was typed into the landing page's search was read into the story; it lands only once.
  useEffect(() => {
    clearSearchText();
  }, []);

  const onTextChangeRef = useRef(onTextChange);
  useEffect(() => {
    onTextChangeRef.current = onTextChange;
  });
  useEffect(() => {
    if (!caseId) onTextChangeRef.current?.(text);
  }, [text, caseId]);

  const online = useOnline();
  // Offline, the intake query pauses rather than fails, so the reading simply waits for the connection.
  const reading = caseId ? storyReading(intake.data, now - readingSince, intake.isError) : null;
  const waiting = view === "check" && (reading === "reading" || reading === "slow");
  useEffect(() => {
    if (!waiting) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [waiting]);

  // A story case gets a suggested title and type of issue with its reading.
  useEffect(() => {
    if (reading === "understood" && caseId) refreshCase(caseId);
  }, [reading, caseId, refreshCase]);

  function beginReading() {
    const at = Date.now();
    setReadingSince(at);
    setNow(at);
    setView("check");
  }

  async function send() {
    const story = text.trim();
    if (story.length < STORY_MIN_LENGTH) {
      setError(t("Tell us a little more: a sentence or two is enough."));
      return;
    }
    // A long recording can say more than fits; the box's own limit only stops typing.
    if (story.length > STORY_MAX_LENGTH) {
      setError(t("Your story is too long to send in one go. Shorten it a little, and you can add the rest when we ask."));
      return;
    }
    setError("");
    // The AI reads it, so the step for sensitive information comes first. Declined, nothing is made
    // and the story stays as it is.
    if (!(await ensureAgreed({ askAgain: true }))) {
      setError(t("We can’t read your story until you agree to how sensitive information is handled. You can fill in the form instead."));
      return;
    }
    start.mutate(story, {
      onSuccess: (started) => {
        setCaseId(started.case.id);
        onCreated(started.case.id);
        beginReading();
      },
      onError: (err) => setError(messageOf(err, t("We couldn’t save your story. Try again."))),
    });
  }

  function sendFix() {
    const value = fix.trim();
    if (!value || !caseId) return;
    setError("");
    correct.mutate(value, {
      onSuccess: () => {
        setFix("");
        beginReading();
      },
      onError: (err) => setError(messageOf(err, t("We couldn’t send your fix. Try again."))),
    });
  }

  return {
    text,
    setText: (value: string) => {
      setText(value);
      if (error) setError("");
    },
    typing,
    typeInstead: () => {
      recorder.clearError();
      setTyping(true);
    },
    /** Clears the story, back to the first screen. Only before it's sent. */
    startOver: () => {
      recorder.cancel();
      recorder.clearError();
      setText("");
      setTyping(false);
      setError("");
    },
    recorder,
    /** Tells the AI nothing yet: there's no case until this is pressed. */
    send: () => void send(),
    sending: start.isPending,
    canSend: online && text.trim().length >= STORY_MIN_LENGTH && !start.isPending && recorder.phase === "idle",
    /** The browser has no connection: nothing can be sent, and what's written stays (as a draft). */
    online,

    view,
    caseId,
    intake: intake.data,
    reading,
    openFix: () => {
      setError("");
      setView("fix");
    },
    closeFix: () => {
      setError("");
      setView("check");
    },
    fix,
    setFix,
    sendFix,
    sendingFix: correct.isPending,
    error,
  };
}

export type StoryController = ReturnType<typeof useStory>;
