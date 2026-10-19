"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Smartphone } from "lucide-react";
import { AuthHeading } from "@/components/auth/heading";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";

export default function WelcomePage() {
  const router = useRouter();
  const setAuthMethod = useApp((s) => s.setAuthMethod);

  const go = (method: "email" | "phone" | "social", href: string) => {
    setAuthMethod(method);
    router.push(href);
  };

  return (
    <div className="flex flex-col gap-5">
      <AuthHeading
        title="Create your account"
        sub="Create a free account. You only pay when you create a case."
      />
      <div className="flex flex-col gap-2.5">
        <Button variant="social" size="lg" onClick={() => go("social", "/auth/profile")}>
          <span className="text-[15px] font-bold">G</span>
          Continue with Google
        </Button>
        <Button variant="social" size="lg" onClick={() => go("phone", "/auth/phone")}>
          <Smartphone size={17} />
          Continue with phone number
        </Button>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted">
        <div className="h-px flex-1 bg-line" />
        or
        <div className="h-px flex-1 bg-line" />
      </div>
      <Button variant="social" size="lg" onClick={() => go("email", "/auth/email")}>
        <Mail size={17} />
        Sign up with email
      </Button>
      <div className="text-center text-[13px] text-ink-2">
        Already have an account? <Link href="/auth/signin">Log in</Link>
      </div>
    </div>
  );
}
