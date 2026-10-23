"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
import { Mail } from "lucide-react";
import { AuthFrame } from "@/components/auth/auth-frame";
import {
  Field,
  FormError,
  FormNotice,
  PasswordInput,
  inputClass,
  labelClass,
  primaryButtonClass,
  textButtonClass,
} from "@/components/auth/form-parts";
import { GoogleButton, GoogleDivider } from "@/components/auth/google-button";
import { PasswordRequirements } from "@/components/auth/password-requirements";
import { TermsReviewDialog } from "@/components/auth/terms-review-dialog";
import { normalizeEmail } from "@/lib/auth/api";
import { EMAIL_REGISTERED_AS_LAWYER, authErrorMessage, isApiError, isLawyerAccountError } from "@/lib/auth/errors";
import {
  SIGNED_IN_PATH,
  useCancelSignupMutation,
  useForgotPasswordMutation,
  useGoogleLinkMutation,
  useGoogleLoginMutation,
  useLoginMutation,
  useRestoreSessionQuery,
  useSendOtpMutation,
  useSignupMutation,
  useVerifyOtpMutation,
} from "@/lib/auth/mutations";
import { isPasswordValid } from "@/lib/auth/password-policy";

type Tab = "signin" | "signup" | "recover";

const OTP_LENGTH = 6;
// Matches the API's EMAIL_VERIFICATION_RESEND_COOLDOWN_MS; a resend inside it is ignored there.
const RESEND_COOLDOWN_SECONDS = 30;

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

