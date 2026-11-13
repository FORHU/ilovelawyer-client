"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp } from "lucide-react";
import { ComposerButton, ComposerPill, QuickReplies, ReplyChip } from "@/components/mobile/chat";
import { INTERACTIVE_ACTIONS, type ActionResult } from "@/lib/support/actions";
import { FALLBACK_SAFETY_COPY } from "@/lib/support/deletion-flow";
import { COPY, type ChatAction, type Prompt } from "@/lib/support/engine";
import type { PublishedSupportContent, SupportAudience } from "@/lib/support/types";
import { useSupportChat } from "@/lib/support/use-support-chat";
import { ChoiceList, type Choice } from "./choice-list";
import { DeleteAccountFlow } from "./delete-account-flow";
import { ExportFlow } from "./export-flow";
import { MenuCards } from "./menu-cards";
import { MessageBubble, TypingBubble } from "./message-bubble";

const MENU: Choice = { key: "menu", label: "Back to topics", quiet: true };
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function PromptView({ prompt, content, act }: { prompt: Prompt; content: PublishedSupportContent; act: (action: ChatAction) => void }) {
  switch (prompt.kind) {
    case "MENU":
      return <MenuCards cards={content.menu} onPick={(card) => act({ type: "START_FLOW", flowId: card.flowId, label: card.title })} />;
    case "CHOICES":
      if (prompt.style !== "BUTTONS") return null;
      return (
        <ChoiceList
          label="Choose an answer"
          choices={prompt.options.map((option, i) => ({ key: String(i), label: option.label }))}
          onPick={(choice) => act({ type: "CHOOSE", index: Number(choice.key) })}
        />
      );
    case "SUGGESTIONS":
      return (
        <ChoiceList
          label="Suggested topics"
          choices={[...prompt.flowIds.map((id) => ({ key: id, label: content.flows[id]?.title ?? id })), MENU]}
          onPick={(choice) => act(choice.key === MENU.key ? { type: "SHOW_MENU" } : { type: "PICK_SUGGESTION", flowId: choice.key })}
        />
      );
    case "TALK_OFFER":
      return (
        <ChoiceList
          label="Next step"
          choices={[{ key: "talk", label: COPY.talk, primary: true }, MENU]}
          onPick={(choice) => act(choice.key === MENU.key ? { type: "SHOW_MENU" } : { type: "TALK" })}
        />
      );
    case "ACTION": {
      if (!INTERACTIVE_ACTIONS.includes(prompt.actionKey)) return null;
      const done = (result: ActionResult) => act({ type: "ACTION_RESULT", ...result });
      if (prompt.actionKey === "EXPORT_MY_DATA") return <ExportFlow onDone={done} />;
      const safetyCopy = content.actions.find((a) => a.key === "DELETE_MY_ACCOUNT")?.safetyCopy;
      return <DeleteAccountFlow safetyCopy={safetyCopy?.length ? safetyCopy : FALLBACK_SAFETY_COPY} onDone={done} />;
    }
    case "TALK":
      return (
        <div className="flex flex-col gap-2">
          <p className="rounded-card border border-warn-line bg-warn-bg px-3.5 py-2.5 text-[13.5px] leading-[1.5] text-warn-ink" role="status">
            Writing to the team from here isn&apos;t switched on yet.
          </p>
          <ChoiceList label="Next step" choices={[MENU]} onPick={() => act({ type: "SHOW_MENU" })} />
        </div>
      );
    default:
      return null;
  }
}

/** One conversation with the assistant: the messages, what to do next, and a box to type in. */
export function SupportConversation({
  content,
  audience,
  firstName,
  startFlowId,
}: {
  content: PublishedSupportContent;
  audience: SupportAudience;
  firstName: string | null;
  startFlowId: string | null;
}) {
  const { messages, typing, prompt, act } = useSupportChat({ content, audience, firstName, startFlowId });
  const assistant = content.settings.assistantName;
  const scroller = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");

  const promptKind = prompt?.kind;
  // A step that asks for something (a password, a yes) is answered there, not by typing.
  const composerOff = promptKind === "ACTION" || promptKind === "TALK";
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reducedMotion() ? "auto" : "smooth" });
  }, [messages.length, typing, promptKind]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim() === "") return;
    act({ type: "TYPE", text });
    setText("");
  };

  const replies =
    prompt?.kind === "CHOICES" && prompt.style === "QUICK_REPLIES"
      ? prompt.options.map((option, i) => ({ key: i, label: option.label, run: () => act({ type: "CHOOSE", index: i }) }))
      : prompt?.kind === "HELP"
        ? [
            { key: 0, label: COPY.yes, run: () => act({ type: "ANSWER_HELP", helped: true }) },
            { key: 1, label: COPY.no, run: () => act({ type: "ANSWER_HELP", helped: false }) },
          ]
        : [];

  return (
    <>
      <div ref={scroller} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4">
        <ol role="log" aria-label="Conversation" className="flex flex-col gap-2.5">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} assistant={assistant} />
          ))}
        </ol>
        {typing && <TypingBubble assistant={assistant} />}
        {prompt && <PromptView prompt={prompt} content={content} act={act} />}
      </div>

      <div className="shrink-0 border-t border-line bg-white px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-2.5">
        {replies.length > 0 && (
          <QuickReplies label="Quick replies">
            {replies.map((reply) => (
              <ReplyChip key={reply.key} onClick={reply.run}>
                {reply.label}
              </ReplyChip>
            ))}
          </QuickReplies>
        )}
        <form onSubmit={submit}>
          <ComposerPill>
            <label htmlFor="support-input" className="sr-only">
              Type your question
            </label>
            <input
              id="support-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={300}
              disabled={composerOff}
              autoComplete="off"
              enterKeyHint="send"
              placeholder="Type your question…"
              className="min-h-11 min-w-0 flex-1 bg-transparent px-3 text-[16px] text-ink outline-none placeholder:text-muted"
            />
            <ComposerButton type="submit" tone="send" aria-label="Send" disabled={composerOff || text.trim() === ""}>
              <ArrowUp size={20} aria-hidden />
            </ComposerButton>
          </ComposerPill>
        </form>
      </div>
    </>
  );
}
