"use client";

import { useState } from "react";
import { useT } from "@/components/site/language-provider";
import { ApiError } from "@/lib/api/fetch";
import {
  isBehind,
  isStillPreparing,
  useAnswerQuestionMutation,
  useQuestionsQuery,
  useSkipQuestionMutation,
  type AnswerVia,
} from "@/lib/cases/questions";
import { useOnline } from "@/lib/use-online";
import { appendSpoken } from "@/lib/voice/live-dictation";
import { useLiveDictation } from "@/lib/voice/use-live-dictation";

/** What the client said to the question they're on, shown at once while it's saved. */
export interface PendingAnswer {
  text: string | null;
  skipped: boolean;
}

/** Everything the Questions screen does, apart from how it's laid out: the case's questions, the
 * answer box (typed or spoken), tapping a chip, skipping, and what's being saved. */
export function useQuestions(caseId: string) {
  const t = useT();
  const query = useQuestionsQuery(caseId);
  const answer = useAnswerQuestionMutation(caseId);
  const skip = useSkipQuestionMutation(caseId);
  const online = useOnline();

  const [text, setText] = useState("");
  // How what's in the box got there: spoken until the client edits it by hand.
  const [via, setVia] = useState<Exclude<AnswerVia, "tap">>("typed");
  const [pending, setPending] = useState<PendingAnswer | null>(null);
  const [error, setError] = useState("");

  const recorder = useLiveDictation({
    onText: (spoken) => {
      setText((before) => appendSpoken(before, spoken));
      setVia("voice");
    },
  });

  const state = query.data;
  const current = state?.status === "OPEN" ? state.current : null;
  const saving = answer.isPending || skip.isPending;

  const failed = (err: unknown, fallback: string) => {
    setPending(null);
    // The screen was behind (answered in another tab, a double tap): the questions are read again,
    // and the right one shows.
    if (isBehind(err)) return;
    setError(err instanceof Error && err.message ? err.message : fallback);
  };

  function send(value: string, how: AnswerVia) {
    const said = value.trim();
    if (!current || saving || !said || !online) return;
    setError("");
    setPending({ text: said, skipped: false });
    if (how !== "tap") setText("");
    answer.mutate(
      { questionId: current.id, text: said, via: how },
      {
        onSuccess: () => {
          setPending(null);
          setVia("typed");
        },
        onError: (err) => {
          // What was typed or said comes back into the box, to send again.
          if (how !== "tap") setText(said);
          failed(err, t("We couldn’t save your answer. Try again."));
        },
      },
    );
  }

  return {
    query,
    state,
    current,
    /** The questions can't be shown yet, and why: the story is still being read, or the list written. */
    preparing: query.isPending ? (isStillPreparing(query.failureReason) && (query.failureReason as ApiError).code === "INTAKE_RUNNING" ? "reading" : "writing") : null,
    online,
    text,
    setText: (value: string) => {
      setText(value);
      setVia("typed");
      if (error) setError("");
    },
    recorder,
    pending,
    saving,
    error,
    /** Sends what's in the box. */
    sendText: () => send(text, via),
    tap: (chip: string) => send(chip, "tap"),
    /** "I don't know, skip": shown as "I'm not sure." in the client's language. */
    skip: () => {
      if (!current || saving || !online) return;
      setError("");
      setPending({ text: null, skipped: true });
      skip.mutate(
        { questionId: current.id, text: t("I’m not sure.") },
        {
          onSuccess: () => setPending(null),
          onError: (err) => failed(err, t("We couldn’t skip that just now. Try again.")),
        },
      );
    },
  };
}

export type QuestionsController = ReturnType<typeof useQuestions>;
