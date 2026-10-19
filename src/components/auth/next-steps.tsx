"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/** Where the user is inside "Create your account", in plain words (no progress bar). */
const STAGE: Record<string, string> = {
  "/auth": "Choose how to sign up",
  "/auth/email": "Add your email and password",
  "/auth/phone": "Enter your phone number",
  "/auth/otp": "Confirm the 6-digit code",
  "/auth/profile": "Tell us about you",
  "/auth/consent": "Review and agree to three things",
};

const SIGN_UP = [
  { title: "Create your account", text: "Free. You only pay when you create a case." },
  { title: "Create a case", text: "$9.99 one-time, with 50 chat credits included." },
  {
    title: "Chat with the AI, then bring in a lawyer",
    text: "Requesting a lawyer is free and included with your case.",
  },
];

const SIGN_IN = [
  { title: "Your cases stay separate", text: "Each case keeps its own chat credits and documents." },
  { title: "Continue the conversation", text: "Pick up your AI consultation or your lawyer chat." },
  { title: "Top up any time", text: "Add chat credits from inside the case that needs them." },
];

export function AuthNext() {
  const pathname = usePathname();
  const signIn = pathname === "/auth/signin";
  const items = signIn ? SIGN_IN : SIGN_UP;
  const stage = STAGE[pathname];

  return (
    <section
      aria-label={signIn ? "Pick up where you left off" : "What happens next"}
      className="motion-rise flex flex-col gap-4 rounded-card border border-line bg-subtle p-5 max-sm:hidden"
      style={{ animationDelay: "200ms" }}
    >
      <h2 className="text-[13px] font-semibold">
        {signIn ? "Pick up where you left off" : "What happens next"}
      </h2>
      <ol className="flex flex-col gap-4">
        {items.map((item, i) => {
          const current = !signIn && i === 0;
          return (
            <li key={item.title} className="flex gap-3" aria-current={current ? "step" : undefined}>
              <span
                aria-hidden
                className={cn(
                  "mt-[5px] size-3 shrink-0 rounded-full border-[1.5px]",
                  current || signIn ? "border-gold bg-gold" : "border-line-input bg-white",
                )}
              />
              <div className="min-w-0 text-sm leading-[1.5]">
                <div className={cn("font-semibold", !current && !signIn && "text-ink-2")}>
                  {item.title}
                </div>
                <div className="text-[13px] text-ink-2">{item.text}</div>
                {current && stage && (
                  <div className="mt-1 text-[13px] font-medium text-gold">
                    <span className="sr-only">Current step: </span>
                    You are here: {stage}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
