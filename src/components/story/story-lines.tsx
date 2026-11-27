import { AlertCircle, Check } from "lucide-react";
import { useT } from "@/components/site/language-provider";
import { cn } from "@/lib/cn";
import { storySegments } from "@/lib/cases/story";
import type { IntakeStoryLine } from "@/lib/types";

/** A story line, its **marked** detail in bold. Never HTML: every piece is plain text. */
export function LineText({ text }: { text: string }) {
  return (
    <>
      {storySegments(text).map((part, i) =>
        part.bold ? (
          <strong key={i} className="font-semibold text-ink">
            {part.text}
          </strong>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}

/** "Here's your story so far": a check by each fact, an alert by a deadline. `compact` sets it smaller,
 * for the case rail beside the steps (components/steps/case-rail.tsx). */
export function StoryLines({ lines, compact = false }: { lines: IntakeStoryLine[]; compact?: boolean }) {
  const t = useT();
  return (
    <ul className={cn("flex flex-col", compact ? "gap-2.5" : "gap-3")} aria-label={t("What we understood")}>
      {lines.map((line) => (
        <li key={line.id} className={cn("grid gap-2.5 leading-[1.5] text-ink", compact ? "grid-cols-[18px_minmax(0,1fr)] text-[14px]" : "grid-cols-[22px_minmax(0,1fr)] text-[15.5px]")}>
          {line.kind === "DEADLINE" ? (
            <AlertCircle size={compact ? 16 : 18} className="mt-[3px] text-error" aria-label={t("Deadline")} />
          ) : (
            <Check size={compact ? 16 : 18} className="mt-[3px] text-success" aria-hidden="true" />
          )}
          <span>
            <LineText text={line.text} />
            {line.kind === "DEADLINE" && <span className="text-ink-2"> {t("We’ll keep that date in front of you.")}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
