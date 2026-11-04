/** Covers the region a file is being dragged over. Doesn't catch the pointer, so the drop lands on the region itself. */
export function DropOverlay({ label = "Drop to attach" }: { label?: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-2 z-20 flex items-center justify-center rounded-composer border-2 border-dashed border-gold bg-subtle/95 text-[13px] font-medium text-ink"
    >
      {label}
    </div>
  );
}
