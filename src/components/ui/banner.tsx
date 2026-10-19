import { CircleAlert, CircleCheck, X } from "lucide-react";

/** Dismissible success banner shown at the top of the app after payment, sign-in, top-up, request. */
export function SuccessBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      className="flex shrink-0 items-center gap-2.5 border-b border-success-line bg-success-bg px-4 py-2.5 text-[13px] text-success-ink md:px-6"
    >
      <CircleCheck size={15} className="shrink-0" />
      <div className="flex-1">{message}</div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="flex items-center justify-center text-success-ink"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-input border border-error-line bg-error-bg px-[14px] py-3 text-[13px] leading-[1.5] text-error-ink"
    >
      <CircleAlert size={16} className="mt-px shrink-0" />
      <div>{message}</div>
    </div>
  );
}
