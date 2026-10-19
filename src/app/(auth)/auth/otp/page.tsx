"use client";

import { useRouter } from "next/navigation";
import { AuthHeading } from "@/components/auth/heading";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { useApp } from "@/lib/store";

export default function OtpPage() {
  const router = useRouter();
  const { authMethod, phone, email, otp, setField } = useApp();
  const sentTo = authMethod === "phone" ? "+63 " + phone : email;

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (otp.length >= 6) router.push("/auth/profile");
      }}
    >
      <AuthHeading
        title="Enter the 6-digit code"
        sub={`Sent to ${sentTo || "you"}. Demo: any 6 digits work.`}
      />
      <input
        aria-label="6-digit code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={otp}
        onChange={(e) => setField("otp", e.target.value.replace(/\D/g, ""))}
        className={cn(inputClass, "h-[60px] text-center !text-[26px] tracking-[10px]")}
      />
      <Button type="submit" size="lg" className="w-full" disabled={otp.length < 6}>
        Verify
      </Button>
      <div className="text-center text-[13px] text-ink-2">
        Didn&apos;t get it?{" "}
        <a href="#" onClick={(e) => e.preventDefault()}>
          Resend code
        </a>
      </div>
    </form>
  );
}
