import { AuthBackButton } from "@/components/auth/back-button";
import { BrandPanel } from "@/components/auth/brand-panel";
import { Logo } from "@/components/ui/misc";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh lg:flex-row">
      <BrandPanel />

      <main className="flex min-w-0 flex-1 flex-col lg:overflow-y-auto">
        <div className="px-5 pt-4 sm:hidden">
          <Logo height={20} />
        </div>
        <div className="m-auto box-border sm:max-lg:mb-auto sm:max-lg:mt-0 flex w-full max-w-[440px] flex-col gap-5 px-5 pb-8 pt-2 sm:px-0 sm:py-10 lg:gap-6 lg:py-12 2xl:max-w-[500px]">
          <AuthBackButton />
          {children}
        </div>
      </main>
    </div>
  );
}
