import { BrandLogo } from "@/components/auth/brand-logo";

/** The auth screens' layout: the fixed dark brand panel on the left (wide screens only) and the
 * form column on the right, with its heading and the © footer. Shared by /login and /reset-password. */
export function AuthFrame({
  heading,
  subheading,
  children,
}: {
  heading: string;
  subheading?: React.ReactNode;
  children: React.ReactNode;
}) {
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

          {children}

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
