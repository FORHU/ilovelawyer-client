"use client";

import { useState, type ReactNode } from "react";

/** The document types the API accepts (ilovelawyer-api ALLOWED_DOCUMENT_EXTENSIONS, less the Excel
 * macro variants, which the client app doesn't offer). HEIC is converted to JPEG by the API;
 * audio and video are transcribed there. checkFiles also narrows this to what GET
 * /api/client/limits says, so a type the API drops is never offered. */
export const DOCUMENT_ACCEPT = ".pdf,.doc,.docx,.xlsx,.txt,.jpg,.jpeg,.png,.webp,.heic,.mp3,.m4a,.wav,.mp4";

/** A hidden file input. `children` gets `open` to show the browser's file dialog from any button. */
export function FilePicker({
  onPick,
  multiple = true,
  children,
}: {
  onPick: (files: File[]) => void;
  multiple?: boolean;
  children: (open: () => void) => ReactNode;
}) {
  // State rather than a ref, so `open` reads no ref during render.
  const [input, setInput] = useState<HTMLInputElement | null>(null);
  return (
    <>
      <input
        ref={setInput}
        type="file"
        hidden
        multiple={multiple}
        accept={DOCUMENT_ACCEPT}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          // Cleared so picking the same file again still fires onChange.
          e.target.value = "";
          if (files.length) onPick(files);
        }}
      />
      {children(() => input?.click())}
    </>
  );
}
