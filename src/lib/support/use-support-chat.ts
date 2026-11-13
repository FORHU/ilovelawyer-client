"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { executeAction, isInteractiveAction } from "./actions";
import { initialState, reduce, type ChatAction, type ChatMessage, type ChatState, type Prompt } from "./engine";
import { postOutcomes } from "./api";
import { createOutcomeReporter } from "./outcomes";
import type { PublishedSupportContent, SupportAudience } from "./types";

/** How long the typing dots show before each assistant message. */
const TYPING_MS = 600;

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export interface SupportChat {
  /** What has been said so far: the assistant's messages come out one at a time. */
  messages: ChatMessage[];
  /** The assistant is about to say something. */
  typing: boolean;
  /** What the client can do next; null while the assistant is still talking. */
  prompt: Prompt | null;
  /** Every flow walked so far. */
  flowPath: string[];
  act: (action: ChatAction) => void;
}

/** Runs one conversation: the engine's state, the assistant's pacing, the statistics it reports
 * and the account actions its flows ask for. */
export function useSupportChat({
  content,
  firstName,
  audience,
  startFlowId,
}: {
  content: PublishedSupportContent;
  firstName: string | null;
  audience: SupportAudience;
  startFlowId: string | null;
}): SupportChat {
  const latest = useRef(content);
  useEffect(() => {
    latest.current = content;
  });

  const [state, setState] = useState<ChatState>(() => initialState(content, firstName));
  const stateRef = useRef(state);
  const [reporter] = useState(() => createOutcomeReporter((events) => postOutcomes(audience, events)));
  // The greeting is out at once; everything after it is paced.
  const [shown, setShown] = useState(1);

  useEffect(() => () => reporter.flush(), [reporter]);

  const act = useCallback(
    (action: ChatAction) => {
      const next = reduce(latest.current, stateRef.current, action);
      if (next.state === stateRef.current) return;
      stateRef.current = next.state;
      setState(next.state);
      next.events.forEach(reporter.push);
    },
    [reporter],
  );

  const started = useRef(false);
  useEffect(() => {
    if (!startFlowId || started.current) return;
    started.current = true;
    act({ type: "START_FLOW", flowId: startFlowId });
  }, [startFlowId, act]);

  useEffect(() => {
    if (shown >= state.messages.length) return;
    const instant = state.messages[shown].from === "user" || reducedMotion();
    const id = setTimeout(() => setShown((n) => n + 1), instant ? 0 : TYPING_MS);
    return () => clearTimeout(id);
  }, [shown, state.messages]);

  const settled = shown >= state.messages.length;

  const asked = useRef(-1);
  useEffect(() => {
    if (!settled || state.prompt.kind !== "ACTION" || isInteractiveAction(state.prompt.actionKey) || asked.current === state.messages.length) return;
    asked.current = state.messages.length;
    let live = true;
    void executeAction(state.prompt.actionKey).then((result) => live && act({ type: "ACTION_RESULT", ...result }));
    return () => {
      live = false;
      asked.current = -1;
    };
  }, [settled, state.prompt, state.messages.length, act]);

  return {
    messages: state.messages.slice(0, shown),
    typing: !settled && state.messages[shown]?.from === "bot",
    prompt: settled ? state.prompt : null,
    flowPath: state.flowPath,
    act,
  };
}
