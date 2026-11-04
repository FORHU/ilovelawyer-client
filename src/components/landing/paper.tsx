import type { CSSProperties, ReactNode } from "react";
import type { Problem } from "@/lib/marketing/problems";

// One of the hero's drifting documents. Their small print is decoration: too small to read, there
// to look like the letters people actually receive.

const TYPES = ["letter", "envelope", "form", "report"] as const;
const WIDTHS = { letter: 205, envelope: 250, form: 215, report: 200 };
const COLORS = { letter: "#fbfaf6", envelope: "#d3bd92", form: "#fcfbf8", report: "#fafaf8" };
const SENDERS = ["Harcourt Property Ltd", "Northgate Collections", "HR Department", "Claims Team", "County Court Business Centre", "Brightwell Estates"];
const FORM_CODES = ["N1", "ET1", "D8", "SC1", "C100", "PA1"];
const FILL = [
  "We are writing to you about the matter set out above. Please read this letter carefully and keep it somewhere safe. The information below explains what has happened so far, what we are asking you to do and the date by which you need to respond. If you do not respond by that date, further action may be taken without any additional notice to you. You may wish to get independent advice about the contents of this letter.",
  "This notice is given in relation to the agreement between the parties named above. The amounts and dates shown are based on the records held at the time of writing. If you believe any of the details are incorrect, you should tell us in writing as soon as possible and include copies of any documents that support your position. Please quote the reference number shown at the top of this page in all correspondence.",
];
const NOISE = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.3  0 0 0 0 0.26  0 0 0 0 0.2  0 0 0 .09 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>",
)}")`;
const STACK = "3px 3px 0 -1px #f2f0eb, 3px 3px 1px -1px rgba(0,0,0,.2), 6px 7px 0 -2px #eeebe5, 6px 7px 1px -2px rgba(0,0,0,.2), ";
const EASE = "cubic-bezier(.16,1,.3,1)";

const Small = ({ text, faded }: { text: string; faded?: boolean }) => (
  <span className="font-display block text-justify text-[4.6px] leading-[1.6] text-[#3b3a38]" style={faded ? { opacity: 0.9 } : undefined}>
    {text}
  </span>
);

const Cells = ({ tag, flex }: { tag: string; flex: number[] }) => (
  <span className="flex">
    {flex.map((f, i) => (
      <span key={i} className="h-[15px] border-[.5px] border-[#6d6a64] px-0.5 py-px text-[3.6px] uppercase leading-none text-[#55524d]" style={{ flex: f }}>
        {tag}
      </span>
    ))}
  </span>
);

const FormBar = ({ children }: { children: ReactNode }) => (
  <span className="block bg-[#1d1c1a] px-1 py-0.5 text-[5px] font-semibold uppercase tracking-[.04em] text-[#f4f2ee]">{children}</span>
);

