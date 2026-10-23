import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetch";
import { useSession } from "@/lib/auth/session";
import { DOCUMENT_ACCEPT } from "@/components/ui/file-picker";

/** What the API accepts in an upload (GET /api/client/limits). */
export interface UploadLimits {
  upload: { extensions: string[]; maxBytes: number };
}

export function getLimits() {
  return apiFetch<UploadLimits>("/api/client/limits");
}

export function useLimitsQuery() {
  const userId = useSession((s) => s.user?.id);
  return useQuery({ queryKey: ["limits", userId ?? "signed-out"], queryFn: getLimits, enabled: !!userId, staleTime: 1000 * 60 * 60 });
}

const extensionOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

/** The types this app offers, as the API accepts them: ["pdf", "docx", …]. */
export function offeredExtensions(limits?: UploadLimits) {
  const offered = DOCUMENT_ACCEPT.split(",").map((e) => e.replace(".", ""));
  return limits ? offered.filter((e) => limits.upload.extensions.includes(e)) : offered;
}

/** "PDF, DOC, DOCX, XLSX, TXT, JPG, JPEG or PNG, up to 1 GB at a time" */
export function describeLimits(limits?: UploadLimits) {
  const types = offeredExtensions(limits).map((e) => e.toUpperCase());
  const list = types.length > 1 ? `${types.slice(0, -1).join(", ")} or ${types.at(-1)}` : types.join("");
  if (!limits) return list;
  const gb = limits.upload.maxBytes / 1024 ** 3;
  return `${list}, up to ${gb >= 1 ? `${Math.round(gb)} GB` : `${Math.round(limits.upload.maxBytes / 1024 ** 2)} MB`} at a time`;
}

/** Splits picked or dropped files into those the API will take and reasons for those it won't, so a
 * dropped file the file dialog would have filtered out is turned away before it uploads. */
export function checkFiles(files: File[], limits?: UploadLimits) {
  const types = offeredExtensions(limits);
  const accepted: File[] = [];
  const rejected: string[] = [];
  let total = 0;
  for (const file of files) {
    if (!types.includes(extensionOf(file.name))) {
      rejected.push(`${file.name} isn't a type we can read.`);
    } else if (limits && total + file.size > limits.upload.maxBytes) {
      rejected.push(`${file.name} would go over the upload size limit.`);
    } else {
      total += file.size;
      accepted.push(file);
    }
  }
  return { accepted, rejected };
}
