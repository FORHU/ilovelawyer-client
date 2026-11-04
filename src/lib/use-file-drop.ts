"use client";

import { useRef, useState, type DragEvent } from "react";

/** Whether a drag carries files (as opposed to dragged text or a link). */
export function dragHasFiles(types: ArrayLike<string> | undefined): boolean {
  return !!types && Array.from(types).includes("Files");
}

/** Drag-and-drop of files over a whole region. Enter and leave fire for every child the pointer
 * crosses, so they are counted: `dragging` only turns off once the drag has left the region itself.
 * Spread `dragProps` on the region. Even when `disabled`, a file dropped on it is swallowed, so the
 * browser doesn't navigate away to open it. */
export function useFileDrop(onFiles: (files: File[]) => void, disabled = false) {
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);

  const stop = () => {
    depth.current = 0;
    setDragging(false);
  };

  const dragProps = {
    onDragEnter: (e: DragEvent<HTMLElement>) => {
      if (!dragHasFiles(e.dataTransfer?.types)) return;
      e.preventDefault();
      depth.current += 1;
      if (!disabled) setDragging(true);
    },
    onDragOver: (e: DragEvent<HTMLElement>) => {
      if (!dragHasFiles(e.dataTransfer?.types)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = disabled ? "none" : "copy";
    },
    onDragLeave: (e: DragEvent<HTMLElement>) => {
      if (!dragHasFiles(e.dataTransfer?.types)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setDragging(false);
    },
    onDrop: (e: DragEvent<HTMLElement>) => {
      if (!dragHasFiles(e.dataTransfer?.types)) return;
      e.preventDefault();
      e.stopPropagation();
      stop();
      const files = Array.from(e.dataTransfer.files);
      if (!disabled && files.length) onFiles(files);
    },
  };

  return { dragging, dragProps };
}
