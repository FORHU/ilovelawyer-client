import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, ArrowUp, Check, Ellipsis, FileText, MessageCircleMore, Mic, Paperclip, Scale } from "lucide-react";
import { AiMark, Eyebrow } from "@/components/ui/misc";
import { cn } from "@/lib/cn";
import type { HowChat } from "./use-how";

// Mini versions of the app's real screens for the landing page's phone and laptop: the same structure
// and classes as components/case and components/cases, with sample content and nothing live (no
// queries, sockets or stores, which a signed-out public page mustn't run). When one of those screens
// changes, change its mini version here. The lawyers are invented and the fees are placeholders,
// which is why the laptop's frame says "Sample case".

const LAWYERS = [
  { name: "Sarah Okafor", first: "Sarah", initials: "SO", firm: "Okafor & Reid Solicitors", bio: "Works on housing and employment matters.", fee: "£400", platform: "£60", total: "£460", message: "I've read your summary. I can review the letter, advise you on your options and write back on your behalf." },
  { name: "James Whitlock", first: "James", initials: "JW", firm: "Whitlock Legal", bio: "Civil and consumer disputes.", fee: "£480", platform: "£72", total: "£552", message: "I can review your documents and advise on next steps, with one follow-up letter." },
  { name: "Priya Nair", first: "Priya", initials: "PN", firm: "Nair Law LLP", bio: "Civil disputes and everyday legal problems.", fee: "£600", platform: "£90", total: "£690", message: "A full review, an advice meeting and a plan for what to do next." },
];
const STARTERS = ["I lost my job", "A problem with my landlord", "Someone owes me money"];
// The API's own wording (CLIENT_REQUEST_REFERRAL_DISCLOSURE in ilovelawyer-api).
const DISCLOSURE = "You pay through ilovelawyer: the lawyer's fee, plus ilovelawyer's platform fee shown on the quote. The lawyer receives their full fee, and the platform fee doesn't change what the lawyer charges you.";
const AI_NOTE = "I collect and organise your information for a lawyer. I can't give legal advice.";
const CARD = "flex flex-col gap-4 rounded-modal border border-line bg-white p-6";

const firstLine = (c: HowChat) => `This sounds like ${c.label.toLowerCase()}. ${c.help}`;

/* ---------- Shared parts ---------- */

/** components/case/case-header.desktop.tsx */
function CaseHeaderMini({ chat, hasLawyer }: { chat: HowChat; hasLawyer?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-x-3 border-b border-line px-6 py-[14px]">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-white">
        <ArrowLeft size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-[1px] text-gold">{chat.area} · Leeds</div>
        <div className="font-display truncate text-xl leading-[1.25] tracking-[-0.02em]">{chat.label}</div>
      </div>
      <div className="flex shrink-0 gap-2">
        <span className="flex w-[230px] shrink-0 flex-col gap-1.5 rounded-card border border-line bg-subtle px-3.5 py-2 text-[12.5px] font-medium text-ink">
          <span className="flex items-center justify-between gap-2">
            <span>46 credits</span>
            <span className="font-semibold text-gold">Top up</span>
          </span>
          <span className="h-1 overflow-hidden rounded-full bg-line">
            <span className="block h-full w-[8%] rounded-full bg-gold" />
          </span>
        </span>
        {!hasLawyer && (
          <span className="flex items-center gap-2 rounded-full border border-line-input bg-white px-4 text-[13px] font-medium">
            <Scale size={14} />
            Get a lawyer
          </span>
        )}
        <span className="flex size-10 items-center justify-center self-center rounded-full border border-line">
          <Ellipsis size={16} />
        </span>
      </div>
    </div>
  );
}

/** components/case/tabs.desktop.tsx */
function TabsMini({ active, lawyerStatus }: { active: string; lawyerStatus?: { text: string; tone: string } }) {
  const tabs = ["Interview", "Overview", "Documents", ...(lawyerStatus ? ["Lawyer"] : [])];
  return (
    <div className="flex shrink-0 gap-1 border-b border-line px-10">
      {tabs.map((t) => (
        <span key={t} className={cn("-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-[14px] py-3 text-sm font-medium", t === active ? "border-gold text-ink" : "border-transparent text-ink-2")}>
          {t}
          {t === "Documents" && <span className="rounded-full bg-chip px-[7px] text-[11px] leading-[18px] text-ink">1</span>}
          {t === "Lawyer" && lawyerStatus && <span className={cn("rounded-full px-[9px] py-px text-[11px] font-semibold", lawyerStatus.tone)}>{lawyerStatus.text}</span>}
        </span>
      ))}
    </div>
  );
}

