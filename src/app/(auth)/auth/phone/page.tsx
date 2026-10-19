"use client";

import { useRouter } from "next/navigation";
import { AuthHeading } from "@/components/auth/heading";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/input";
import { useApp } from "@/lib/store";

export default function PhonePage() {
  const router = useRouter();
  const { phone, setField } = useApp();

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        router.push("/auth/otp");
      }}
    >
      <AuthHeading
        title="Enter your phone number"
        sub="We'll text you a 6-digit code. Message rates may apply."
      />
      <Field label="Mobile number" htmlFor="phone">
        <div className="flex gap-2">
          <div className="box-border flex h-12 w-[76px] shrink-0 items-center justify-center rounded-input border border-line-input bg-subtle text-[15px]">
            +63
          </div>
          <TextInput
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={phone}
            onChange={(e) => setField("phone", e.target.value)}
          />
        </div>
      </Field>
      <Button type="submit" size="lg" className="w-full">
        Send code
      </Button>
    </form>
  );
}
