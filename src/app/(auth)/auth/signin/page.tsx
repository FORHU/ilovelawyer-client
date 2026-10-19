"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthHeading } from "@/components/auth/heading";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/input";
import { useApp } from "@/lib/store";

export default function SignInPage() {
  const router = useRouter();
  const { email, password, setField, setAuthMethod, signIn } = useApp();

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        signIn();
        router.push("/cases");
      }}
    >
      <AuthHeading title="Welcome back" sub="Sign in to pick up your cases." />
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setField("password", e.target.value)}
        />
      </Field>
      <Button type="submit" size="lg" className="w-full">
        Sign in
      </Button>
      <div className="text-center text-[13px] text-ink-2">
        New here?{" "}
        <Link href="/auth/email" onClick={() => setAuthMethod("email")}>
          Create an account
        </Link>
      </div>
    </form>
  );
}
