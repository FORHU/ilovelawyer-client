import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiFetch } from "@/lib/api/fetch";
import { useSession } from "@/lib/auth/session";
import { msg } from "@/lib/i18n/msg";
import { caseKeys } from "./queries";

// The Questions step after the story (components/questions): the details the case still needs, one
// at a time. ilovelawyer-api's ClientQuestionsSvc keeps the list; this mirrors what it returns.

export type QuestionDetail = "place" | "otherSide" | "relationship" | "terms" | "reasonGiven" | "status" | "witnesses" | "goal";

export interface QuestionView {
  /** Sent back with the answer: the detail's, or "<detail>.followUp". */
  id: string;
  detail: QuestionDetail;
  question: string;
  why: string;
  /** Empty when the question has no natural short answers. */
  chips: string[];
  /** A follow-up within the same detail: it doesn't move the progress bar. */
  followUp: boolean;
}

export interface QuestionsState {
  status: "OPEN" | "DONE";
  /** Fixed when the list was written; 0 when nothing needed asking. */
  total: number;
  answered: number;
  skipped: number;
  current: QuestionView | null;
  history: { id: string; question: string; why: string; answer: string | null; skipped: boolean }[];
}

export type AnswerVia = "tap" | "typed" | "voice";

function post<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
}

/** Where the case's questions are, without starting them: null when there's no list. Never asks the AI. */
export function getQuestions(caseId: string) {
  return apiFetch<QuestionsState | null>(`/api/client/cases/${caseId}/questions`);
}

/** Starts the questions (the API writes the list once), or picks them up where they were left. */
export function startQuestions(caseId: string) {
  return post<QuestionsState>(`/api/client/cases/${caseId}/questions`, {});
}

export function answerQuestion(caseId: string, input: { questionId: string; text: string; via: AnswerVia }) {
  return post<QuestionsState>(`/api/client/cases/${caseId}/questions/answer`, input);
}

/** `text` is what the client is shown saying, in their language. */
export function skipQuestion(caseId: string, input: { questionId: string; text: string }) {
  return post<QuestionsState>(`/api/client/cases/${caseId}/questions/skip`, input);
}

// ---- What the screen shows ------------------------------------------------------------------

/** "2 of 5 details": the details dealt with (answered or skipped) out of the fixed total. */
export function progressOf(state: Pick<QuestionsState, "answered" | "skipped" | "total">): { done: number; total: number; percent: number } {
  const done = Math.min(state.answered + state.skipped, state.total);
  return { done, total: state.total, percent: state.total ? Math.round((done / state.total) * 100) : 100 };
}

/** How many questions are still to answer, for the case page's banner: 0 once done (or with no list). */
export function remainingOf(state: QuestionsState | null | undefined): number {
  if (!state || state.status === "DONE") return 0;
  return Math.max(0, state.total - state.answered - state.skipped);
}

export type ThreadTurn =
  | { kind: "question"; key: string; text: string; why: string }
  | { kind: "answer"; key: string; text: string | null; skipped: boolean };

/** The conversation so far, oldest first: each question and what the client said to it, then the
 * question they're on. A skipped answer has no text: the screen shows "I'm not sure." in the
 * client's language. */
export function threadOf(state: Pick<QuestionsState, "history" | "current">): ThreadTurn[] {
  const turns: ThreadTurn[] = [];
  for (const h of state.history) {
    turns.push({ kind: "question", key: `q-${h.id}`, text: h.question, why: h.why });
    turns.push({ kind: "answer", key: `a-${h.id}`, text: h.answer, skipped: h.skipped });
  }
  if (state.current) turns.push({ kind: "question", key: `q-${state.current.id}`, text: state.current.question, why: state.current.why });
  return turns;
}

/** The last thing said once the questions are done. */
export const END_NOTHING_TO_ASK = msg("You’ve told us everything we need for now.");
export const END_ALL_ANSWERED = msg("That’s everything I need. Next, add any documents you have, like letters, payslips or a contract.");
export const END_WITH_SKIPS = msg("That’s everything for now. Your lawyer will ask about what you skipped. Next, add any documents you have.");

