import { create } from "zustand";

// Files that didn't upload right after a case was made (the wizard picked them before the case
// existed). They can't be saved anywhere, so they're kept in memory only, per case, to offer a
// retry on the Documents tab. A reload loses them, and the client is then asked to add them again.

interface FailedUploadsState {
  files: Record<string, File[]>;
  set: (caseId: string, files: File[]) => void;
  clear: (caseId: string) => void;
}

const NONE: File[] = [];

export const useFailedUploads = create<FailedUploadsState>((set) => ({
  files: {},
  set: (caseId, files) =>
    set((s) => {
      const next = { ...s.files };
      if (files.length) next[caseId] = files;
      else delete next[caseId];
      return { files: next };
    }),
  clear: (caseId) =>
    set((s) => {
      const next = { ...s.files };
      delete next[caseId];
      return { files: next };
    }),
}));

export function useFailedUploadsOf(caseId: string): File[] {
  return useFailedUploads((s) => s.files[caseId] ?? NONE);
}
