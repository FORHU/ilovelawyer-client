"use client";

import { useState } from "react";
import { ErrorBox } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useWithdrawLawyerRequestMutation } from "@/lib/lawyer-requests/api";

/** Asks before withdrawing a lawyer request. Withdrawing can't be undone, but the client can request again. */
export function WithdrawRequestModal({
  open,
  onClose,
  requestId,
  onWithdrawn,
}: {
  open: boolean;
  onClose: () => void;
  requestId: string;
  onWithdrawn: () => void;
}) {
  const withdraw = useWithdrawLawyerRequestMutation();
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setError(null);
    onClose();
  };

  const confirm = () => {
    setError(null);
    withdraw.mutate(requestId, {
      onSuccess: () => {
        onWithdrawn();
        close();
      },
      onError: (err) => setError(err instanceof Error ? err.message : "Couldn't withdraw the request. Try again."),
    });
  };

  return (
    <Modal
      open={open}
      onClose={close}
      locked={withdraw.isPending}
      title="Withdraw your request?"
      subtitle="Lawyers will stop seeing your case. You can ask for a lawyer again later."
    >
      {error && <ErrorBox message={error} />}
      <div className="flex flex-col-reverse gap-2.5 md:flex-row md:justify-end">
        <Button variant="outline" size="lg" onClick={close} disabled={withdraw.isPending} autoFocus>
          Keep request
        </Button>
        <Button variant="danger" size="lg" onClick={confirm} disabled={withdraw.isPending}>
          {withdraw.isPending ? "Withdrawing…" : error ? "Try again" : "Withdraw request"}
        </Button>
      </div>
    </Modal>
  );
}
