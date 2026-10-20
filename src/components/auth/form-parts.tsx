"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { LAWYER_APP_URL } from "@/lib/tenant/client-tenant";

// Building blocks shared by the auth screens (unified-auth.tsx, reset-password-form.tsx).

export const inputClass =
  "w-full rounded-xl border border-b-2 border-line bg-transparent px-3 py-4 text-base text-ink placeholder-muted outline-none transition-colors focus:border-gold";
export const labelClass = "text-xs font-semibold uppercase tracking-[1.2px] text-muted";
export const primaryButtonClass =
  "w-full cursor-pointer rounded-xl border-0 bg-primary py-4 text-base uppercase tracking-[3.2px] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";
export const textButtonClass =
  "cursor-pointer border-0 bg-transparent text-xs font-semibold uppercase tracking-[1.2px] text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50";

export function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
    </div>
  );
}

/** Password input with a show/hide toggle. The toggle only appears once there's something to reveal. */
export function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={shown ? "text" : "password"}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          // The toggle disappears with the last character: re-mask so the next
          // entry doesn't start out revealed with no visible way to hide it.
          if (!e.target.value) setShown(false);
        }}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className={`${inputClass} pr-10`}
      />
      {value && (
        <button
          type="button"
          onClick={() => setShown(!shown)}
          aria-label={shown ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer border-0 bg-transparent p-1 text-muted transition-colors hover:text-ink"
        >
          {shown ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
        </button>
      )}
    </div>
  );
}

/** An error under a form. With `lawyerLink`, it also points a lawyer account at the lawyer site
 * (WRONG_APP, EMAIL_REGISTERED_AS_LAWYER). */
export function FormError({ message, lawyerLink = false }: { message: string | null; lawyerLink?: boolean }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-error">
      {message}
      {lawyerLink && (
        <>
          {" "}
          <a href={LAWYER_APP_URL} className="font-semibold">
            Go to the lawyer site
          </a>
        </>
      )}
    </p>
  );
}

/** A neutral note under a form, e.g. why the person is being asked for a code. */
export function FormNotice({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="text-sm text-ink-2">{message}</p>;
}
