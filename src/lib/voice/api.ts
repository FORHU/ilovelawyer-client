import { apiFetch } from "@/lib/api/fetch";

// Speaking instead of typing (ilovelawyer-api /api/client/dictations, AWS Transcribe). The clip is
// sent, the text comes back, and the API keeps neither the audio nor a record of it.

export type DictationStatus = "IN_PROGRESS" | "COMPLETED" | "FAILED";

export interface DictationResult {
  status: DictationStatus;
  text?: string;
}

/** The file extension AWS Transcribe needs, from what this browser recorded. */
function extensionOf(mimeType: string) {
  const type = mimeType.split(";")[0]?.toLowerCase();
  if (type === "audio/mp4") return "mp4";
  if (type === "audio/ogg") return "ogg";
  return "webm";
}

export function startDictation(clip: Blob): Promise<{ id: string }> {
  const body = new FormData();
  body.append("audio", clip, `dictation.${extensionOf(clip.type)}`);
  return apiFetch<{ id: string }>("/api/client/dictations", { method: "POST", body });
}

export function getDictation(id: string): Promise<DictationResult> {
  return apiFetch<DictationResult>(`/api/client/dictations/${id}`);
}
