import Link from "next/link";
import { copyParts } from "@/lib/marketing/copy";

/** Legal wording: [placeholders] show as dashed chips, so none can slip through unnoticed, and the
 * policies it names are links. */
export function CopyText({ text }: { text: string }) {
  return (
    <>
      {copyParts(text).map((part, i) => {
        if (part.kind === "placeholder") {
          return (
            <span key={i} className="font-landing-mono rounded-md border border-dashed border-[#f3dcae]/55 bg-[rgb(201_154_46/0.16)] px-1.5 py-px text-[.84em] text-[#f3dcae]">
              {part.text}
            </span>
          );
        }
        if (part.kind === "link") {
          return (
            <Link key={i} href={part.href} className="underline! underline-offset-3">
              {part.text}
            </Link>
          );
        }
        return <span key={i}>{part.text}</span>;
      })}
    </>
  );
}
