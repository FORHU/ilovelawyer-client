import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/session";
import type { Case, CaseDocument } from "@/lib/types";
import { createCase, getCase, listCases, listMessages, sendMessage, uploadDocument, type NewCase } from "./api";

// TanStack Query hooks for the client's cases. The request functions live in ./api.ts.

/** How often to check while something is happening in the background (the AI answering, a
 * document being read). */
const BUSY_POLL_MS = 1500;
const DOCUMENT_POLL_MS = 4000;

/** Keyed by account as well, so a session that ends without a sign-out (an expired refresh) never
 * shows the next account the previous one's cases. */
export const caseKeys = {
  all: (userId: string | undefined) => ["cases", userId ?? "signed-out"] as const,
  list: (userId: string | undefined) => [...caseKeys.all(userId), "list"] as const,
  detail: (userId: string | undefined, id: string) => [...caseKeys.all(userId), "detail", id] as const,
  messages: (userId: string | undefined, id: string) => [...caseKeys.all(userId), "messages", id] as const,
};

function useUserId() {
  return useSession((s) => s.user?.id);
}

export function useCasesQuery() {
  const userId = useUserId();
  return useQuery({ queryKey: caseKeys.list(userId), queryFn: listCases, enabled: !!userId });
}

function stillReading(c: Case | undefined) {
  return !!c?.documents.some((d) => d.status === "PENDING");
}

export function useCaseQuery(id: string) {
  const userId = useUserId();
  return useQuery({
    queryKey: caseKeys.detail(userId, id),
    queryFn: () => getCase(id),
    enabled: !!userId,
    // Picks up a document once the API has read it.
    refetchInterval: (q) => (stillReading(q.state.data) ? DOCUMENT_POLL_MS : false),
  });
}

export function useMessagesQuery(caseId: string) {
  const userId = useUserId();
  return useQuery({
    queryKey: caseKeys.messages(userId, caseId),
    queryFn: () => listMessages(caseId),
    enabled: !!userId,
    staleTime: 0,
    refetchInterval: (q) => (q.state.data?.replying ? BUSY_POLL_MS : false),
  });
}

export function useCreateCaseMutation() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: (input: NewCase) => createCase(input),
    onSuccess: (created) => {
      queryClient.setQueryData(caseKeys.detail(userId, created.id), created);
      queryClient.invalidateQueries({ queryKey: caseKeys.list(userId) });
    },
  });
}

export function useSendMessageMutation(caseId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: (text: string) => sendMessage(caseId, text),
    onSettled: () => queryClient.invalidateQueries({ queryKey: caseKeys.messages(userId, caseId) }),
  });
}

/** Uploads files one after another. Resolves with what went in and what didn't, rather than
 * failing the whole batch for one bad file. */
export function useUploadDocumentsMutation(caseId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (files: File[]) => {
      const added: CaseDocument[] = [];
      const failed: { name: string; reason: string }[] = [];
      for (const file of files) {
        try {
          added.push(await uploadDocument(caseId, file));
        } catch (err) {
          failed.push({ name: file.name, reason: err instanceof Error ? err.message : "Upload failed" });
        }
      }
      return { added, failed };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(userId, caseId) });
      queryClient.invalidateQueries({ queryKey: caseKeys.list(userId) });
    },
  });
}

/** For uploading right after creating a case, before any component for it is mounted. */
export async function uploadAll(caseId: string, files: File[]) {
  const failed: string[] = [];
  for (const file of files) {
    try {
      await uploadDocument(caseId, file);
    } catch {
      failed.push(file.name);
    }
  }
  return failed;
}
