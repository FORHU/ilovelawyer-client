import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, ArrowUp, Check, Ellipsis, FileText, MessageCircleMore, Mic, Paperclip, Scale } from "lucide-react";
import { AiMark, Eyebrow } from "@/components/ui/misc";
import { cn } from "@/lib/cn";
import type { MockLawyer } from "@/lib/marketing/content/types";
import { useLandingContent } from "./landing-content";
import type { HowChat } from "./use-how";

// Mini versions of the app's real screens for the landing page's phone and laptop: the same structure
// and classes as components/case and components/cases, with sample content and nothing live (no
// queries, sockets or stores, which a signed-out public page mustn't run). When one of those screens
// changes, change its mini version here. The words, lawyers and fees are the site's (lib/marketing/
// content): the lawyers are invented and the fees are placeholders, which is why the laptop's frame
// says "Sample case". Where the client agrees the fee with the lawyer directly (KR, quotes.directFee),
// there is one chosen lawyer and no amounts at all.

const CARD = "flex flex-col gap-4 rounded-modal border border-line bg-white p-6";

/* ---------- Shared parts ---------- */

/** components/case/case-header.desktop.tsx */
function CaseHeaderMini({ chat, hasLawyer }: { chat: HowChat; hasLawyer?: boolean }) {
  const { mock } = useLandingContent();
  return (
    <div className="flex shrink-0 items-center gap-x-3 border-b border-line px-6 py-[14px]">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-white">
        <ArrowLeft size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-[1px] text-gold">{chat.area} · {mock.city}</div>
        <div className="font-display truncate text-xl leading-[1.25] tracking-[-0.02em]">{chat.label}</div>
      </div>
      <div className="flex shrink-0 gap-2">
        <span className="flex w-[230px] shrink-0 flex-col gap-1.5 rounded-card border border-line bg-subtle px-3.5 py-2 text-[12.5px] font-medium text-ink">
          <span className="flex items-center justify-between gap-2">
            <span>{mock.credits}</span>
            <span className="font-semibold text-gold">{mock.topUp}</span>
          </span>
          <span className="h-1 overflow-hidden rounded-full bg-line">
            <span className="block h-full w-[8%] rounded-full bg-gold" />
          </span>
        </span>
        {!hasLawyer && (
          <span className="flex items-center gap-2 rounded-full border border-line-input bg-white px-4 text-[13px] font-medium">
            <Scale size={14} />
            {mock.getLawyer}
          </span>
        )}
        <span className="flex size-10 items-center justify-center self-center rounded-full border border-line">
          <Ellipsis size={16} />
        </span>
      </div>
    </div>
  );
}

type Tab = "interview" | "overview" | "documents" | "lawyer";

/** components/case/tabs.desktop.tsx */
function TabsMini({ active, lawyerStatus }: { active: Tab; lawyerStatus?: { text: string; tone: string } }) {
  const { mock } = useLandingContent();
  const tabs: Tab[] = ["interview", "overview", "documents", ...(lawyerStatus ? (["lawyer"] as const) : [])];
  return (
    <div className="flex shrink-0 gap-1 border-b border-line px-10">
      {tabs.map((t) => (
        <span key={t} className={cn("-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-[14px] py-3 text-sm font-medium", t === active ? "border-gold text-ink" : "border-transparent text-ink-2")}>
          {mock.tabs[t]}
          {t === "documents" && <span className="rounded-full bg-chip px-[7px] text-[11px] leading-[18px] text-ink">1</span>}
          {t === "lawyer" && lawyerStatus && <span className={cn("rounded-full px-[9px] py-px text-[11px] font-semibold", lawyerStatus.tone)}>{lawyerStatus.text}</span>}
        </span>
      ))}
    </div>
  );
}

