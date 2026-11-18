import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetch";
import { useSession } from "@/lib/auth/session";
import { DOCUMENT_ACCEPT } from "@/components/ui/file-picker";
import { tr } from "@/lib/i18n/translate";

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

/** "PDF, DOC or PNG" */
function listTypes(types: string[]) {
  const upper = types.map((e) => e.toUpperCase());
  return upper.length > 1 ? tr("{list} or {last}", { list: upper.slice(0, -1).join(", "), last: upper.at(-1)! }) : upper.join("");
}

/** "PDF, DOC, DOCX, XLSX, TXT, JPG, JPEG or PNG, up to 1 GB at a time" */
export function describeLimits(limits?: UploadLimits) {
  const list = listTypes(offeredExtensions(limits));
  if (!limits) return list;
  const gb = limits.upload.maxBytes / 1024 ** 3;
  const size = gb >= 1 ? `${Math.round(gb)} GB` : `${Math.round(limits.upload.maxBytes / 1024 ** 2)} MB`;
  return tr("{types}, up to {size} at a time", { types: list, size });
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
      rejected.push(tr("{name} isn't a type we can read. We accept {types}.", { name: file.name, types: listTypes(types) }));
    } else if (limits && total + file.size > limits.upload.maxBytes) {
      rejected.push(tr("{name} would go over the upload size limit.", { name: file.name }));
    } else {
      total += file.size;
      accepted.push(file);
    }
  }
  return { accepted, rejected };
}
