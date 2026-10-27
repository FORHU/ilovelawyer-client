import { useMutation, useMutationState, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/session";
import type { Case, CaseDocument, CaseIntake } from "@/lib/types";
import {
  archiveCase,
  createCase,
  deleteCase,
  deleteDocument,
  getCase,
  getDocumentUrl,
  getIntake,
  listCases,
  listMessages,
  refreshIntake,
  retryDocument,
  sendMessage,
  unarchiveCase,
  updateCase,
  uploadDocument,
  type CaseChanges,
  type NewCase,
} from "./api";

// TanStack Query hooks for the client's cases. The request functions live in ./api.ts.

/** How often to check while something is happening in the background (the AI answering, a
 * document being read). */
const BUSY_POLL_MS = 1500;
const DOCUMENT_POLL_MS = 4000;
/** While the intake's job is running, how often to check for it to finish. */
const INTAKE_POLL_MS = 3000;

/** Keyed by account as well, so a session that ends without a sign-out (an expired refresh) never
 * shows the next account the previous one's cases. */
export const caseKeys = {
  all: (userId: string | undefined) => ["cases", userId ?? "signed-out"] as const,
  list: (userId: string | undefined) => [...caseKeys.all(userId), "list"] as const,
  archived: (userId: string | undefined) => [...caseKeys.all(userId), "archived"] as const,
  detail: (userId: string | undefined, id: string) => [...caseKeys.all(userId), "detail", id] as const,
  messages: (userId: string | undefined, id: string) => [...caseKeys.all(userId), "messages", id] as const,
  intake: (userId: string | undefined, id: string) => [...caseKeys.all(userId), "intake", id] as const,
};

function useUserId() {
  return useSession((s) => s.user?.id);
}

export function useCasesQuery() {
  const userId = useUserId();
  return useQuery({ queryKey: caseKeys.list(userId), queryFn: () => listCases(), enabled: !!userId });
}

export function useArchivedCasesQuery(enabled: boolean) {
  const userId = useUserId();
  return useQuery({ queryKey: caseKeys.archived(userId), queryFn: () => listCases(true), enabled: !!userId && enabled });
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

/** The Overview tab's content and status. Polls while the intake's own job is running, and while
 * the case has a document still being read — so the automatic triggers (after a chat reply, a
 * document finishing, or a case-details edit) show up without the client reloading the page. */
export function useIntakeQuery(caseId: string, hasPendingDocuments: boolean) {
  const userId = useUserId();
  return useQuery({
    queryKey: caseKeys.intake(userId, caseId),
    queryFn: () => getIntake(caseId),
    enabled: !!userId,
    refetchInterval: (q) => (q.state.data?.status === "RUNNING" || hasPendingDocuments ? INTAKE_POLL_MS : false),
  });
}

/** The Update button. The response is always the current state — running right away if this
 * press started the job, or unchanged if one was already running. */
export function useRefreshIntakeMutation(caseId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: () => refreshIntake(caseId),
    onSuccess: (intake: CaseIntake) => {
      queryClient.setQueryData(caseKeys.intake(userId, caseId), intake);
    },
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

/** Whatever changed on a case can change what the lawyer check says, so that is asked again too. */
export function useUpdateCaseMutation(caseId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: (changes: CaseChanges) => updateCase(caseId, changes),
    onSuccess: (updated) => {
      queryClient.setQueryData(caseKeys.detail(userId, caseId), updated);
      queryClient.invalidateQueries({ queryKey: caseKeys.list(userId) });
      queryClient.invalidateQueries({ queryKey: [...caseKeys.all(userId), "lawyer-readiness", caseId] });
    },
  });
}

/** Archive, restore and delete move a case between lists, so every case query is refreshed. */
function useCaseRemovalMutation<T>(fn: (id: string) => Promise<T>) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: fn,
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: caseKeys.detail(userId, id) });
      queryClient.removeQueries({ queryKey: caseKeys.messages(userId, id) });
      queryClient.invalidateQueries({ queryKey: caseKeys.list(userId) });
      queryClient.invalidateQueries({ queryKey: caseKeys.archived(userId) });
    },
  });
}

export const useArchiveCaseMutation = () => useCaseRemovalMutation(archiveCase);
export const useDeleteCaseMutation = () => useCaseRemovalMutation(deleteCase);
export const useUnarchiveCaseMutation = () => useCaseRemovalMutation(unarchiveCase);

export function useSendMessageMutation(caseId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: ({ text, documentIds }: { text: string; documentIds?: string[] }) => sendMessage(caseId, text, documentIds),
    // The case too: sending used a credit.
    onSettled: () => queryClient.invalidateQueries({ queryKey: caseKeys.all(userId) }),
  });
}

/** Every upload to the case still going, by its mutation key: the Documents tab lists their files
 * as rows while they upload (useMutationState). */
export function uploadDocumentsKey(userId: string | undefined, caseId: string) {
  return [...caseKeys.all(userId), "upload-documents", caseId] as const;
}

/** The files of every upload to the case still going, from here or from the chat. */
export function useUploadingFiles(caseId: string): File[] {
  const userId = useUserId();
  return useMutationState({
    filters: { mutationKey: uploadDocumentsKey(userId, caseId), status: "pending" },
    select: (m) => (m.state.variables as File[] | undefined) ?? [],
  }).flat();
}

/** Uploads files one after another. Resolves with what went in and what didn't, rather than
 * failing the whole batch for one bad file. */
export function useUploadDocumentsMutation(caseId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationKey: uploadDocumentsKey(userId, caseId),
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
      // A newly added document can be what the intake's automatic refresh was waiting on, or
      // what makes a generated one STALE — either way the tab's own poll (useIntakeQuery) picks
      // the rest up once the document finishes reading, this just avoids the wait for that poll.
      queryClient.invalidateQueries({ queryKey: caseKeys.intake(userId, caseId) });
    },
  });
}

/** Removing a document changes the case, its row in the list, and the overview: its source
 * links go at once (SourceBadge looks the document up on the case), and the intake turns STALE. */
export function useDeleteDocumentMutation(caseId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: (documentId: string) => deleteDocument(caseId, documentId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(userId, caseId) });
      queryClient.invalidateQueries({ queryKey: caseKeys.list(userId) });
      queryClient.invalidateQueries({ queryKey: caseKeys.intake(userId, caseId) });
    },
  });
}

/** The document goes back to PENDING, so useCaseQuery polls again until it's read. */
export function useRetryDocumentMutation(caseId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: (documentId: string) => retryDocument(caseId, documentId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.detail(userId, caseId) });
      queryClient.invalidateQueries({ queryKey: caseKeys.intake(userId, caseId) });
    },
  });
}

/** Fetched on each View rather than cached: the link only lives a few minutes. */
export function useDocumentUrlMutation(caseId: string) {
  return useMutation({ mutationFn: (documentId: string) => getDocumentUrl(caseId, documentId) });
}

/** For uploading right after creating a case, before any component for it is mounted. Returns the
 * files that didn't go in, so the case can offer to retry them. */
export async function uploadAll(caseId: string, files: File[]) {
  const failed: File[] = [];
  for (const file of files) {
    try {
      await uploadDocument(caseId, file);
    } catch {
      failed.push(file);
    }
  }
  return failed;
}