/** components/case/lawyer-stages.tsx: StepDot and RequestSteps, with its surrounding aside. */
function RequestAside({ position, reviewing, quoteLabel }: { position: number; reviewing: string; quoteLabel: string }) {
  const steps = [
    { label: "Request sent", sub: "Anonymised summary of your overview" },
    { label: "Finding a lawyer", sub: "Sent to matching lawyers" },
    { label: reviewing, sub: "Conflict check, then a quote" },
    { label: quoteLabel, sub: "Accept one and pay through ilovelawyer, or decline" },
    { label: "Working with your lawyer", sub: "Messages, and read-only access to your case" },
  ];
  return (
    <section className="flex flex-col gap-4 rounded-card border border-line bg-white p-5">
      <div className="flex flex-col gap-0.5">
        <Eyebrow muted>Matched for you</Eyebrow>
        <h2 className="text-base font-semibold">Your lawyer request</h2>
      </div>
      <ol className="flex flex-col">
        {steps.map((st, i) => {
          const done = i < position;
          const current = i === position;
          return (
            <li key={st.label} className="flex gap-3.5">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "box-border flex size-[26px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    done && "bg-ink text-white",
                    current && "border-2 border-gold bg-warn-bg text-gold shadow-[0_0_0_4px_rgb(138_98_0/0.12)]",
                    !done && !current && "border-[1.5px] border-line-input bg-white text-ink-2",
                  )}
                >
                  {done ? <Check size={13} strokeWidth={3} /> : i + 1}
                </span>
                {i < steps.length - 1 && <span className={cn("my-1 min-h-5 w-0.5 flex-1", done ? "bg-ink" : "bg-line")} />}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 pb-[22px] pt-0.5">
                <span className={cn("text-sm", current ? "font-semibold text-ink" : done ? "font-medium text-ink" : "font-medium text-ink-2")}>{st.label}</span>
                <span className="text-[12.5px] text-ink-2">{st.sub}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** components/case/lawyer-stages.tsx: LawyerHeader. The SRA number is left out: these lawyers are invented. */
function LawyerHeaderMini({ lawyer, children, working }: { lawyer: (typeof LAWYERS)[number]; children?: ReactNode; working?: boolean }) {
  return (
    <div className={cn("flex items-center gap-4 rounded-modal border px-5 py-4", working ? "border-success-line bg-success-bg" : "border-line bg-white")}>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">{lawyer.initials}</span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-base font-semibold">{children ?? lawyer.name}</span>
        <span className={cn("text-xs", working ? "text-success-ink" : "text-ink-2")}>{lawyer.firm} · SRA verified</span>
      </div>
    </div>
  );
}

function QuoteCard({ lawyer }: { lawyer: (typeof LAWYERS)[number] }) {
  return (
    <div className="flex flex-col gap-3">
      <LawyerHeaderMini lawyer={lawyer} />
      <p className="px-1 text-[13px] leading-[1.6] text-ink-2">{lawyer.bio}</p>
      <section className={CARD}>
        <Eyebrow muted>Fixed fee quote</Eyebrow>
        <span className="font-display text-[34px] leading-none tracking-[-0.02em]">{lawyer.total}</span>
        <p className="text-[14px] text-[#4a4a4a]">{lawyer.message}</p>
        <div className="flex flex-col gap-1.5 rounded-input border border-line bg-subtle px-4 py-3.5 text-[13px]">
          <div className="flex justify-between gap-2">
            <span>{lawyer.first}&apos;s fee, paid to them in full</span>
            <span>{lawyer.fee}</span>
          </div>
          <div className="flex justify-between gap-2 text-ink-2">
            <span>ilovelawyer platform fee</span>
            <span>{lawyer.platform}</span>
          </div>
          <div className="flex justify-between gap-2 border-t border-line pt-2 text-[15px] font-semibold">
            <span>You pay</span>
            <span>{lawyer.total}</span>
          </div>
        </div>
        <div className="flex gap-2.5">
          <span className="flex h-[46px] flex-1 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">Accept and pay {lawyer.total}</span>
          <span className="flex h-[46px] flex-1 items-center justify-center rounded-full border border-line-input text-sm">Decline this quote</span>
        </div>
      </section>
    </div>
  );
}

/* ---------- Laptop screens ---------- */

/** components/cases/intake-chat.desktop.tsx, while it's empty. */
function NewCaseDesktop() {
  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto flex w-full max-w-[768px] items-center justify-between px-6 pt-5">
        <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[1.2px] text-ink-2">
          <ArrowLeft size={14} />
          Cases
        </span>
        <span className="rounded-full border border-line px-3 py-1.5 text-[12px] font-medium text-ink-2">Guide</span>
      </div>
      <div className="mx-auto flex w-full max-w-[768px] flex-1 flex-col justify-center gap-7 px-6 pb-24 pt-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="font-display text-[44px] font-normal leading-tight tracking-[-0.02em]">What&apos;s going on?</h1>
          <p className="max-w-[540px] text-[15px] leading-[1.55] text-ink-2">Tell us in your own words. We&apos;ll ask a few questions and set up your case. AI guidance, not legal advice.</p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5 rounded-[28px] border border-line-input bg-white p-2 shadow-[0_2px_14px_rgb(0_0_0/0.06)]">
            <span className="flex size-11 shrink-0 items-center justify-center text-ink-2 opacity-40">
              <Paperclip size={20} />
            </span>
            <span className="flex-1 px-1.5 text-base leading-6 text-muted">Tell me what&apos;s going on…</span>
            <span className="flex size-11 shrink-0 items-center justify-center text-ink-2">
              <Mic size={20} />
            </span>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-chip text-muted">
              <ArrowUp size={20} />
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {STARTERS.map((s) => (
              <span key={s} className="flex min-h-8 items-center rounded-full border border-line-chip bg-subtle px-3 text-[12.5px] font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          <span className="flex items-center gap-2 rounded-full border border-line-input px-5 py-2.5 text-[13.5px] font-medium">
            Prefer a form? Fill in a form
            <ArrowRight size={14} className="text-gold" />
          </span>
        </div>
      </div>
    </div>
  );
}

/** components/case/overview/overview.desktop.tsx */
function OverviewDesktop({ chat }: { chat: HowChat }) {
  const criteria = ["What happened", "Key documents", "What you want"];
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <CaseHeaderMini chat={chat} />
      <TabsMini active="Overview" />
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-10 pt-7">
        <section className="flex items-center gap-x-6 rounded-modal border border-line bg-subtle px-6 py-[22px]">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex items-baseline gap-x-3">
              <span className="text-[10px] font-semibold uppercase tracking-[1px] text-ink-2">Ready for a lawyer</span>
              <span className="font-display text-[22px] tracking-[-0.02em]">3 of 3 things a lawyer needs</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {criteria.map((c) => <span key={c} className="h-1.5 rounded-full bg-gold" />)}
            </div>
            <ul className="flex flex-wrap gap-1">
              {criteria.map((c) => (
                <li key={c} className="flex items-center gap-1 whitespace-nowrap rounded-full bg-success-bg px-2 py-1 text-xs text-success-ink">
                  <Check size={12} strokeWidth={2.5} />
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex w-[240px] shrink-0 flex-col items-start gap-2.5">
            <span className="flex items-center gap-1.5 text-[12.5px] text-ink-2">
              <span className="size-[7px] rounded-full bg-success" />
              Up to date · updated 3 hours ago
            </span>
            <span className="flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-[13px] font-medium text-white">
              Continue the interview
              <ArrowRight size={14} />
            </span>
          </div>
        </section>
        <div className="grid grid-cols-[minmax(0,1fr)_300px] items-start gap-6">
          <div className="flex min-w-0 flex-col gap-5">
            <section className="flex flex-col gap-3 rounded-card border border-line bg-white px-6 py-[22px]">
              <div className="flex items-center justify-between gap-2">
                <Eyebrow muted>Summary</Eyebrow>
                <span className="rounded-full bg-chip px-2 py-0.5 text-[11px] text-ink-2">AI-written · check it against what you said</span>
              </div>
              <p className="font-display text-[19px] leading-normal tracking-[-0.01em]">You told us: “{chat.msg}”. You&apos;ve added a letter about it, and you&apos;d like to understand what it means and what to do next.</p>
            </section>
            <section className="flex flex-col gap-3.5 rounded-card border border-line bg-white px-6 py-[22px]">
              <Eyebrow muted>Timeline</Eyebrow>
              <ol className="flex flex-col gap-4 border-l border-line pl-[18px] text-[14px]">
                <li className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-4">
                  <span className="text-[12.5px] text-ink-2">2 Oct 2026</span>
                  <div className="flex flex-col gap-0.5">
                    <span>You received a letter about this.</span>
                    <span className="text-[12.5px] text-gold underline underline-offset-2">From Letter.pdf, p.1</span>
                  </div>
                </li>
              </ol>
            </section>
          </div>
          <aside className="flex min-w-0 flex-col gap-4">
            <section className="flex flex-col gap-3 rounded-card border border-line bg-white px-5 py-[18px]">
              <h3 className="text-[15px] font-semibold">Still needed</h3>
              <div className="flex gap-2.5 text-[14px]">
                <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-chip text-[11px] font-semibold">1</span>
                <div className="flex min-w-0 flex-col gap-[3px]">
                  <span>When did this start?</span>
                  <span className="text-[12.5px] text-ink-2">It helps a lawyer see any time limits.</span>
                  <span className="text-[12.5px] font-medium text-gold underline underline-offset-2">Answer in the interview →</span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

/** components/case/lawyer-tab.desktop.tsx with lawyer-stages.tsx's QuoteStage. `comparing` scrolls down
 * the column to the second quote. */
function QuotesDesktop({ chat, comparing }: { chat: HowChat; comparing?: boolean }) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <CaseHeaderMini chat={chat} hasLawyer />
      <TabsMini active="Lawyer" lawyerStatus={{ text: "Quote to review", tone: "bg-error-bg text-error-ink" }} />
      <div className="mx-auto grid w-full max-w-[1120px] grid-cols-[300px_minmax(0,1fr)] items-start gap-6 px-10 pt-7">
        <RequestAside position={3} reviewing="3 lawyers are reviewing" quoteLabel="Compare the quotes" />
        <div className="flex min-w-0 flex-col gap-4" style={comparing ? { marginTop: -545 } : undefined}>
          <h2 className="font-display text-2xl font-normal tracking-[-0.02em]">3 quotes received</h2>
          <p className="text-[13px] text-ink-2">Choose a lawyer by 9:00 am on Friday 20 November. If you don&apos;t, this request closes and you can ask again.</p>
          <div className="rounded-input border border-line bg-subtle px-4 py-3 text-xs leading-[1.6] text-ink-2">{DISCLOSURE}</div>
          {LAWYERS.map((l) => <QuoteCard key={l.name} lawyer={l} />)}
        </div>
      </div>
    </div>
  );
}

function Bubble({ mine, name, body }: { mine?: boolean; name?: string; body: string }) {
  return (
    <li className={cn("flex max-w-[85%] flex-col gap-1", mine ? "items-end self-end" : "items-start self-start")}>
      <span className="text-[11.5px] text-muted">{mine ? "You" : `${name} · Your lawyer`} · 4 Nov, 09:12</span>
      <p className={cn("rounded-card px-3.5 py-2 text-[13px] leading-[1.6]", mine ? "bg-gold text-white" : "bg-subtle text-ink")}>{body}</p>
    </li>
  );
}

/** lawyer-stages.tsx's EngagedStage, with lawyer-messages.desktop.tsx and lawyer-message.tsx. */
function MessagesDesktop({ chat }: { chat: HowChat }) {
  const sarah = LAWYERS[0];
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <CaseHeaderMini chat={chat} hasLawyer />
      <TabsMini active="Lawyer" lawyerStatus={{ text: "Working with Sarah", tone: "bg-success-bg text-success-ink" }} />
      <div className="mx-auto grid w-full max-w-[1120px] grid-cols-[300px_minmax(0,1fr)] items-start gap-6 px-10 pt-7">
        <RequestAside position={4} reviewing="A lawyer is reviewing" quoteLabel="Review the quote" />
        <div className="flex min-w-0 flex-col gap-4">
          <LawyerHeaderMini lawyer={sarah} working>You&apos;re working with {sarah.name}</LawyerHeaderMini>
          <div className="flex flex-col gap-3 rounded-modal border border-line p-4">
            <div className="flex items-center gap-2 text-[13px] font-medium">
              <MessageCircleMore size={16} className="text-muted" />
              Messages with {sarah.name}
            </div>
            <p className="text-[12.5px] leading-[1.6] text-ink-2">They can already see your case and documents. Ask them anything here.</p>
            <ul className="flex flex-col gap-3.5">
              <Bubble name={sarah.name} body="Hi Jane, I've read your case. Could you share the letter you received? I'll go through it before our call." />
              <li className="flex max-w-[85%] flex-col items-end gap-1 self-end">
                <span className="text-[11.5px] text-muted">You · 4 Nov, 09:30</span>
                <p className="rounded-card bg-gold px-3.5 py-2 text-[13px] leading-[1.6] text-white">Thanks Sarah. Here it is.</p>
                <div className="flex items-center gap-2.5 rounded-card border border-line px-3 py-2">
                  <FileText size={16} className="shrink-0 text-muted" />
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium">Letter.pdf</div>
                    <div className="text-[11.5px] text-muted">Shared by Jane Smith · 4 Nov 2026</div>
                  </div>
                </div>
              </li>
              <Bubble name={sarah.name} body="That helps, thank you. I'll write back this week." />
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

const USER_BUBBLE = "rounded-[18px_18px_4px_18px] border border-line bg-bubble";

/** components/case/consultation.desktop.tsx */
function LetterDesktop({ chat }: { chat: HowChat }) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <CaseHeaderMini chat={chat} />
      <TabsMini active="Interview" />
      <div className="min-h-0 flex-1 overflow-hidden px-12 pb-3 pt-7">
        <div className="mx-auto flex max-w-[768px] flex-col gap-[22px]">
          <div className="flex max-w-[80%] flex-col items-end gap-1.5 self-end">
            <div className={cn(USER_BUBBLE, "px-4 py-3 text-[15px] leading-[1.6]")}>I&apos;ve had this letter and I&apos;m not sure what it means.</div>
            <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2 py-0.5 text-[11px] text-ink-2">
              <FileText size={10} />
              Letter.pdf
            </span>
          </div>
          <div className="flex gap-3">
            <AiMark />
            <div className="flex min-w-0 flex-col gap-2.5 text-[15px] leading-[1.7]">
              <div>I&apos;ve read the letter you added. It&apos;s a formal letter about your {chat.label.toLowerCase()}, and it asks for a reply by 20 November. I&apos;ve added that date to your overview, so a lawyer will see it too.</div>
              <div className="text-xs text-muted">{AI_NOTE}</div>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-card border border-line bg-subtle px-4 py-3">
            <div className="min-w-[200px] flex-1">
              <div className="text-sm font-semibold">Want a lawyer to look at this case?</div>
              <div className="text-[13px] leading-[1.45] text-ink-2">A verified lawyer reviews this case and your chat. Included with your case.</div>
            </div>
            <span className="rounded-full bg-gold px-4 py-2 text-[11px] font-semibold uppercase tracking-[1px] text-white">Get a lawyer</span>
          </div>
        </div>
      </div>
      <div className="shrink-0 px-12 pb-[18px] pt-2">
        <div className="mx-auto flex max-w-[768px] items-center gap-1.5 rounded-composer border border-line bg-subtle p-2">
          <span className="flex size-11 items-center justify-center text-ink-2">
            <Paperclip size={20} />
          </span>
          <span className="flex-1 px-1.5 text-[15px] text-muted">Tell me what&apos;s going on…</span>
          <span className="flex size-11 items-center justify-center text-ink-2">
            <Mic size={20} />
          </span>
          <span className="flex size-11 items-center justify-center rounded-full bg-chip text-muted">
            <ArrowUp size={20} />
          </span>
        </div>
      </div>
    </div>
  );
}

/** The laptop's screen for this step of the story. */
export function MiniDesktopScreen({ scene, chat }: { scene: number; chat: HowChat }) {
  if (scene === 0) return <NewCaseDesktop />;
  if (scene === 1) return <OverviewDesktop chat={chat} />;
  if (scene === 2) return <QuotesDesktop chat={chat} />;
  if (scene === 3) return <QuotesDesktop chat={chat} comparing />;
  if (scene === 4) return <MessagesDesktop chat={chat} />;
  return <LetterDesktop chat={chat} />;
}

/* ---------- Phone screens ---------- */

/** components/cases/intake-chat.mobile.tsx, while it's empty, typing out the visitor's own words. */
function NewCasePhone({ chat }: { chat: HowChat }) {
  const typed = chat.msg.slice(0, chat.n);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pt-2">
        <span className="flex min-h-11 items-center gap-2 text-[10px] font-semibold uppercase tracking-[1.2px] text-ink-2">
          <ArrowLeft size={14} />
          Cases
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-6 text-center">
        <h1 className="font-display text-balance text-[30px] font-normal leading-[1.1] tracking-[-0.02em]">What&apos;s going on?</h1>
        <p className="mt-2.5 max-w-[320px] text-[15px] leading-normal text-ink-2">Tell us in your own words. We&apos;ll ask a few questions and set up your case.</p>
        <span className="mt-4 flex min-h-11 items-center text-[14px] font-medium text-ink-2 underline underline-offset-4">Prefer a form? Fill it in instead</span>
      </div>
      <div className="shrink-0 border-t border-line px-3 pb-7 pt-2.5">
        <div className="-mx-3 mb-2 flex gap-1.5 overflow-hidden px-3">
          {STARTERS.map((s) => (
            <span key={s} className="flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-full border border-line-chip bg-subtle px-3.5 text-[13px] font-medium">
              {s}
            </span>
          ))}
        </div>
        <div className="flex items-end gap-1 rounded-[24px] border border-line-input bg-white p-1">
          <span className="flex size-11 shrink-0 items-center justify-center text-ink-2">
            <Paperclip size={20} />
          </span>
          <span className={cn("min-h-11 min-w-0 flex-1 px-1 py-2.5 text-base leading-6", !typed && "text-muted")}>
            {typed || "Tell me what's going on…"}
            {typed && <span className="ml-px inline-block h-4 w-[1.5px] bg-gold align-[-2px]" />}
          </span>
          <span className="flex size-11 shrink-0 items-center justify-center text-ink-2">
            <Mic size={20} />
          </span>
          <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", typed ? "bg-ink text-white" : "bg-chip text-muted")}>
            <ArrowUp size={20} />
          </span>
        </div>
        <p className="mt-2 text-center text-[11.5px] leading-[1.4] text-muted">AI guidance, not legal advice.</p>
      </div>
    </div>
  );
}

/** components/case/case-header.mobile.tsx, tabs.mobile.tsx and consultation.mobile.tsx */
function InterviewPhone({ chat }: { chat: HowChat }) {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-line px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="flex size-11 shrink-0 items-center justify-center">
            <ArrowLeft size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[10.5px] font-semibold uppercase tracking-[0.8px] text-gold">{chat.area} · Leeds</div>
            <div className="font-display truncate text-[18px] leading-[1.25] tracking-[-0.01em]">{chat.label}</div>
          </div>
          <span className="flex min-h-11 shrink-0 items-center rounded-full border border-line bg-subtle px-3 text-[13px] font-semibold">
            46<span className="ml-1 font-medium">credits</span>
          </span>
        </div>
      </div>
      <div className="grid shrink-0 auto-cols-fr grid-flow-col border-b border-line bg-white">
        {["Interview", "Overview", "Documents"].map((t, i) => (
          <span key={t} className={cn("relative flex min-h-12 min-w-0 items-center justify-center px-1 text-[14px] font-medium", i === 0 ? "text-ink" : "text-ink-2")}>
            <span className="truncate">{t}</span>
            <span className={cn("absolute inset-x-3 bottom-0 h-0.5 rounded-full", i === 0 ? "bg-gold" : "bg-transparent")} />
          </span>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="flex max-w-[85%] flex-col items-end gap-1.5 self-end">
            <div className={cn(USER_BUBBLE, "break-words px-3.5 py-2.5 text-[15px] leading-normal")}>{chat.msg}</div>
          </div>
          <div className="flex gap-2.5">
            <AiMark />
            {chat.reply === 2 ? (
              <div className="flex min-w-0 flex-col gap-3 break-words text-[15px] leading-[1.6]">
                <div>Thanks for telling us. {firstLine(chat)}</div>
                <div>{chat.question}</div>
              </div>
            ) : (
              <div className="flex items-center gap-1 py-2.5">
                {[0, 1, 2].map((i) => <span key={i} className="size-1.5 rounded-full bg-muted" style={{ opacity: 1 - i * 0.25 }} />)}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="shrink-0 px-3 pb-7 pt-2">
        <div className="flex items-center gap-1 rounded-[24px] border border-line bg-subtle p-1">
          <span className="flex size-11 items-center justify-center text-ink-2">
            <Paperclip size={20} />
          </span>
          <span className="flex-1 px-1 text-base text-muted">Tell me what&apos;s going on…</span>
          <span className="flex size-11 items-center justify-center text-ink-2">
            <Mic size={20} />
          </span>
          <span className="flex size-11 items-center justify-center rounded-full bg-chip text-muted">
            <ArrowUp size={20} />
          </span>
        </div>
      </div>
    </div>
  );
}

export function MiniPhoneScreen({ chat }: { chat: HowChat }) {
  return chat.sent ? <InterviewPhone chat={chat} /> : <NewCasePhone chat={chat} />;
}
