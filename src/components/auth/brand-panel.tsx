"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/misc";

const BENEFITS = [
  { icon: Sparkles, text: "$9.99 per case, no subscription" },
  { icon: ShieldCheck, text: "Verified lawyers at a clear price" },
  { icon: RotateCcw, text: "Top up chat credits any time" },
];

/**
 * Left half (desktop) / top band (tablet). The photograph runs at full strength;
 * the headline sits in a flat block beneath it, never over the picture.
 */
export function BrandPanel() {
  const signIn = usePathname() === "/auth/signin";

  return (
    <aside className="hidden shrink-0 flex-col bg-subtle sm:flex lg:h-dvh lg:w-1/2">
      <div className="relative h-[220px] overflow-hidden sm:h-[240px] lg:h-auto lg:min-h-0 lg:flex-1">
        <Image
          src="/brand/hero-2.jpg"
          alt="A lawyer on the phone at her desk in a bright office"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="motion-settle object-cover"
          style={{ objectPosition: "72% 78%" }}
        />
        <div className="absolute left-6 top-6 bg-subtle px-4 py-3 lg:left-10 lg:top-10">
          <Logo height={24} />
        </div>
      </div>

      <div className="flex flex-col gap-6 px-6 py-8 sm:px-10 lg:gap-8 lg:px-14 lg:py-12">
        <div className="flex flex-col gap-4">
          <h2 className="motion-rise font-display text-[clamp(32px,4.4vw,76px)] font-normal leading-[1.02] tracking-[-0.03em]">
            {signIn ? (
              <>
                Your cases, right where you left them.
              </>
            ) : (
              <>
                One case,
                <br />
                one clear price.
              </>
            )}
          </h2>
          <p
            className="motion-rise max-w-[36ch] text-balance text-lg leading-[1.5] lg:text-xl"
            style={{ animationDelay: "80ms" }}
          >
            {signIn
              ? "Sign in and carry on with your case."
              : "Chat with the AI, bring in a lawyer when it matters."}
          </p>
        </div>
        <ul
          className="motion-rise hidden flex-col gap-3.5 text-base lg:flex"
          style={{ animationDelay: "120ms" }}
        >
          {BENEFITS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <Icon size={18} className="shrink-0 text-gold" aria-hidden />
              {text}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
