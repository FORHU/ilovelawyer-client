"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderPlus, Plus } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/misc";
import { ErrorBox } from "@/components/ui/banner";
import { useCasesQuery } from "@/lib/cases/queries";
import { CASE_CREDITS, CASE_PRICE, money } from "@/lib/pricing";
import { creditsLeft, lawyerLabel, useApp } from "@/lib/store";
import { AREA_LABELS } from "@/lib/types";

export default function CasesPage() {
  const router = useRouter();
  const { data: cases = [], isPending, error } = useCasesQuery();
  const { lawyer, credits } = useApp();
  const count = isPending ? "Loading your cases…" : `${cases.length} ${cases.length === 1 ? "case" : "cases"}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[960px] flex-1 flex-col gap-6 px-4 pt-8 md:px-10 md:pb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <Eyebrow>Case portfolio</Eyebrow>
            <h1 className="font-display text-[32px] font-normal tracking-[-0.02em]">
              Your cases
            </h1>
            <div className="text-sm text-ink-2">
              {count}. Each case is {money(CASE_PRICE)} and includes {CASE_CREDITS} chat
              credits.
            </div>
          </div>
          <Link
            href="/cases/new"
            className={buttonClass("primary", "md", "max-md:hidden no-underline text-white hover:text-white")}
          >
            <Plus size={15} />
            New case
          </Link>
        </div>

        {error && <ErrorBox message={error.message} />}

        {isPending ? null : cases.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {cases.map((c) => {
              const law = lawyer.caseId === c.id && lawyer.status !== "none";
              return (
                <Link
                  key={c.id}
                  href={`/cases/${c.id}`}
                  className="flex flex-col gap-2.5 rounded-card border border-line bg-white p-[18px] text-ink no-underline transition-colors hover:border-line-hover"
                >
                  <div className="flex items-center justify-between">
                    <Eyebrow>{AREA_LABELS[c.area]}</Eyebrow>
                    {law && <span className="text-[11px] text-gold">{lawyerLabel(lawyer.status)}</span>}
                  </div>
                  <div className="font-display text-xl leading-[1.3] tracking-[-0.02em]">
                    {c.title}
                  </div>
                  <div className="text-xs text-muted">
                    {c.others.length + 1} parties · {c.documents.length} documents ·{" "}
                    {creditsLeft(credits, c.id)} credits
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-modal border border-dashed border-line-input px-6 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-full border border-line text-gold">
              <FolderPlus size={20} />
            </div>
            <div className="font-display text-2xl tracking-[-0.02em]">Create your first case</div>
            <div className="max-w-[380px] text-sm leading-[1.6] text-ink-2">
              Each case keeps your details, documents and AI consultation in one place.{" "}
              {money(CASE_PRICE)} per case, with {CASE_CREDITS} chat credits included.
            </div>
            <Button className="mt-1.5" onClick={() => router.push("/cases/new")}>
              New case
            </Button>
          </div>
        )}

        {/* Phone: sticky bottom CTA */}
        <div className="sticky bottom-0 z-[2] -mx-4 mt-auto border-t border-line bg-white px-4 pb-[30px] pt-3 md:hidden">
          <Button size="xl" className="w-full" onClick={() => router.push("/cases/new")}>
            <Plus size={16} />
            New case · {money(CASE_PRICE)}
          </Button>
        </div>
      </div>
    </div>
  );
}
