"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { matchProblem, PROBLEMS } from "@/lib/marketing/problems";
import type { HeroModel } from "./use-hero";

export interface HowChat {
  msg: string;
  /** How much of msg has been typed into the composer. */
  n: number;
  sent: boolean;
  /** 0 nothing yet, 1 typing dots, 2 the reply. */
  reply: 0 | 1 | 2;
  question: string;
  /** The case's name in the mini app, and the area shown above it. */
  label: string;
  area: string;
  help: string;
}

const QUESTION = "When did this start, and do you have any letters or messages about it?";
const QUIET: HowChat = {
  msg: "I've been told to move out",
  n: 0,
  sent: false,
  reply: 0,
  question: QUESTION,
  label: "Eviction notice",
  area: "Housing",
  help: "We explain what your notice means and how long you have.",
};

/** What the story's two views share: which screen the laptop shows, and the phone's chat, which
 * replays the problem the visitor typed or has selected in the hero. */
export function useHow(hero: Pick<HeroModel, "live" | "search">) {
  const [scene, setScene] = useState(0);
  const [chat, setChat] = useState<HowChat>(QUIET);
  const [imagesWanted, setImagesWanted] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { live, search } = hero;

  const startChat = useCallback(() => {
    clearTimeout(timer.current);
    const q = (search.input.current?.value ?? "").trim();
    const typedEnough = q.length >= 3;
    const match = typedEnough ? matchProblem(q) : -1;
    const problem = PROBLEMS[match >= 0 ? match : live.current.selected];
    const msg = typedEnough ? q : problem.say;
    const help = `${problem.help.split(", then")[0].replace(/\.$/, "")}.`;
    setChat({ msg, n: 0, sent: false, reply: 0, question: QUESTION, label: problem.label, area: problem.tag, help });
    let n = 0;
    const type = () => {
      n++;
      setChat((c) => ({ ...c, n }));
      if (n < msg.length) {
        timer.current = setTimeout(type, 34 + Math.random() * 40);
        return;
      }
      timer.current = setTimeout(() => {
        setChat((c) => ({ ...c, sent: true, reply: 1 }));
        timer.current = setTimeout(() => setChat((c) => ({ ...c, reply: 2 })), 1300);
      }, 550);
    };
    timer.current = setTimeout(type, 300);
  }, [live, search.input]);

  const resetChat = useCallback(() => {
    clearTimeout(timer.current);
    setChat((c) => ({ ...c, n: 0, sent: false, reply: 0 }));
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { scene, setScene, chat, startChat, resetChat, imagesWanted, setImagesWanted };
}

export type HowModel = ReturnType<typeof useHow>;
