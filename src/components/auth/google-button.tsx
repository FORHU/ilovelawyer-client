"use client";

// Mirrors ilovelawyer-app's placement: a secondary option below the primary submit button,
// separated by an "OR" divider.

export function GoogleDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-line" />
      <span className="text-[10px] uppercase tracking-[0.5px] text-muted">Or</span>
      <div className="h-px flex-1 bg-line" />
    </div>
  );
}

export function GoogleButton({ onClick, pending }: { onClick: () => void; pending: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-line bg-transparent py-4 text-base text-ink transition-colors hover:border-gold disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616Z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        />
        <path fill="#FBBC05" d="M3.964 10.706a5.41 5.41 0 0 1 0-3.412V4.962H.957a8.996 8.996 0 0 0 0 8.076l3.007-2.332Z" />
        <path
          fill="#EA4335"
          d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962l3.007 2.332C4.672 5.167 6.656 3.58 9 3.58Z"
        />
      </svg>
      {pending ? "Connecting…" : "Continue with Google"}
    </button>
  );
}
