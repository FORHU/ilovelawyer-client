"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail } from "lucide-react";
import { BrandLogo } from "@/components/auth/brand-logo";
import { PasswordRequirements } from "@/components/auth/password-requirements";
import { TermsReviewDialog } from "@/components/auth/terms-review-dialog";
import { isPasswordValid } from "@/lib/auth/password-policy";
import { useApp } from "@/lib/store";

type Tab = "signin" | "signup" | "recover";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;
const SIGNED_IN_PATH = "/cases";

const TABS: { key: Tab; label: string }[] = [
  { key: "signin", label: "Sign In" },
  { key: "signup", label: "Sign Up" },
  { key: "recover", label: "Recover" },
];

function tabFromParam(value: string | null): Tab {
  if (value === "signup") return "signup";
  if (value === "recover") return "recover";
  return "signin";
}

const inputClass =
  "w-full rounded-xl border border-b-2 border-line bg-transparent px-3 py-4 text-base text-ink placeholder-muted outline-none transition-colors focus:border-gold";
const labelClass = "text-xs font-semibold uppercase tracking-[1.2px] text-muted";
const primaryButtonClass =
  "w-full cursor-pointer rounded-xl border-0 bg-primary py-4 text-base uppercase tracking-[3.2px] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";
const textButtonClass =
  "cursor-pointer border-0 bg-transparent text-xs font-semibold uppercase tracking-[1.2px] text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50";

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
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
function PasswordInput({
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

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-error">
      {message}
    </p>
  );
}

