"use client";

import { useEffect, useMemo, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useSession } from "@/lib/auth/session";
import type { BudgetDraft } from "./budget";
import type { IntakeSnapshot } from "./use-intake-chat";
import type { CaseRegion, OtherParty, Side } from "../types";

// Case drafts: a New case left before the case was created, kept in this browser so the client can
// pick it up again from Drafts (the sidebar and the Cases page). The text is in localStorage, per
// account; files can't go there, so they're in IndexedDB under the draft's id. Nothing reaches the
// API until the case is created, and the draft is deleted then.

/** The form's answers, as the wizard holds them. */
export interface DraftForm {
  title: string;
  region: CaseRegion | "";
  where: string;
  areas: string[];
  side: Side;
  others: OtherParty[];
  happened: string;
  wants: string;
  budget: BudgetDraft;
}

/** The chat as it was left: the conversation, and what was in the composer. */
export interface DraftChat extends IntakeSnapshot {
  text: string;
}

export interface SavedDraft {
  id: string;
  ownerId: string;
  updatedAt: number;
  /** Which way in was showing, so Continue lands on it again. */
  mode: "chat" | "form";
  chat: DraftChat | null;
  form: DraftForm;
  fileCount: number;
}

/** What New case holds right now, to save as a draft. */
export interface OpenDraft {
  id: string;
  ownerId: string;
  mode: "chat" | "form";
  chat: DraftChat | null;
  chatFiles: File[];
  form: DraftForm;
  formFiles: File[];
}

const TITLE_MAX = 80;

/** Just the form's answers, out of the wizard's state. */
export function formOf(s: DraftForm): DraftForm {
  const { title, region, where, areas, side, others, happened, wants, budget } = s;
  return { title, region, where, areas, side, others, happened, wants, budget };
}

export function formHasContent(f: DraftForm): boolean {
  return !!(
    f.title.trim() ||
    f.areas.length ||
    f.region ||
    f.where.trim() ||
    f.side ||
    f.others.some((o) => o.name.trim()) ||
    f.happened.trim() ||
    f.wants.trim()
  );
}

function chatHasContent(c: DraftChat | null): boolean {
  return !!c && (c.messages.length > 0 || !!c.text.trim());
}

/** What a draft is called in a list: its title, else the first thing the client said. */
export function draftTitle(d: Pick<SavedDraft, "chat" | "form">): string {
  const said = d.chat?.messages.find((m) => m.role === "user")?.text;
  const name = (d.form.title.trim() || d.chat?.draft.title.trim() || said || d.chat?.text.trim() || "").replace(/\s+/g, " ");
  if (!name) return "Untitled draft";
  return name.length <= TITLE_MAX ? name : `${name.slice(0, TITLE_MAX - 1).trimEnd()}…`;
}

/** "14:05" today, "5 Nov" before. */
export function draftWhen(at: number, now = Date.now()): string {
  const d = new Date(at);
  return new Date(now).toDateString() === d.toDateString()
    ? new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(d)
    : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(d);
}

/** Where Continue goes: the way in the draft was left on. */
export const draftHref = (d: Pick<SavedDraft, "mode">) => (d.mode === "form" ? "/cases/new?mode=form" : "/cases/new");

