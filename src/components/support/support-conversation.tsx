"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp, ChevronRight, LifeBuoy } from "lucide-react";
import { ComposerButton, ComposerPill, QuickReplies, ReplyChip } from "@/components/mobile/chat";
import { INTERACTIVE_ACTIONS, type ActionResult } from "@/lib/support/actions";
import { FALLBACK_SAFETY_COPY } from "@/lib/support/deletion-flow";
import { COPY, type ChatAction, type Prompt } from "@/lib/support/engine";
import { isActiveThread } from "@/lib/support/ticket";
import { useSupportThreadQuery } from "@/lib/support/ticket-queries";
import type { PublishedSupportContent, SupportAudience, SupportOutcomeEvent, SupportThread } from "@/lib/support/types";
import { useSupportChat } from "@/lib/support/use-support-chat";
import { ChoiceList, type Choice } from "./choice-list";
import { DeleteAccountFlow } from "./delete-account-flow";
import { ExportFlow } from "./export-flow";
import { MenuCards } from "./menu-cards";
import { MessageBubble, TypingBubble } from "./message-bubble";
import { TeamThread } from "./team-thread";
import { TicketStarter } from "./ticket-starter";
import { VisitorTicketForm } from "./visitor-ticket-form";

const MENU: Choice = { key: "menu", label: "Back to topics", quiet: true };
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** What the steps in the conversation need to know about where they are. */
interface PromptContext {
  content: PublishedSupportContent;
  audience: SupportAudience;
  act: (action: ChatAction) => void;
  flowPath: string[];
  pathname: string | null;
  /** The signed-in client's conversation with the team, if one is still going. */
  activeThread: SupportThread | null;
  openTeam: () => void;
  report: (event: SupportOutcomeEvent) => void;
}

/** "Talk to a person": the form a visitor or a client writes their message in. */
function TalkToPerson({ ctx, onOpened }: { ctx: PromptContext; onOpened?: () => void }) {
  const { audience, flowPath, pathname, activeThread, act, openTeam, report } = ctx;
  const back = () => act({ type: "SHOW_MENU" });
  // The last topic walked is where it got stuck; the report counts it as the way out.
  const escalated = () => {
    const flowId = flowPath[flowPath.length - 1];
    report({ kind: "ESCALATED", ...(flowId ? { flowId } : {}) });
    onOpened?.();
  };

  if (audience === "SIGNED_OUT") return <VisitorTicketForm flowPath={flowPath} pathname={pathname} onSent={escalated} onBack={back} />;

  if (activeThread) {
    return (
      <div className="flex flex-col gap-2 rounded-card border border-line bg-white p-4">
        <p className="text-[14px] leading-[1.5] text-ink">You already have a conversation open with the team. Anything you write there joins it.</p>
        <ChoiceList
          label="Next step"
          choices={[{ key: "open", label: "Open the conversation", primary: true }, MENU]}
          onPick={(choice) => (choice.key === MENU.key ? back() : openTeam())}
        />
      </div>
    );
  }

  return (
    <TicketStarter
      flowPath={flowPath}
      pathname={pathname}
      onOpened={() => {
        escalated();
        openTeam();
      }}
      onBack={back}
    />
  );
}

function PromptView({ prompt, ctx }: { prompt: Prompt; ctx: PromptContext }) {
  const { content, act } = ctx;
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
      if (prompt.actionKey === "OPEN_TICKET") return <TalkToPerson ctx={ctx} onOpened={() => done({ ok: true })} />;
      const safetyCopy = content.actions.find((a) => a.key === "DELETE_MY_ACCOUNT")?.safetyCopy;
      return <DeleteAccountFlow safetyCopy={safetyCopy?.length ? safetyCopy : FALLBACK_SAFETY_COPY} onDone={done} />;
    }
    case "TALK":
      return <TalkToPerson ctx={ctx} />;
    default:
      return null;
  }
}

/** A way back into the conversation with the team, shown above the help topics while one is going. */
function TeamCard({ thread, onOpen }: { thread: SupportThread; onOpen: () => void }) {
  const unread = thread.unreadCount;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-14 w-full items-center gap-3 rounded-card border border-line-chip bg-white px-4 py-3 text-left transition-colors hover:border-line-hover"
    >
      <LifeBuoy size={18} className="shrink-0 text-gold" aria-hidden />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[15px] font-semibold text-ink">Your conversation with the team</span>
        <span className="text-[13px] text-ink-2">{unread > 0 ? `${unread} new ${unread === 1 ? "reply" : "replies"}` : "Open it to read or reply"}</span>
      </span>
      {unread > 0 && <span aria-hidden className="size-2.5 shrink-0 rounded-full bg-error" />}
      <ChevronRight size={16} className="shrink-0 text-ink-2" aria-hidden />
    </button>
  );
}

/** One conversation with the assistant: the messages, what to do next, and a box to type in. A
 * client who is already writing to the team opens on that conversation instead, and can come back
 * here for the help topics. */
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
  const { messages, typing, prompt, act, flowPath, report } = useSupportChat({ content, audience, firstName, startFlowId });
  const pathname = usePathname();
  const assistant = content.settings.assistantName;
  const scroller = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");

  const thread = useSupportThreadQuery().data;
  const activeThread = audience === "SIGNED_IN" && isActiveThread(thread) ? thread : null;
  // Opens on the team's conversation when there is one going, unless the client has already started
  // something here (a flow asked for, or a question in progress).
  const [chosen, setChosen] = useState<"CHAT" | "TEAM" | null>(null);
  const started = messages.length > 1 || !!startFlowId;
  const view = chosen ?? (activeThread && !started ? "TEAM" : "CHAT");
  const openTeam = () => setChosen("TEAM");

  const promptKind = prompt?.kind;
  // A step that asks for something (a password, a yes, a message) is answered there, not by typing.
  const composerOff = promptKind === "ACTION" || promptKind === "TALK";
  useEffect(() => {
    const el = scroller.current;
    if (el && view === "CHAT") el.scrollTo({ top: el.scrollHeight, behavior: reducedMotion() ? "auto" : "smooth" });
  }, [messages.length, typing, promptKind, view]);

  if (view === "TEAM") {
    return (
      <TeamThread thread={thread} responseTimeLine={content.settings.responseTimeLine} flowPath={flowPath} pathname={pathname} onBack={() => setChosen("CHAT")} />
    );
  }

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

  const ctx: PromptContext = { content, audience, act, flowPath, pathname, activeThread, openTeam, report };

  return (
    <>
      <div ref={scroller} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4">
        {activeThread && <TeamCard thread={activeThread} onOpen={openTeam} />}
        <ol role="log" aria-label="Conversation" className="flex flex-col gap-2.5">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} assistant={assistant} />
          ))}
        </ol>
        {typing && <TypingBubble />}
        {prompt && <PromptView prompt={prompt} ctx={ctx} />}
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
              className="min-h-11 min-w-0 flex-1 bg-transparent px-3 text-[16px] text-ink outline-none placeholder:text-ink-2"
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
