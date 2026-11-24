"use client";

import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { useT } from "@/components/site/language-provider";
import { SENSITIVE_INFO_POINTS, useSensitiveInfoPrompt, useSetSensitiveInfoMutation } from "@/lib/consent/sensitive-info";

/** What the client agrees to, as a list. */
export function SensitiveInfoPoints() {
  const t = useT();
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[13px] leading-[1.55] text-ink-2">
      {SENSITIVE_INFO_POINTS.map((point) => (
        <li key={point}>{t(point)}</li>
      ))}
    </ul>
  );
}

/**
 * The separate step for sensitive information (#173), opened by useSensitiveInfoGate just before a
 * message, an upload or a new case would first reach the AI. Agreeing and declining are both saved,
 * so a client who declined isn't asked again for an upload; closing it with the X or Escape saves
 * nothing and asks again next time. Mounted once, in the app shell.
 */
export function SensitiveInfoModal() {
  const open = useSensitiveInfoPrompt((s) => s.settle !== null);
  const close = useSensitiveInfoPrompt((s) => s.close);
  const set = useSetSensitiveInfoMutation();
  const t = useT();

  const answer = (granted: boolean) => {
    set.mutate({ granted, source: "case_step" }, { onSuccess: () => close(granted) });
  };
  const dismiss = () => {
    set.reset();
    close(false);
  };

  return (
    <Modal
      open={open}
      onClose={dismiss}
      locked={set.isPending}
      size="lg"
      title={t("Before the AI reads your case")}
      subtitle={t("What you write and upload may include sensitive information. We ask for your agreement on its own, apart from the Terms.")}
    >
      <SensitiveInfoPoints />
      <p className="text-[13px] leading-[1.55] text-ink-2">
        <Link href="/privacy" target="_blank" className="underline underline-offset-2 hover:text-ink">
          {t("Read the Privacy Policy")}
        </Link>
      </p>
      {set.isError && <ErrorBox message={t("Couldn’t save your answer. Try again.")} />}
      <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
        <Button variant="soft" size="lg" disabled={set.isPending} onClick={() => answer(false)}>
          {t("I don’t agree")}
        </Button>
        <Button variant="dark" size="lg" disabled={set.isPending} onClick={() => answer(true)}>
          {set.isPending ? t("Saving…") : t("I agree")}
        </Button>
      </div>
    </Modal>
  );
}