export function UnifiedAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const loginMutation = useLoginMutation();
  const signupMutation = useSignupMutation();
  const sendOtpMutation = useSendOtpMutation();
  const verifyOtpMutation = useVerifyOtpMutation();
  const cancelSignupMutation = useCancelSignupMutation();
  const forgotPasswordMutation = useForgotPasswordMutation();
  const googleLoginMutation = useGoogleLoginMutation();
  const googleLinkMutation = useGoogleLinkMutation();
  const { data: sessionStatus } = useRestoreSessionQuery();

  const [tab, setTab] = useState<Tab>(() => tabFromParam(searchParams.get("tab")));
  const [error, setError] = useState<string | null>(null);
  // The error is about a lawyer account: show a link to the lawyer site with it.
  const [lawyerLink, setLawyerLink] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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

  // Email verification step: after Sign Up, or when Sign In finds the email unverified (403).
  const [otpStep, setOtpStep] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpSource, setOtpSource] = useState<"signup" | "signin">("signup");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Google sign-in. The popup's onSuccess is a single callback shared by both tabs, so which
  // remember choice was in effect when it was launched is captured in a ref rather than read
  // from (possibly stale) state inside the callback.
  const googleTokenRef = useRef<string | null>(null);
  const googleRememberRef = useRef(true);
  // Set by a GOOGLE_LINK_REQUIRED 409 — the existing password account's email, which the
  // link step asks the password for.
  const [googleLinkEmail, setGoogleLinkEmail] = useState<string | null>(null);
  const [linkPassword, setLinkPassword] = useState("");

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  // Already signed in on this browser (a live refresh cookie): skip the form.
  useEffect(() => {
    if (sessionStatus === "signedIn") router.replace(SIGNED_IN_PATH);
  }, [sessionStatus, router]);

  function clearMessages() {
    setError(null);
    setLawyerLink(false);
    setNotice(null);
  }

  function fail(err: unknown, step: Parameters<typeof authErrorMessage>[1]) {
    setError(authErrorMessage(err, step));
    setLawyerLink(isLawyerAccountError(err));
  }

  function selectTab(next: Tab) {
    setTab(next);
    clearMessages();
    const params = new URLSearchParams(searchParams.toString());
    if (next === "signin") params.delete("tab");
    else params.set("tab", next);
    const query = params.toString();
    router.replace(query ? `/login?${query}` : "/login", { scroll: false });
  }

  /** Back to an empty Sign In form, once a sign-in succeeds (the session itself is set up by the
   * mutation hooks, see useCompleteSignIn). Next keeps this page mounted but hidden after navigating away
   * (cacheComponents → React <Activity>), so without this the typed password, the OTP step and
   * the email would still be here, in memory and on screen, when the page is shown again. */
  function resetForms() {
    clearMessages();
    setTab("signin");
    setSigninEmail("");
    setSigninPassword("");
    setRemember(false);
    setName("");
    setSignupEmail("");
    setSignupPassword("");
    setConfirmSignupPassword("");
    setAgreed(false);
    setHasReadTerms(false);
    setRecoverEmail("");
    setRecoverSent(false);
    setOtpStep(false);
    setOtpEmail("");
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setResendCooldown(0);
    setGoogleLinkEmail(null);
    setLinkPassword("");
    googleTokenRef.current = null;
  }

  function openOtp(email: string, source: "signup" | "signin") {
    setOtpEmail(normalizeEmail(email));
    setOtpSource(source);
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setOtpStep(true);
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
  }

  function handleSignIn(e: React.SyntheticEvent) {
    e.preventDefault();
    clearMessages();
    loginMutation.mutate(
      { email: signinEmail, password: signinPassword, remember },
      {
        onSuccess: resetForms,
        onError: (err) => {
          if (isApiError(err) && err.status === 403) {
            // Right password, unverified email: verify it here, then the session starts.
            openOtp(signinEmail, "signin");
            setNotice("Verify your email to finish signing in. We sent a new code to your inbox.");
            sendOtpMutation.mutate(signinEmail, { onError: (sendErr) => fail(sendErr, "otp") });
          } else {
            fail(err, "signin");
          }
        },
      },
    );
  }

  function handleSignUp(e: React.SyntheticEvent) {
    e.preventDefault();
    clearMessages();
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
    signupMutation.mutate(
      { name, email: signupEmail, password: signupPassword },
      {
        onSuccess: () => {
          openOtp(signupEmail, "signup");
          sendOtpMutation.mutate(signupEmail, { onError: (err) => fail(err, "otp") });
        },
        onError: (err) => {
          fail(err, "signup");
          if (isApiError(err) && err.code === EMAIL_REGISTERED_AS_LAWYER) document.getElementById("signup-email")?.focus();
        },
      },
    );
  }

  function submitGoogle(idToken: string, remember: boolean) {
    clearMessages();
    googleLoginMutation.mutate(
      { idToken, remember },
      {
        onSuccess: resetForms,
        onError: (err) => {
          // An existing password account owns this email — offer to connect Google to it,
          // which requires that account's password (AuthSvc.linkGoogle).
          if (isApiError(err) && err.code === "GOOGLE_LINK_REQUIRED" && typeof err.body?.email === "string") {
            setLinkPassword("");
            setGoogleLinkEmail(err.body.email);
            return;
          }
          googleTokenRef.current = null;
          fail(err, tab === "signup" ? "signup" : "signin");
        },
      },
    );
  }

  const googleLogin = useGoogleLogin({
    onSuccess: ({ access_token }) => {
      googleTokenRef.current = access_token;
      submitGoogle(access_token, googleRememberRef.current);
    },
    onError: () => setError("Couldn't connect to Google. Try again."),
  });

  function launchGoogle() {
    clearMessages();
    googleRememberRef.current = tab === "signin" ? remember : true;
    googleLogin();
  }

  function exitGoogleLink() {
    googleTokenRef.current = null;
    setGoogleLinkEmail(null);
    setLinkPassword("");
    clearMessages();
  }

  function handleGoogleLink(e: React.SyntheticEvent) {
    e.preventDefault();
    const idToken = googleTokenRef.current;
    if (!idToken || !googleLinkEmail) return;
    clearMessages();
    googleLinkMutation.mutate(
      { idToken, password: linkPassword, remember: googleRememberRef.current },
      {
        onSuccess: () => {
          setGoogleLinkEmail(null);
          setLinkPassword("");
          resetForms();
        },
        onError: (err) => fail(err, "signin"),
      },
    );
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
    clearMessages();
    verifyOtpMutation.mutate(
      { email: otpEmail, code: otpDigits.join(""), source: otpSource },
      {
        onSuccess: resetForms,
        onError: (err) => {
          fail(err, "otp");
          // The code is used up after too many wrong tries: start over with a fresh one.
          if (isApiError(err) && /too many/i.test(err.message)) {
            setOtpDigits(Array(OTP_LENGTH).fill(""));
            setResendCooldown(0);
          }
        },
      },
    );
  }

  function handleResendOtp() {
    if (resendCooldown > 0) return;
    clearMessages();
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    sendOtpMutation.mutate(otpEmail, {
      onSuccess: () => setNotice(`We sent a new code to ${otpEmail}.`),
      onError: (err) => fail(err, "otp"),
    });
  }

  function leaveOtp() {
    setOtpStep(false);
    if (otpSource === "signup") {
      // Frees the address right away; the API only ever deletes an unverified, pending signup.
      cancelSignupMutation.mutate(otpEmail);
      selectTab("signup");
    } else {
      selectTab("signin");
    }
  }

  function handleRecover(e: React.SyntheticEvent) {
    e.preventDefault();
    clearMessages();
    forgotPasswordMutation.mutate(recoverEmail, {
      onSuccess: () => setRecoverSent(true),
      onError: (err) => fail(err, "recover"),
    });
  }

  const otpComplete = otpDigits.every((d) => d !== "");

  const heading = otpStep
    ? "Verify Your Email"
    : googleLinkEmail
      ? "Connect Google"
      : tab === "signup"
      ? "Create Your Account"
      : tab === "recover"
        ? recoverSent
          ? "Instructions Sent"
          : "Account Recovery"
        : "Welcome Back";
  const subheading = otpStep ? (
    <>
      Enter the 6-digit code sent to <span className="font-semibold text-ink">{otpEmail}</span>
    </>
  ) : googleLinkEmail ? (
    <>
      An account already exists for <span className="font-semibold text-ink">{googleLinkEmail}</span>. Enter its
      password to connect Google.
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
    <AuthFrame heading={heading} subheading={subheading}>
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

          <FormNotice message={notice} />
          <FormError message={error} lawyerLink={lawyerLink} />

          <button
            type="button"
            disabled={!otpComplete || verifyOtpMutation.isPending}
            onClick={handleVerifyOtp}
            className={primaryButtonClass}
          >
            {verifyOtpMutation.isPending ? "Verifying…" : <>Verify &amp; Continue</>}
          </button>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || sendOtpMutation.isPending}
              className={textButtonClass}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
            </button>
            <button type="button" onClick={leaveOtp} className={textButtonClass}>
              {otpSource === "signup" ? "Use a different email" : "Back to sign in"}
            </button>
          </div>
        </div>
      ) : googleLinkEmail ? (
        <form onSubmit={handleGoogleLink} className="flex flex-col gap-6">
          <Field id="google-link-password" label="Password">
            <PasswordInput
              id="google-link-password"
              value={linkPassword}
              onChange={setLinkPassword}
              placeholder="Enter the account's password"
              autoComplete="current-password"
            />
          </Field>

          <FormError message={error} lawyerLink={lawyerLink} />

          <button type="submit" disabled={googleLinkMutation.isPending} className={primaryButtonClass}>
            {googleLinkMutation.isPending ? "Connecting…" : "Connect Google"}
          </button>

          <button type="button" onClick={exitGoogleLink} className={textButtonClass}>
            Back to sign in
          </button>
        </form>
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

              <FormError message={error} lawyerLink={lawyerLink} />

              <button type="submit" disabled={loginMutation.isPending} className={primaryButtonClass}>
                {loginMutation.isPending ? "Signing In…" : "Sign In"}
              </button>

              <GoogleDivider />
              <GoogleButton onClick={launchGoogle} pending={googleLoginMutation.isPending} />
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

              <FormError message={error} lawyerLink={lawyerLink} />

              <button
                type="submit"
                disabled={
                  signupMutation.isPending ||
                  !isPasswordValid(signupPassword) ||
                  (confirmSignupPassword !== "" && signupPassword !== confirmSignupPassword)
                }
                className={`${primaryButtonClass} font-semibold tracking-[1.6px]`}
              >
                {signupMutation.isPending ? "Creating Account…" : "Create Account"}
              </button>

              <GoogleDivider />
              <GoogleButton onClick={launchGoogle} pending={googleLoginMutation.isPending} />
            </form>
          )}

          {tab === "recover" &&
            (!recoverSent ? (
              <form onSubmit={handleRecover} className="flex flex-col gap-6">
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

                <FormError message={error} lawyerLink={lawyerLink} />

                <button type="submit" disabled={forgotPasswordMutation.isPending} className={primaryButtonClass}>
                  {forgotPasswordMutation.isPending ? "Sending…" : "Send Reset Link"}
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center gap-8 py-4">
                <div className="flex size-20 items-center justify-center rounded-full border border-gold">
                  <Mail size={36} className="text-gold" strokeWidth={1.5} aria-hidden />
                </div>
                <p className="max-w-90 text-center text-base leading-6.5 text-muted">
                  If an account exists for <span className="font-semibold text-ink">{recoverEmail}</span>, we&apos;ve
                  sent it a secure recovery link. The link works for one hour.
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
    </AuthFrame>
  );
}