export function UnifiedAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setField, signIn, completeOnboarding } = useApp();

  const [tab, setTab] = useState<Tab>(() => tabFromParam(searchParams.get("tab")));
  const [error, setError] = useState<string | null>(null);

  // Sign in
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const [remember, setRemember] = useState(false);

  // Sign up
  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmSignupPassword, setConfirmSignupPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);

  // Recover
  const [recoverEmail, setRecoverEmail] = useState("");
  const [recoverSent, setRecoverSent] = useState(false);

  // Post-signup OTP step
  const [otpStep, setOtpStep] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  function selectTab(next: Tab) {
    setTab(next);
    setError(null);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "signin") params.delete("tab");
    else params.set("tab", next);
    const query = params.toString();
    router.replace(query ? `/login?${query}` : "/login", { scroll: false });
  }

  function handleSignIn(e: React.SyntheticEvent) {
    e.preventDefault();
    setError(null);
    // Mock: any credentials open the demo account until the API exists.
    setField("email", signinEmail);
    signIn();
    router.push(SIGNED_IN_PATH);
  }

  function startOtp() {
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setOtpStep(true);
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
  }

  function handleSignUp(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!isPasswordValid(signupPassword)) {
      setError("Password does not meet the requirements below.");
      return;
    }
    if (signupPassword !== confirmSignupPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setError("You must agree to the Terms of Service.");
      return;
    }
    setError(null);
    startOtp();
  }

  function handleOtpDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) otpRefs.current[index - 1]?.focus();
  }

  function handleOtpPaste(index: number, e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    e.preventDefault();
    setOtpDigits((prev) => {
      const next = [...prev];
      for (let i = 0; i < pasted.length && index + i < OTP_LENGTH; i++) {
        next[index + i] = pasted.charAt(i);
      }
      return next;
    });
    otpRefs.current[Math.min(index + pasted.length, OTP_LENGTH - 1)]?.focus();
  }

  function handleVerifyOtp() {
    setError(null);
    // Mock: any complete code verifies until the API exists.
    setField("email", signupEmail);
    completeOnboarding();
    setField("fullName", name);
    router.push(SIGNED_IN_PATH);
  }

  function handleResendOtp() {
    if (resendCooldown > 0) return;
    setError(null);
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
  }

  const otpComplete = otpDigits.every((d) => d !== "");

  const heading = otpStep
    ? "Verify Your Email"
    : tab === "signup"
      ? "Create Your Account"
      : tab === "recover"
        ? recoverSent
          ? "Instructions Sent"
          : "Account Recovery"
        : "Welcome Back";
  const subheading = otpStep ? (
    <>
      Enter the 6-digit code sent to <span className="font-semibold text-ink">{signupEmail}</span>
    </>
  ) : tab === "recover" ? (
    recoverSent ? (
      "Check your email for the recovery link."
    ) : (
      "Enter your email to receive secure recovery instructions."
    )
  ) : tab === "signin" ? (
    "Sign in to pick up your cases."
  ) : null;

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-surface">
      {/* LEFT: fixed dark brand panel */}
      <div className="relative hidden flex-col lg:flex" style={{ width: "58%" }}>
        <div className="absolute inset-0 bg-navy-950" />
        <div
          className="absolute inset-0 opacity-70"
          style={{ background: "radial-gradient(ellipse at 40% 50%, var(--color-navy-800) 0%, var(--color-navy-950) 65%)" }}
        />

        <div className="absolute left-16 top-16 z-10">
          <BrandLogo size={40} ink="#ffffff" />
        </div>

        <div className="absolute inset-0 z-10 flex flex-col items-start justify-center pl-16 pr-12">
          <div className="mb-8 h-0.5 w-12 bg-gold" />
          <blockquote className="mb-5 max-w-100 font-display text-[24px] italic leading-9.5 text-white">
            &ldquo;The law is reason, free from passion.&rdquo;
          </blockquote>
          <p className="text-[11px] uppercase tracking-[2.5px] text-[rgba(224,227,229,0.45)]">— Aristotle</p>
        </div>
      </div>

      {/* RIGHT: form */}
      <div className="relative flex flex-1 flex-col items-center justify-start overflow-y-auto bg-surface px-8 py-10 md:px-26.5">
        <div className="my-auto flex w-full max-w-md flex-col gap-8">
          <div className="flex flex-col gap-1 pt-20">
            <h1 className="font-display text-[40px] font-normal leading-12 text-ink">{heading}</h1>
            {subheading && <p className="text-base leading-6 text-muted">{subheading}</p>}
          </div>

          {otpStep ? (
            <div className="flex flex-col gap-6">
              <div className="flex w-full justify-between gap-3">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={(e) => handleOtpPaste(i, e)}
                    className="h-14 w-12 rounded-xl border border-b-2 border-line bg-transparent text-center text-xl font-semibold text-ink outline-none transition-colors focus:border-gold"
                  />
                ))}
              </div>

              <FormError message={error} />

              <button
                type="button"
                disabled={!otpComplete}
                onClick={handleVerifyOtp}
                className={primaryButtonClass}
              >
                Verify &amp; Continue
              </button>

              <div className="flex items-center justify-between">
                <button type="button" onClick={handleResendOtp} disabled={resendCooldown > 0} className={textButtonClass}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpStep(false);
                    selectTab("signup");
                  }}
                  className={textButtonClass}
                >
                  Use a different email
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tab navigation */}
              <div role="tablist" className="flex gap-8 border-b border-line pb-px">
                {TABS.map(({ key, label }) => {
                  const active = tab === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => selectTab(key)}
                      className={`relative cursor-pointer border-0 bg-transparent pb-3.5 text-xs uppercase tracking-[1.2px] transition-colors ${
                        active ? "font-semibold text-ink" : "font-normal text-muted hover:text-ink"
                      }`}
                    >
                      {label}
                      {active && <div className="absolute inset-x-0 bottom-0 h-0.5 bg-ink" />}
                    </button>
                  );
                })}
              </div>

              {tab === "signin" && (
                <form onSubmit={handleSignIn} className="flex flex-col gap-6">
                  <Field id="signin-email" label="Email Address">
                    <input
                      id="signin-email"
                      type="email"
                      autoComplete="email"
                      value={signinEmail}
                      onChange={(e) => setSigninEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className={inputClass}
                    />
                  </Field>

                  <Field id="signin-password" label="Password">
                    <PasswordInput
                      id="signin-password"
                      value={signinPassword}
                      onChange={setSigninPassword}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                  </Field>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={remember}
                      onClick={() => setRemember(!remember)}
                      className="group flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0"
                    >
                      <span className="relative size-4 shrink-0 border-2 border-line bg-surface transition-colors group-hover:border-gold">
                        {remember && <span className="absolute inset-0.5 bg-ink" />}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.5px] text-muted">Remember Session</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => selectTab("recover")}
                      className="cursor-pointer border-0 bg-transparent p-0 text-[10px] uppercase tracking-[0.5px] text-muted underline-offset-2 transition-colors hover:text-gold hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <FormError message={error} />

                  <button type="submit" className={primaryButtonClass}>
                    Sign In
                  </button>
                </form>
              )}

              {tab === "signup" && (
                <form onSubmit={handleSignUp} className="flex flex-col gap-5">
                  <Field id="signup-name" label="Full Name">
                    <input
                      id="signup-name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="E.g. Juan dela Cruz"
                      required
                      className={inputClass}
                    />
                  </Field>

                  <Field id="signup-email" label="Email Address">
                    <input
                      id="signup-email"
                      type="email"
                      autoComplete="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="juan.cruz@example.com"
                      required
                      className={inputClass}
                    />
                  </Field>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="signup-password" className={labelClass}>
                      Password
                    </label>
                    <PasswordInput
                      id="signup-password"
                      value={signupPassword}
                      onChange={setSignupPassword}
                      placeholder="Create a password"
                      autoComplete="new-password"
                    />
                    {signupPassword && <PasswordRequirements password={signupPassword} />}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="signup-confirm" className={labelClass}>
                      Confirm Password
                    </label>
                    <PasswordInput
                      id="signup-confirm"
                      value={confirmSignupPassword}
                      onChange={setConfirmSignupPassword}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                    />
                    {confirmSignupPassword && signupPassword !== confirmSignupPassword && (
                      <p className="text-xs text-error">Passwords do not match.</p>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={agreed}
                      aria-label="Agree to the Terms of Service"
                      title={hasReadTerms ? "Agree to the Terms of Service" : "Please read the Terms of Service before agreeing."}
                      onClick={() => (hasReadTerms ? setAgreed(!agreed) : setTermsDialogOpen(true))}
                      className={`relative mt-1 size-5 shrink-0 cursor-pointer rounded-sm border-2 border-ink/40 bg-surface p-0 transition-colors hover:border-gold ${
                        !hasReadTerms ? "opacity-50" : ""
                      }`}
                    >
                      {agreed && <span className="absolute inset-0.5 rounded-[1px] bg-ink" />}
                    </button>
                    <p className="text-base leading-6.5 text-muted">
                      I agree to the{" "}
                      <button
                        type="button"
                        onClick={() => setTermsDialogOpen(true)}
                        className="cursor-pointer border-0 bg-transparent p-0 text-base font-semibold text-ink underline-offset-2 transition-colors hover:text-gold hover:underline"
                      >
                        Terms of Service
                      </button>
                      .
                    </p>
                  </div>

                  <TermsReviewDialog
                    open={termsDialogOpen}
                    onOpenChange={setTermsDialogOpen}
                    onAgree={() => {
                      setHasReadTerms(true);
                      setAgreed(true);
                    }}
                  />

                  <FormError message={error} />

                  <button
                    type="submit"
                    disabled={
                      !isPasswordValid(signupPassword) ||
                      (confirmSignupPassword !== "" && signupPassword !== confirmSignupPassword)
                    }
                    className={`${primaryButtonClass} font-semibold tracking-[1.6px]`}
                  >
                    Create Account
                  </button>
                </form>
              )}

              {tab === "recover" &&
                (!recoverSent ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setError(null);
                      if (recoverEmail) setRecoverSent(true);
                    }}
                    className="flex flex-col gap-6"
                  >
                    <Field id="recover-email" label="Email Address">
                      <input
                        id="recover-email"
                        type="email"
                        autoComplete="email"
                        value={recoverEmail}
                        onChange={(e) => setRecoverEmail(e.target.value)}
                        placeholder="name@example.com"
                        required
                        className={inputClass}
                      />
                    </Field>

                    <FormError message={error} />

                    <button type="submit" className={primaryButtonClass}>
                      Send Reset Link
                    </button>
                  </form>
                ) : (
                  <div className="flex flex-col items-center gap-8 py-4">
                    <div className="flex size-20 items-center justify-center rounded-full border border-gold">
                      <Mail size={36} className="text-gold" strokeWidth={1.5} aria-hidden />
                    </div>
                    <p className="max-w-90 text-center text-base leading-6.5 text-muted">
                      A secure recovery link has been dispatched to{" "}
                      <span className="font-semibold text-ink">{recoverEmail}</span>. Please check your
                      email.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setRecoverSent(false);
                        selectTab("signin");
                      }}
                      className={`${primaryButtonClass} rounded-none`}
                    >
                      Back to Sign In
                    </button>
                  </div>
                ))}
            </>
          )}

          <div className="flex items-center justify-between border-t border-line pt-8">
            <span className="text-xs font-semibold tracking-[1.2px] text-muted">
              © {new Date().getFullYear()} ILOVELAWYER
            </span>
            <div className="flex gap-4">
              {["Support", "Privacy"].map((label) => (
                <button
                  key={label}
                  type="button"
                  className="cursor-pointer border-0 bg-transparent text-xs font-semibold uppercase tracking-[1.2px] text-muted underline decoration-line transition-colors hover:text-ink"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
