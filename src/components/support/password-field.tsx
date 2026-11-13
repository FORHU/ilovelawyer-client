"use client";

import { Field, TextInput } from "@/components/ui/input";

/** The password box a sensitive step asks for. Masked, left to the browser's password manager, and
 * held in the step's own state only: it is never written into the conversation. */
export function PasswordField({
  id,
  value,
  onChange,
  error,
  hint,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  hint: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Field label="Your password" htmlFor={id}>
        <TextInput
          id={id}
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="current-password"
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
          className="text-[16px]"
        />
      </Field>
      <p id={`${id}-hint`} className="text-[13px] leading-[1.5] text-ink-2">
        {hint}
      </p>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-[13px] leading-[1.5] text-error-ink">
          {error}
        </p>
      )}
    </div>
  );
}