function Face({ type, problem, k }: { type: (typeof TYPES)[number]; problem: Problem; k: number }) {
  const fill = FILL[k % 2];
  const { label, tag } = problem;
  if (type === "letter")
    return (
      <span className="flex flex-col gap-[9px] px-[17px] pb-[18px] pt-4">
        <span className="flex items-start justify-between gap-2.5">
          <span className="flex items-center gap-[5px]">
            <span className="size-[11px] rounded-[1px] bg-[#1d1c1a]" />
            <span className="font-display text-[7px] text-[#1d1c1a]">{SENDERS[k % SENDERS.length]}</span>
          </span>
          <span className="flex flex-col items-end gap-px text-right text-[4.2px] leading-[1.3] text-[#55524d]">
            <span>Ref {40213 + k * 377}</span>
            <span>{((3 + k) % 28) + " October 2026"}</span>
          </span>
        </span>
        <span className="text-[11.5px] font-bold leading-[1.15] text-[#141311]">Re: {label}</span>
        <Small text={fill} />
        <Small text={fill} faded />
        <span className="font-caslon-italic text-[7px] text-[#2a2926]">Yours faithfully</span>
      </span>
    );
  if (type === "envelope")
    return (
      <span className="relative flex flex-col gap-2.5 px-4 pb-[18px] pt-3.5">
        <span aria-hidden className="absolute right-3 top-2.5 h-[30px] w-[26px] border-2 border-dotted border-[#e9dcc0] bg-[#b4462f]" />
        <span aria-hidden className="absolute right-[30px] top-4 size-[30px] rounded-full border border-[rgba(30,24,18,.45)]" />
        <span className="text-[7px] font-bold uppercase tracking-[.08em] text-[#2b2116]">Private &amp; confidential</span>
        <span className="mt-[18px] flex flex-col gap-[3px] border-[.5px] border-[rgba(30,24,18,.25)] bg-white/78 px-[11px] py-[9px] shadow-[inset_0_0_6px_rgba(0,0,0,.08)]">
          <span className="text-[12.5px] font-bold leading-[1.15] text-[#141311]">{label}</span>
          <span className="text-[4.4px] leading-[1.4] text-[#55524d]">Flat 2, 14 Albert Road, Leeds LS6 1AB</span>
        </span>
      </span>
    );
  if (type === "form")
    return (
      <span className="flex flex-col gap-[5px] px-[13px] pb-4 pt-3">
        <span className="flex items-baseline justify-between text-[5px] text-[#2a2926]">
          <span className="text-[7px] font-bold">Form {FORM_CODES[k % FORM_CODES.length]}</span>
          <span>{tag}</span>
        </span>
        <span className="border-b-[1.5px] border-[#1d1c1a] pb-[3px] text-[11.5px] font-bold leading-[1.15] text-[#141311]">{label}</span>
        <FormBar>Section 1 · Your details</FormBar>
        <Cells tag={tag} flex={[2, 1, 1]} />
        <Cells tag={tag} flex={[1, 2]} />
        <FormBar>Section 2 · What happened</FormBar>
        <Small text={fill} />
        <Cells tag={tag} flex={[1, 1, 1]} />
      </span>
    );
  return (
    <span className="flex flex-col gap-[7px] px-4 pb-[18px] pt-4">
      <span className="text-[12.5px] font-extrabold leading-[1.1] tracking-[-0.01em] text-[#141311]">{label}</span>
      <span className="h-[3px] bg-[#1d1c1a]" />
      <Small text={fill} />
      <span className="text-[6px] font-bold text-[#1d1c1a]">Next steps</span>
      <Small text={fill} faded />
      <span className="h-0.5 bg-[#1d1c1a]" />
    </span>
  );
}

export function Paper({
  problem,
  k,
  selected,
  selectedWidth,
  showHelp,
  onPick,
}: {
  problem: Problem;
  k: number;
  selected: boolean;
  selectedWidth: number;
  /** Whether the selected paper unfolds its "How we help" (not on phones, where it wouldn't fit). */
  showHelp: boolean;
  onPick: (k: number) => void;
}) {
  const type = TYPES[k % 4];
  const stacked = type === "report" || (type === "form" && k % 2 === 1);
  const style: CSSProperties = {
    width: selected ? selectedWidth : WIDTHS[type],
    borderRadius: type === "envelope" ? 4 : 1,
    backgroundColor: COLORS[type],
    backgroundImage: NOISE,
    boxShadow:
      (stacked ? STACK : "") +
      (selected ? "0 1px 2px rgba(0,0,0,.3), 0 40px 100px rgba(0,0,0,.6)" : "0 1px 2px rgba(0,0,0,.35), 0 12px 28px rgba(0,0,0,.4)"),
    transition: `width 650ms ${EASE}, box-shadow 400ms ease, opacity 450ms ease`,
  };
  return (
    <button
      type="button"
      data-paper={k}
      data-no-tap
      onClick={() => onPick(k)}
      aria-pressed={selected}
      className="pointer-events-auto absolute left-0 top-0 border-0 p-0 text-left text-[#1a1612] opacity-0 will-change-transform"
      style={style}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-2 rounded-[inherit]"
        style={{ background: "linear-gradient(128deg, rgba(255,255,255,.55) 0%, rgba(255,255,255,0) 38%, rgba(0,0,0,.035) 70%, rgba(0,0,0,.09) 100%)" }}
      />
      <Face type={type} problem={problem} k={k} />
      <span
        className="grid"
        style={{ gridTemplateRows: selected && showHelp ? "1fr" : "0fr", transition: `grid-template-rows 700ms ${EASE} 300ms` }}
      >
        <span className="min-h-0 overflow-hidden">
          <span className="mx-[18px] flex flex-col gap-2.5 border-t border-dashed border-[rgba(26,22,18,.25)] pb-[22px] pt-4">
            <span className="font-archivo text-balance text-[24px] font-normal leading-[1.1] tracking-[-0.02em]">{problem.h}</span>
            <span className="font-landing-mono text-[10px] uppercase tracking-[.1em] text-[#6b6259]">How we help</span>
            <span className="text-pretty text-[15px] leading-[1.45]">{problem.help}</span>
          </span>
        </span>
      </span>
    </button>
  );
}
