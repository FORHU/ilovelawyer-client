"use client";

import { useRouter } from "next/navigation";
import { AuthHeading } from "@/components/auth/heading";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/input";
import { useApp } from "@/lib/store";

export default function ProfilePage() {
  const router = useRouter();
  const { fullName, city, setField } = useApp();

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        router.push("/auth/consent");
      }}
    >
      <AuthHeading
        title="About you"
        sub="Lawyers see your name and city only after they accept your request."
      />
      <Field label="Full name" htmlFor="fullName">
        <TextInput
          id="fullName"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setField("fullName", e.target.value)}
        />
      </Field>
      <Field label="City" htmlFor="city">
        <TextInput
          id="city"
          autoComplete="address-level2"
          value={city}
          onChange={(e) => setField("city", e.target.value)}
        />
      </Field>
      <Button type="submit" size="lg" className="w-full">
        Continue
      </Button>
    </form>
  );
}
