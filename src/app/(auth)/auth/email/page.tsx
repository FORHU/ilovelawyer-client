"use client";

import { useRouter } from "next/navigation";
import { AuthHeading } from "@/components/auth/heading";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/input";
import { useApp } from "@/lib/store";

export default function EmailPage() {
  const router = useRouter();
  const { email, password, setField } = useApp();

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        router.push("/auth/otp");
      }}
    >
      <AuthHeading
        title="Sign up with email"
        sub="We'll send a 6-digit code to confirm it's you."
      />
      <Field label="Email" htmlFor="email">
        <TextInput
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setField("email", e.target.value)}
        />
      </Field>
      <Field label="Password" htmlFor="password">
        <TextInput
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setField("password", e.target.value)}
        />
      </Field>
      <div className="-mt-2 text-xs text-muted">At least 8 characters.</div>
      <Button type="submit" size="lg" className="w-full">
        Send code
      </Button>
    </form>
  );
}
