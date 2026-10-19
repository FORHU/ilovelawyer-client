import Image from "next/image";
import { Logo } from "@/components/ui/misc";
import { Sparkles, ShieldCheck, RotateCcw } from "lucide-react";
import { AuthBackButton } from "@/components/auth/back-button";

const benefits = [
  { icon: Sparkles, text: "$9.99 per case, no subscription" },
  { icon: ShieldCheck, text: "Verified lawyers at a clear price" },
  { icon: RotateCcw, text: "Top up chat credits any time" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh min-h-0">
      {/* Brand panel (web only) */}
      <div className="relative hidden w-[540px] shrink-0 flex-col justify-between overflow-hidden border-r border-line bg-subtle p-10 lg:flex">
        <Image
          src="/brand/hero-2.jpg"
          alt=""
          fill
          sizes="540px"
          className="object-cover opacity-[.14]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-subtle from-30% to-subtle/60" />
        <Logo height={24} className="relative self-start" />
        <div className="relative flex flex-col gap-6">
          <div className="font-display text-[36px] leading-[1.15] tracking-[-0.02em]">
            One case, one clear price. Chat with the AI, bring in a lawyer when it matters.
          </div>
          <ul className="flex flex-col gap-3 text-sm">
            {benefits.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5">
                <Icon size={16} className="text-gold" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="px-5 pt-4 lg:hidden">
          <Logo height={20} />
        </div>
        <div className="m-auto box-border flex w-full max-w-[420px] flex-col gap-5 px-5 pb-8 pt-2 lg:px-10 lg:py-8">
          <AuthBackButton />
          {children}
        </div>
      </div>
    </div>
  );
}