export const newDraftId = () => `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

// ---- Files (IndexedDB) -------------------------------------------------------------------------

const DB_NAME = "ilovelawyer-client-drafts";
const FILES = "files";

type DraftFiles = { chat: File[]; form: File[] };
const NO_FILES: DraftFiles = { chat: [], form: [] };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(FILES);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function inFiles<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILES, mode);
    const req = run(tx.objectStore(FILES));
    tx.oncomplete = () => {
      db.close();
      resolve(req.result);
    };
    tx.onerror = tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}

// Storage blocked (a private window) or full: the draft keeps its text, the files are asked for again.
function saveDraftFiles(id: string, files: DraftFiles) {
  const empty = !files.chat.length && !files.form.length;
  const write = empty ? inFiles("readwrite", (s) => s.delete(id)) : inFiles("readwrite", (s) => s.put(files, id));
  void write.catch(() => undefined);
}

/** A draft's files, noted as already written so continuing it doesn't write them again. */
export function loadDraftFiles(id: string): Promise<DraftFiles> {
  return inFiles<DraftFiles | undefined>("readonly", (s) => s.get(id))
    .then((f) => f ?? NO_FILES)
    .catch(() => NO_FILES)
    .then((f) => {
      writtenFiles.set(id, f);
      return f;
    });
}

// ---- The list ----------------------------------------------------------------------------------

interface DraftsState {
  drafts: Record<string, SavedDraft>;
  save: (draft: SavedDraft) => void;
  remove: (id: string) => void;
}

export const useDrafts = create<DraftsState>()(
  persist(
    (set) => ({
      drafts: {},
      save: (draft) => set((s) => ({ drafts: { ...s.drafts, [draft.id]: draft } })),
      remove: (id) =>
        set((s) => {
          if (!s.drafts[id]) return s;
          const next = { ...s.drafts };
          delete next[id];
          return { drafts: next };
        }),
    }),
    {
      name: "ilovelawyer-client-drafts",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // Loaded on the client (loadDrafts), so server markup stays stable.
      skipHydration: true,
    },
  ),
);

let loading: Promise<void> | null = null;

/** Reads the saved drafts once per page load. Everything that lists or saves drafts waits on it, so
 * a save made before it can't be overwritten by what was on disk. */
export function loadDrafts(): Promise<void> {
  loading ??= Promise.resolve(useDrafts.persist.rehydrate()).catch(() => undefined);
  return loading;
}

/** This account's drafts, newest first. Empty until they've loaded. */
export function useOwnDrafts(): SavedDraft[] {
  const userId = useSession((s) => s.user?.id);
  const drafts = useDrafts((s) => s.drafts);
  const [loaded, setLoaded] = useState(() => useDrafts.persist.hasHydrated());
  useEffect(() => {
    let live = true;
    void loadDrafts().then(() => live && setLoaded(true));
    return () => {
      live = false;
    };
  }, []);
  return useMemo(
    () =>
      loaded && userId
        ? Object.values(drafts)
            .filter((d) => d.ownerId === userId)
            .sort((a, b) => b.updatedAt - a.updatedAt)
        : [],
    [drafts, loaded, userId],
  );
}

export function removeDraft(id: string) {
  useDrafts.getState().remove(id);
  saveDraftFiles(id, NO_FILES);
}

/** Last files written per draft, so typing doesn't rewrite them every time. */
const writtenFiles = new Map<string, DraftFiles>();

/** Saves what New case holds as a draft, or drops the draft once nothing is left in it. Returns
 * whether there was anything to keep. */
export function putDraft(open: OpenDraft): boolean {
  const { id, ownerId, mode, chat, chatFiles, form, formFiles } = open;
  const keep = chatHasContent(chat) || chatFiles.length > 0 || formHasContent(form) || formFiles.length > 0;
  if (!keep) {
    if (useDrafts.getState().drafts[id]) removeDraft(id);
    writtenFiles.delete(id);
    return false;
  }
  const next: SavedDraft = { id, ownerId, updatedAt: Date.now(), mode, chat, form, fileCount: chatFiles.length + formFiles.length };
  const prev = useDrafts.getState().drafts[id];
  // Only a real change moves it up the list: opening a draft, or a refresh, saves it unchanged.
  if (!prev || JSON.stringify({ ...prev, updatedAt: 0 }) !== JSON.stringify({ ...next, updatedAt: 0 })) useDrafts.getState().save(next);
  const last = writtenFiles.get(id);
  if (last?.chat !== chatFiles || last?.form !== formFiles) {
    const files = { chat: chatFiles, form: formFiles };
    writtenFiles.set(id, files);
    saveDraftFiles(id, files);
  }
  return true;
}

// ---- The draft open on New case ----------------------------------------------------------------

let saveOpen: (() => boolean) | null = null;

/** The New case page registers how to save what it holds, so leaving it for another New case or
 * draft saves it first. Returns the unregister. */
export function registerOpenDraft(save: () => boolean) {
  saveOpen = save;
  return () => {
    if (saveOpen === save) saveOpen = null;
  };
}

/** Saves the draft open on New case, if any. True when it had something in it. */
export function saveOpenDraft(): boolean {
  return saveOpen?.() ?? false;
}