export function endMessageOf(state: Pick<QuestionsState, "total" | "skipped">): string {
  if (!state.total) return END_NOTHING_TO_ASK;
  return state.skipped ? END_WITH_SKIPS : END_ALL_ANSWERED;
}

/** The API answers these while the list can't be shown yet: worth waiting and asking again. */
export function isStillPreparing(err: unknown): boolean {
  return err instanceof ApiError && (err.code === "INTAKE_RUNNING" || err.code === "QUESTIONS_PREPARING");
}

/** How long to keep waiting for the story's reading or the list before saying it's not coming. */
const PREPARING_RETRIES = 45;
const PREPARING_RETRY_MS = 2000;

// ---- Queries ----------------------------------------------------------------------------------

function useUserId() {
  return useSession((s) => s.user?.id);
}

export const questionsKey = (userId: string | undefined, caseId: string) => [...caseKeys.all(userId), "questions", caseId] as const;
/** The plain read's own entry: kept apart from questionsKey, whose read writes the list, so a cached
 * "no list" here never stops the Questions screen from starting one. */
export const questionsStatusKey = (userId: string | undefined, caseId: string) => [...caseKeys.all(userId), "questions-status", caseId] as const;

/** Where the case's questions are, for the case page's banner. Never starts them. */
export function useQuestionsStatusQuery(caseId: string, enabled = true) {
  const userId = useUserId();
  return useQuery({
    queryKey: questionsStatusKey(userId, caseId),
    queryFn: () => getQuestions(caseId),
    enabled: !!userId && enabled,
    staleTime: 30_000,
  });
}

/** Codes that mean this screen is behind the saved questions (another tab, a double tap): read them again. */
const BEHIND = new Set(["QUESTION_NOT_CURRENT", "QUESTIONS_DONE", "QUESTIONS_NOT_STARTED"]);
export function isBehind(err: unknown): boolean {
  return err instanceof ApiError && !!err.code && BEHIND.has(err.code);
}

/** The case's questions. The first read writes the list (one AI call), so it isn't repeated on its
 * own: no refetching on focus, and a 409 that means "not yet" (the story still being read, the list
 * still being written) is asked again every two seconds for a while. */
export function useQuestionsQuery(caseId: string) {
  const userId = useUserId();
  return useQuery({
    queryKey: questionsKey(userId, caseId),
    queryFn: () => startQuestions(caseId),
    enabled: !!userId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: (count, err) => (isStillPreparing(err) ? count < PREPARING_RETRIES : count < 1 && !(err instanceof ApiError && err.status < 500)),
    retryDelay: (_count, err) => (isStillPreparing(err) ? PREPARING_RETRY_MS : 1000),
  });
}

/** Answering or skipping: the new state replaces the old (here and in the case page's banner). Once
 * done, everything the answers change on the case (its details, the reading, the chat, the lawyer
 * check) is read again. A refusal saying this screen is behind (isBehind) reads the questions again. */
function useQuestionMutation<V>(caseId: string, call: (input: V) => Promise<QuestionsState>) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: call,
    onSuccess: (state) => {
      queryClient.setQueryData(questionsKey(userId, caseId), state);
      queryClient.setQueryData(questionsStatusKey(userId, caseId), state);
      void queryClient.invalidateQueries({ queryKey: caseKeys.detail(userId, caseId) });
      if (state.status === "DONE") {
        void queryClient.invalidateQueries({ queryKey: caseKeys.intake(userId, caseId) });
        void queryClient.invalidateQueries({ queryKey: caseKeys.messages(userId, caseId) });
        void queryClient.invalidateQueries({ queryKey: caseKeys.lawyerReadiness(userId, caseId) });
        void queryClient.invalidateQueries({ queryKey: caseKeys.list(userId) });
      }
    },
    onError: (err) => {
      if (isBehind(err)) void queryClient.invalidateQueries({ queryKey: questionsKey(userId, caseId) });
    },
  });
}

export function useAnswerQuestionMutation(caseId: string) {
  return useQuestionMutation(caseId, (input: { questionId: string; text: string; via: AnswerVia }) => answerQuestion(caseId, input));
}

export function useSkipQuestionMutation(caseId: string) {
  return useQuestionMutation(caseId, (input: { questionId: string; text: string }) => skipQuestion(caseId, input));
}