/** components/case/lawyer-stages.tsx: StepDot and RequestSteps, with its surrounding aside. */
function RequestAside({ position, reviewing, quoteLabel }: { position: number; reviewing: string; quoteLabel: string }) {
  const { request } = useLandingContent().mock;
  const steps = [
    request.sent,
    request.finding,
    { label: reviewing, sub: request.reviewingSub },
    { label: quoteLabel, sub: request.quoteSub },
    request.working,
  ];
  return (
    <section className="flex flex-col gap-4 rounded-card border border-line bg-white p-5">
      <div className="flex flex-col gap-0.5">
        <Eyebrow muted>{request.eyebrow}</Eyebrow>
        <h2 className="text-base font-semibold">{request.title}</h2>
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

/** components/case/lawyer-stages.tsx: LawyerHeader. The registration number is left out: these lawyers are invented. */
function LawyerHeaderMini({ lawyer, children, working }: { lawyer: MockLawyer; children?: ReactNode; working?: boolean }) {
  const { quotes } = useLandingContent().mock;
  return (
    <div className={cn("flex items-center gap-4 rounded-modal border px-5 py-4", working ? "border-success-line bg-success-bg" : "border-line bg-white")}>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">{lawyer.initials}</span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-base font-semibold">{children ?? lawyer.name}</span>
        <span className={cn("text-xs", working ? "text-success-ink" : "text-ink-2")}>{lawyer.firm} · {quotes.verified}</span>
      </div>
    </div>
  );
}

function QuoteCard({ lawyer }: { lawyer: MockLawyer }) {
  const { quotes } = useLandingContent().mock;
  return (
    <div className="flex flex-col gap-3">
      <LawyerHeaderMini lawyer={lawyer} />
      <p className="px-1 text-[13px] leading-[1.6] text-ink-2">{lawyer.bio}</p>
      <section className={CARD}>
        <Eyebrow muted>{quotes.quoteEyebrow}</Eyebrow>
        {quotes.directFee ? (
          <>
            <p className="text-[14px] text-[#4a4a4a]">{lawyer.message}</p>
            <div className="rounded-input border border-line bg-subtle px-4 py-3.5 text-[13px]">{quotes.directFee}</div>
          </>
        ) : (
          <>
            <span className="font-display text-[34px] leading-none tracking-[-0.02em]">{lawyer.total}</span>
            <p className="text-[14px] text-[#4a4a4a]">{lawyer.message}</p>
            <div className="flex flex-col gap-1.5 rounded-input border border-line bg-subtle px-4 py-3.5 text-[13px]">
              <div className="flex justify-between gap-2">
                <span>{quotes.feeLine?.(lawyer.first)}</span>
                <span>{lawyer.fee}</span>
              </div>
              <div className="flex justify-between gap-2 text-ink-2">
                <span>{quotes.platformFee}</span>
                <span>{lawyer.platform}</span>
              </div>
              <div className="flex justify-between gap-2 border-t border-line pt-2 text-[15px] font-semibold">
                <span>{quotes.youPay}</span>
                <span>{lawyer.total}</span>
              </div>
            </div>
          </>
        )}
        <div className="flex gap-2.5">
          <span className="flex h-[46px] flex-1 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">{quotes.accept(lawyer.total ?? "")}</span>
          <span className="flex h-[46px] flex-1 items-center justify-center rounded-full border border-line-input text-sm">{quotes.decline}</span>
        </div>
      </section>
    </div>
  );
}

/* ---------- Laptop screens ---------- */

/** components/cases/intake-chat.desktop.tsx, while it's empty. */
function NewCaseDesktop() {
  const { mock } = useLandingContent();
  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto flex w-full max-w-[768px] items-center justify-between px-6 pt-5">
        <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[1.2px] text-ink-2">
          <ArrowLeft size={14} />
          {mock.cases}
        </span>
        <span className="rounded-full border border-line px-3 py-1.5 text-[12px] font-medium text-ink-2">{mock.guide}</span>
      </div>
      <div className="mx-auto flex w-full max-w-[768px] flex-1 flex-col justify-center gap-7 px-6 pb-24 pt-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="font-display text-[44px] font-normal leading-tight tracking-[-0.02em]">{mock.newCaseTitle}</h1>
          <p className="max-w-[540px] text-[15px] leading-[1.55] text-ink-2">{mock.newCaseBody}</p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5 rounded-[28px] border border-line-input bg-white p-2 shadow-[0_2px_14px_rgb(0_0_0/0.06)]">
            <span className="flex size-11 shrink-0 items-center justify-center text-ink-2 opacity-40">
              <Paperclip size={20} />
            </span>
            <span className="flex-1 px-1.5 text-base leading-6 text-muted">{mock.composerPlaceholder}</span>
            <span className="flex size-11 shrink-0 items-center justify-center text-ink-2">
              <Mic size={20} />
            </span>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-chip text-muted">
              <ArrowUp size={20} />
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {mock.starters.map((s) => (
              <span key={s} className="flex min-h-8 items-center rounded-full border border-line-chip bg-subtle px-3 text-[12.5px] font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          <span className="flex items-center gap-2 rounded-full border border-line-input px-5 py-2.5 text-[13.5px] font-medium">
            {mock.fillForm}
            <ArrowRight size={14} className="text-gold" />
          </span>
        </div>
      </div>
    </div>
  );
}

/** components/case/overview/overview.desktop.tsx */
function OverviewDesktop({ chat }: { chat: HowChat }) {
  const { overview } = useLandingContent().mock;
  const criteria = overview.criteria;
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <CaseHeaderMini chat={chat} />
      <TabsMini active="overview" />
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-10 pt-7">
        <section className="flex items-center gap-x-6 rounded-modal border border-line bg-subtle px-6 py-[22px]">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex items-baseline gap-x-3">
              <span className="text-[10px] font-semibold uppercase tracking-[1px] text-ink-2">{overview.readyEyebrow}</span>
              <span className="font-display text-[22px] tracking-[-0.02em]">{overview.readyTitle}</span>
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
              {overview.upToDate}
            </span>
            <span className="flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-[13px] font-medium text-white">
              {overview.continueInterview}
              <ArrowRight size={14} />
            </span>
          </div>
        </section>
        <div className="grid grid-cols-[minmax(0,1fr)_300px] items-start gap-6">
          <div className="flex min-w-0 flex-col gap-5">
            <section className="flex flex-col gap-3 rounded-card border border-line bg-white px-6 py-[22px]">
              <div className="flex items-center justify-between gap-2">
                <Eyebrow muted>{overview.summary}</Eyebrow>
                <span className="rounded-full bg-chip px-2 py-0.5 text-[11px] text-ink-2">{overview.aiWritten}</span>
              </div>
              <p className="font-display text-[19px] leading-normal tracking-[-0.01em]">{overview.summaryText(chat.msg)}</p>
            </section>
            <section className="flex flex-col gap-3.5 rounded-card border border-line bg-white px-6 py-[22px]">
              <Eyebrow muted>{overview.timeline}</Eyebrow>
              <ol className="flex flex-col gap-4 border-l border-line pl-[18px] text-[14px]">
                <li className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-4">
                  <span className="text-[12.5px] text-ink-2">{overview.timelineDate}</span>
                  <div className="flex flex-col gap-0.5">
                    <span>{overview.timelineEvent}</span>
                    <span className="text-[12.5px] text-gold underline underline-offset-2">{overview.timelineSource}</span>
                  </div>
                </li>
              </ol>
            </section>
          </div>
          <aside className="flex min-w-0 flex-col gap-4">
            <section className="flex flex-col gap-3 rounded-card border border-line bg-white px-5 py-[18px]">
              <h3 className="text-[15px] font-semibold">{overview.stillNeeded}</h3>
              <div className="flex gap-2.5 text-[14px]">
                <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-chip text-[11px] font-semibold">1</span>
                <div className="flex min-w-0 flex-col gap-[3px]">
                  <span>{overview.stillQuestion}</span>
                  <span className="text-[12.5px] text-ink-2">{overview.stillWhy}</span>
                  <span className="text-[12.5px] font-medium text-gold underline underline-offset-2">{overview.stillAnswer}</span>
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
 * the column to the second quote, where there is one: with a single chosen lawyer (KR) it stays put. */
function QuotesDesktop({ chat, comparing: comparingScene }: { chat: HowChat; comparing?: boolean }) {
  const { mock } = useLandingContent();
  const { quotes } = mock;
  const comparing = comparingScene && mock.lawyers.length > 1;
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <CaseHeaderMini chat={chat} hasLawyer />
      <TabsMini active="lawyer" lawyerStatus={{ text: quotes.status, tone: "bg-error-bg text-error-ink" }} />
      <div className="mx-auto grid w-full max-w-[1120px] grid-cols-[300px_minmax(0,1fr)] items-start gap-6 px-10 pt-7">
        <RequestAside position={3} reviewing={quotes.reviewing} quoteLabel={quotes.compare} />
        <div className="flex min-w-0 flex-col gap-4" style={comparing ? { marginTop: -545 } : undefined}>
          <h2 className="font-display text-2xl font-normal tracking-[-0.02em]">{quotes.heading}</h2>
          <p className="text-[13px] text-ink-2">{quotes.deadline}</p>
          <div className="rounded-input border border-line bg-subtle px-4 py-3 text-xs leading-[1.6] text-ink-2">{mock.disclosure}</div>
          {mock.lawyers.map((l) => <QuoteCard key={l.name} lawyer={l} />)}
        </div>
      </div>
    </div>
  );
}

function Bubble({ mine, name, body, time }: { mine?: boolean; name?: string; body: string; time: string }) {
  const { messages } = useLandingContent().mock;
  return (
    <li className={cn("flex max-w-[85%] flex-col gap-1", mine ? "items-end self-end" : "items-start self-start")}>
      <span className="text-[11.5px] text-muted">{mine ? messages.you : messages.author(name ?? "")} · {time}</span>
      <p className={cn("rounded-card px-3.5 py-2 text-[13px] leading-[1.6]", mine ? "bg-gold text-white" : "bg-subtle text-ink")}>{body}</p>
    </li>
  );
}

/** lawyer-stages.tsx's EngagedStage, with lawyer-messages.desktop.tsx and lawyer-message.tsx. */
function MessagesDesktop({ chat }: { chat: HowChat }) {
  const { mock } = useLandingContent();
  const { messages } = mock;
  const lead = mock.lawyers[0];
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <CaseHeaderMini chat={chat} hasLawyer />
      <TabsMini active="lawyer" lawyerStatus={{ text: messages.workingWith(lead.first), tone: "bg-success-bg text-success-ink" }} />
      <div className="mx-auto grid w-full max-w-[1120px] grid-cols-[300px_minmax(0,1fr)] items-start gap-6 px-10 pt-7">
        <RequestAside position={4} reviewing={messages.reviewingOne} quoteLabel={messages.reviewQuote} />
        <div className="flex min-w-0 flex-col gap-4">
          <LawyerHeaderMini lawyer={lead} working>{messages.workingBanner(lead.name)}</LawyerHeaderMini>
          <div className="flex flex-col gap-3 rounded-modal border border-line p-4">
            <div className="flex items-center gap-2 text-[13px] font-medium">
              <MessageCircleMore size={16} className="text-muted" />
              {messages.heading(lead.name)}
            </div>
            <p className="text-[12.5px] leading-[1.6] text-ink-2">{messages.intro}</p>
            <ul className="flex flex-col gap-3.5">
              <Bubble name={lead.name} body={messages.first} time={messages.firstTime} />
              <li className="flex max-w-[85%] flex-col items-end gap-1 self-end">
                <span className="text-[11.5px] text-muted">{messages.you} · {messages.secondTime}</span>
                <p className="rounded-card bg-gold px-3.5 py-2 text-[13px] leading-[1.6] text-white">{messages.reply(lead.first)}</p>
                <div className="flex items-center gap-2.5 rounded-card border border-line px-3 py-2">
                  <FileText size={16} className="shrink-0 text-muted" />
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium">{messages.file}</div>
                    <div className="text-[11.5px] text-muted">{messages.sharedBy}</div>
                  </div>
                </div>
              </li>
              <Bubble name={lead.name} body={messages.last} time={messages.firstTime} />
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
  const { mock } = useLandingContent();
  const { letter } = mock;
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <CaseHeaderMini chat={chat} />
      <TabsMini active="interview" />
      <div className="min-h-0 flex-1 overflow-hidden px-12 pb-3 pt-7">
        <div className="mx-auto flex max-w-[768px] flex-col gap-[22px]">
          <div className="flex max-w-[80%] flex-col items-end gap-1.5 self-end">
            <div className={cn(USER_BUBBLE, "px-4 py-3 text-[15px] leading-[1.6]")}>{letter.userBubble}</div>
            <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2 py-0.5 text-[11px] text-ink-2">
              <FileText size={10} />
              {letter.file}
            </span>
          </div>
          <div className="flex gap-3">
            <AiMark />
            <div className="flex min-w-0 flex-col gap-2.5 text-[15px] leading-[1.7]">
              <div>{letter.aiReply(chat.label)}</div>
              <div className="text-xs text-muted">{mock.aiNote}</div>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-card border border-line bg-subtle px-4 py-3">
            <div className="min-w-[200px] flex-1">
              <div className="text-sm font-semibold">{letter.offerTitle}</div>
              <div className="text-[13px] leading-[1.45] text-ink-2">{letter.offerBody}</div>
            </div>
            <span className="rounded-full bg-gold px-4 py-2 text-[11px] font-semibold uppercase tracking-[1px] text-white">{mock.getLawyer}</span>
          </div>
        </div>
      </div>
      <div className="shrink-0 px-12 pb-[18px] pt-2">
        <div className="mx-auto flex max-w-[768px] items-center gap-1.5 rounded-composer border border-line bg-subtle p-2">
          <span className="flex size-11 items-center justify-center text-ink-2">
            <Paperclip size={20} />
          </span>
          <span className="flex-1 px-1.5 text-[15px] text-muted">{mock.composerPlaceholder}</span>
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
  const { mock } = useLandingContent();
  const typed = chat.msg.slice(0, chat.n);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pt-2">
        <span className="flex min-h-11 items-center gap-2 text-[10px] font-semibold uppercase tracking-[1.2px] text-ink-2">
          <ArrowLeft size={14} />
          {mock.cases}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-6 text-center">
        <h1 className="font-display text-balance text-[30px] font-normal leading-[1.1] tracking-[-0.02em]">{mock.newCaseTitle}</h1>
        <p className="mt-2.5 max-w-[320px] text-[15px] leading-normal text-ink-2">{mock.newCaseBodyPhone}</p>
        <span className="mt-4 flex min-h-11 items-center text-[14px] font-medium text-ink-2 underline underline-offset-4">{mock.fillFormPhone}</span>
      </div>
      <div className="shrink-0 border-t border-line px-3 pb-7 pt-2.5">
        <div className="-mx-3 mb-2 flex gap-1.5 overflow-hidden px-3">
          {mock.starters.map((s) => (
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
            {typed || mock.composerPlaceholder}
            {typed && <span className="ml-px inline-block h-4 w-[1.5px] bg-gold align-[-2px]" />}
          </span>
          <span className="flex size-11 shrink-0 items-center justify-center text-ink-2">
            <Mic size={20} />
          </span>
          <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", typed ? "bg-ink text-white" : "bg-chip text-muted")}>
            <ArrowUp size={20} />
          </span>
        </div>
        <p className="mt-2 text-center text-[11.5px] leading-[1.4] text-muted">{mock.shortDisclaimer}</p>
      </div>
    </div>
  );
}

/** components/case/case-header.mobile.tsx, tabs.mobile.tsx and consultation.mobile.tsx */
function InterviewPhone({ chat }: { chat: HowChat }) {
  const { mock } = useLandingContent();
  const [creditCount, ...creditWords] = mock.credits.split(" ");
  const tabs = [mock.tabs.interview, mock.tabs.overview, mock.tabs.documents];
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-line px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="flex size-11 shrink-0 items-center justify-center">
            <ArrowLeft size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[10.5px] font-semibold uppercase tracking-[0.8px] text-gold">{chat.area} · {mock.city}</div>
            <div className="font-display truncate text-[18px] leading-[1.25] tracking-[-0.01em]">{chat.label}</div>
          </div>
          <span className="flex min-h-11 shrink-0 items-center rounded-full border border-line bg-subtle px-3 text-[13px] font-semibold">
            {creditCount}<span className="ml-1 font-medium">{creditWords.join(" ")}</span>
          </span>
        </div>
      </div>
      <div className="grid shrink-0 auto-cols-fr grid-flow-col border-b border-line bg-white">
        {tabs.map((t, i) => (
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
                <div>{mock.interview.thanks} {mock.interview.soundsLike(chat.label, chat.help)}</div>
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
          <span className="flex-1 px-1 text-base text-muted">{mock.composerPlaceholder}</span>
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
