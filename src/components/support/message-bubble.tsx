"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TypingDots } from "@/components/ui/typing-dots";
import { cn } from "@/lib/cn";
import type { ChatMessage } from "@/lib/support/engine";
import { useSupport } from "@/lib/support/store";

/** One message: the assistant's on the left, the client's on the right. A screen reader hears who
 * said it. */
export function MessageBubble({ message, assistant }: { message: ChatMessage; assistant: string }) {
  const mine = message.from === "user";
  return (
    <li className={cn("flex max-w-[86%] flex-col gap-2", mine ? "items-end self-end" : "items-start self-start")}>
      <p className={cn("whitespace-pre-wrap break-words rounded-card px-3.5 py-2.5 text-[15px] leading-[1.5]", mine ? "bg-gold text-white" : "bg-chip text-ink")}>
        <span className="sr-only">{mine ? "You: " : `${assistant}: `}</span>
        {message.text}
      </p>
      {message.link && (
        <Link
          href={message.link.href}
          onClick={() => useSupport.getState().close()}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-chip bg-white px-4 text-[14px] font-medium text-ink hover:border-line-hover"
        >
          {message.link.label}
          <ArrowRight size={15} className="text-gold" aria-hidden />
        </Link>
      )}
    </li>
  );
}

/** The assistant is writing. */
export function TypingBubble({ assistant }: { assistant: string }) {
  return (
    <div role="status" aria-label={`${assistant} is typing`} className="flex w-fit items-center gap-1 self-start rounded-card bg-chip px-4 py-3.5">
      <TypingDots />
    </div>
  );
}
