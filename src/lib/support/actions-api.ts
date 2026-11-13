import { apiFetch, apiFetchBlob } from "@/lib/api/fetch";
import type { SupportCaseCredits, SupportDeletionCheck, SupportLawyerRequest, SupportPayment } from "./types";

// The Support Actions a signed-in client can run (ilovelawyer-api /api/client/support/actions).
// Exporting data and deleting the account run on their own endpoints, below and in auth/api.ts.

const run = <T>(key: string) => apiFetch<T>(`/api/client/support/actions/${key}`, { method: "POST", body: "{}" });

export const checkPayment = () => run<{ payments: SupportPayment[] }>("CHECK_PAYMENT");
export const showCredits = () => run<{ cases: SupportCaseCredits[] }>("SHOW_CREDITS");
export const showLawyerRequests = () => run<{ requests: SupportLawyerRequest[] }>("SHOW_LAWYER_REQUESTS");
export const sendPasswordReset = () => run<{ sent: true } | { sent: false; reason: "GOOGLE_ACCOUNT" }>("SEND_PASSWORD_RESET");

/** What stands between the client and deleting the account: open lawyer requests, whether a
 * password is needed (not for a Google account), and the credits that would be lost. */
export const fetchDeletionCheck = () => apiFetch<SupportDeletionCheck>("/api/client/support/actions/deletion-check");

/** Everything the account holds, as a ZIP the browser saves. A password account confirms with its
 * password; a Google account sends none. */
export async function downloadMyData(password?: string): Promise<void> {
  const { blob, filename } = await apiFetchBlob("/api/users/me/export", { method: "POST", body: JSON.stringify(password ? { password } : {}) });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename ?? "ilovelawyer-my-data.zip";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
