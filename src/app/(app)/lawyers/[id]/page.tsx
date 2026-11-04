"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Responsive } from "@/components/device/responsive";
import { LawyerProfileDesktop } from "@/components/lawyers/lawyer-profile.desktop";
import { LawyerProfileMobile } from "@/components/lawyers/lawyer-profile.mobile";
import { ErrorBox } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { useLawyerQuery } from "@/lib/lawyers/marketplace";

export default function LawyerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: lawyer, isLoading, error, refetch } = useLawyerQuery(id);

  // The card's "Request" link ends in #request, which isn't on the page until the lawyer loads.
  useEffect(() => {
    if (lawyer && window.location.hash === "#request") document.getElementById("request")?.scrollIntoView();
  }, [lawyer]);

  if (isLoading) return <div className="flex-1" aria-busy />;

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-[640px] flex-col items-start gap-3 px-6 py-16">
        <ErrorBox message="Couldn't load this lawyer." />
        <Button variant="soft" size="sm" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!lawyer) {
    return (
      <div className="mx-auto flex w-full max-w-[640px] flex-col items-start gap-3 px-6 py-16">
        <h1 className="font-display text-[28px]">Lawyer not found</h1>
        <p className="text-sm text-ink-2">They may no longer be listed.</p>
        <Link href="/lawyers" className="text-sm font-medium">
          Back to all lawyers
        </Link>
      </div>
    );
  }

  return <Responsive desktop={<LawyerProfileDesktop lawyer={lawyer} />} mobile={<LawyerProfileMobile lawyer={lawyer} />} />;
}
