import Link from "next/link";
import { HOW_HEADINGS, TERMINAL_CAPTIONS } from "@/lib/marketing/how-timeline";
import { HOW_INTRO } from "./how-intro";

/** The story for anyone who asks for reduced motion: the same words, in order, with nothing pinned
 * or moving. */
export function HowStatic() {
  return (
    <section id="how" aria-label="Stop guessing what it means" className="relative z-1 bg-black px-6 py-24 text-white">
      <div className="mx-auto flex max-w-[720px] flex-col gap-12">
        <div className="flex flex-col items-start gap-5">
          <h2 className="font-archivo m-0 text-[clamp(40px,5vw,84px)] font-[250] leading-none tracking-[-0.045em]">
            {HOW_INTRO.left} {HOW_INTRO.right}
          </h2>
          <p className="m-0 text-pretty text-[17px] leading-normal text-white/86">{HOW_INTRO.sub}</p>
          <Link href="/signup" data-btn className="inline-flex min-h-[50px] items-center rounded-full bg-white px-[26px] py-3.5 text-[16px] font-medium text-[#0c0c0e]!">
            Start your case
          </Link>
        </div>
        <ol className="m-0 flex list-none flex-col gap-8 p-0">
          {HOW_HEADINGS.map((h) => (
            <li key={h.text}>
              <h3 className="font-archivo m-0 text-[clamp(26px,3vw,40px)] font-[250] leading-[1.1] tracking-[-0.03em]">{h.text}</h3>
            </li>
          ))}
        </ol>
        <dl className="m-0 flex flex-col gap-5">
          {TERMINAL_CAPTIONS.map((c) => (
            <div key={c.label} className="flex flex-col gap-1.5">
              <dt className="font-landing-mono text-[11px] uppercase tracking-[.12em] text-[#e0bd6d]">{c.label.split(" · ")[1]}</dt>
              <dd className="m-0 text-[17px] leading-[1.45]">{c.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
