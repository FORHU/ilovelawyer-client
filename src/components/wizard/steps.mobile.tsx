"use client";

import { useState, type ReactNode } from "react";
import { Check, FileText, Plus, UploadCloud, X } from "lucide-react";
import { BottomSheet } from "@/components/mobile/bottom-sheet";
import { Button } from "@/components/ui/button";
import { FilePicker } from "@/components/ui/file-picker";
import { inputClass, TextInput, WizardLabel } from "@/components/ui/input";
import { RadioCard } from "@/components/ui/radio-card";
import { BUDGET_RANGES, FEE_PREFERENCES, budgetFromDraft, formatBudget, ownAmountError, type BudgetDraft } from "@/lib/cases/budget";
import { useCaseAreasQuery } from "@/lib/cases/case-areas";
import { describeLimits } from "@/lib/cases/limits";
import { cn } from "@/lib/cn";
import { UK_JURISDICTIONS, sideLabel, type CaseRegion } from "@/lib/types";
import { useWizard } from "@/lib/wizard-store";
import { IntakeNotesField, OthersField, SideField, useWizardFiles } from "./steps";

// The phone's version of the four steps. Same questions and same store as the desktop steps, laid
// out for a thumb: one column, no cards inside cards, pickers in sheets, and full-width choices.

const REGIONS: { value: CaseRegion; label: string }[] = [
  ...UK_JURISDICTIONS.map((j) => ({ value: j, label: j })),
  { value: "OUTSIDE_UK", label: "Outside the UK" },
];

/** A step: its question, a line of help, then the fields. No card around it. */
function MobileStep({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-balance font-display text-[26px] font-normal leading-[1.15] tracking-[-0.02em]">{title}</h2>
        <p className="mt-1.5 text-[14px] leading-[1.5] text-ink-2">{sub}</p>
      </div>
      {children}
    </section>
  );
}

function Hint({ error, children }: { error?: boolean; children: ReactNode }) {
  return <div className={cn("text-[13px] leading-[1.4]", error ? "text-error" : "text-muted")}>{children}</div>;
}

/** Types of issue: what's picked shows as removable chips, and picking opens a searchable sheet of
 * 52px rows instead of a small scrolling list inside the page. */
function AreaFieldMobile({ value, onChange, error }: { value: string[]; onChange: (codes: string[]) => void; error?: boolean }) {
  const areas = useCaseAreasQuery();
  const offered = areas.data ?? [];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const chosen = value.map((code) => offered.find((a) => a.code === code)).filter((a) => a !== undefined);
  const toggle = (code: string) => onChange(value.includes(code) ? value.filter((c) => c !== code) : [...value, code]);
  const q = query.trim().toLowerCase();
  const visible = offered.filter((a) => !q || a.name.toLowerCase().includes(q));
  const close = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <div id="field-areas" tabIndex={-1} className="flex flex-col gap-2 outline-none" role="group" aria-label="Type of issue">
      <WizardLabel>Type of issue *</WizardLabel>
      {chosen.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Picked types of issue">
          {chosen.map((a) => (
            <li key={a.code} className="inline-flex min-h-11 items-center gap-1 rounded-full bg-chip pl-4 pr-1 text-[14px] font-medium text-ink">
              {a.name}
              <button type="button" onClick={() => toggle(a.code)} aria-label={`Remove ${a.name}`} data-no-tap className="flex size-10 items-center justify-center rounded-full text-ink-2 active:bg-ink/10">
                <X size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        disabled={!areas.data}
        data-no-tap
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-input border bg-white px-4 text-left text-[16px] disabled:opacity-60",
          error || areas.isError ? "border-error-field" : "border-line-input",
        )}
      >
        <span className={chosen.length ? "text-ink" : "text-muted"}>{areas.isLoading ? "Loading…" : chosen.length ? "Add another type" : "Choose type of issue"}</span>
        <Plus size={18} className="text-ink-2" aria-hidden="true" />
      </button>
      <Hint error={error || areas.isError}>
        {areas.isError ? "Couldn't load the types of issue. Refresh to try again." : error ? "Please choose at least one type of issue." : "Pick every one that fits. We'll use them to find the right lawyer."}
      </Hint>

      <BottomSheet open={open} onClose={close} title="Type of issue" className="h-[88dvh]">
        <div className="flex h-full flex-col">
          <div className="px-3 pb-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search types of issue"
              aria-label="Search types of issue"
              enterKeyHint="search"
              className={cn(inputClass, "rounded-full px-4 text-base")}
            />
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto" aria-label="Types of issue">
            {visible.map((a) => {
              const picked = value.includes(a.code);
              return (
                <li key={a.code}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={picked}
                    onClick={() => toggle(a.code)}
                    data-no-tap
                    className="flex min-h-[52px] w-full items-center gap-3 rounded-card px-3 text-left text-[16px] active:bg-chip"
                  >
                    <span aria-hidden="true" className={cn("flex size-6 shrink-0 items-center justify-center rounded-md border", picked ? "border-ink bg-ink text-white" : "border-line-input bg-white")}>
                      {picked && <Check size={15} strokeWidth={3} />}
                    </span>
                    {a.name}
                  </button>
                </li>
              );
            })}
            {visible.length === 0 && <li className="px-3 py-8 text-center text-[14px] text-muted">No type of issue matches that. Try another word, or pick Other.</li>}
          </ul>
          <div className="px-3 pt-2">
            <Button size="xl" className="w-full" onClick={close}>
              {value.length ? `Done · ${value.length} picked` : "Done"}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

/** Which part of the UK, as a grid of big buttons. */
function RegionFieldMobile({ value, onChange, error }: { value: CaseRegion | ""; onChange: (r: CaseRegion) => void; error?: boolean }) {
  return (
    <div id="field-region" tabIndex={-1} className="flex flex-col gap-2 outline-none" role="radiogroup" aria-label="Which part of the UK?">
      <WizardLabel>Which part of the UK? *</WizardLabel>
      <div className="grid grid-cols-2 gap-2">
        {REGIONS.map((r) => (
          <button
            key={r.value}
            type="button"
            role="radio"
            aria-checked={value === r.value}
            onClick={() => onChange(r.value)}
            data-no-tap
            className={cn(
              "min-h-12 rounded-card border-[1.5px] px-3 text-[15px] font-medium transition-colors active:bg-chip",
              r.value === "OUTSIDE_UK" && "col-span-2",
              value === r.value ? "border-gold bg-white text-ink" : "border-line bg-white text-ink-2",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
      <Hint error={error}>{error ? "Please choose where this happened." : "The law is different in each, so this decides the rules we use and, later, the right lawyer."}</Hint>
    </div>
  );
}

export function StepDetailsMobile() {
  const { title, region, where, areas, happened, wants, titleErr, regionErr, areasErr, set } = useWizard();
  // The optional notes stay folded away until asked for, unless there is something in them.
  const [more, setMore] = useState(!!(happened || wants));
  return (
    <MobileStep title="What's your case about?" sub="Give it a short name you'll recognise later.">
      <div className="flex flex-col gap-2">
        <WizardLabel htmlFor="case-title">Case title *</WizardLabel>
        <input
          id="case-title"
          value={title}
          maxLength={150}
          placeholder="e.g. Fired without notice from my job"
          autoComplete="off"
          enterKeyHint="next"
          aria-invalid={titleErr}
          aria-describedby={titleErr ? "case-title-err" : undefined}
          onChange={(e) => set({ title: e.target.value })}
          className={cn(inputClass, "font-display text-[17px]", titleErr && "border-error-field")}
        />
        <div className="flex justify-between gap-3 text-[13px]">
          <span id="case-title-err" role={titleErr ? "alert" : undefined} className="text-error">
            {titleErr ? "Please give your case a title." : ""}
          </span>
          <span className="text-muted tabular-nums">{title.length}/150</span>
        </div>
      </div>
      <AreaFieldMobile value={areas} onChange={(codes) => set({ areas: codes })} error={areasErr} />
      <RegionFieldMobile value={region} onChange={(r) => set({ region: r })} error={regionErr} />
      <div className="flex flex-col gap-2">
        <WizardLabel htmlFor="case-where">Town or city</WizardLabel>
        <TextInput id="case-where" value={where} placeholder="e.g. Leeds" autoComplete="address-level2" enterKeyHint="done" onChange={(e) => set({ where: e.target.value })} />
      </div>
      <div className="border-t border-line pt-4">
        {more ? (
          <IntakeNotesField happened={happened} wants={wants} onChange={set} />
        ) : (
          <button type="button" onClick={() => setMore(true)} data-no-tap className="flex min-h-12 w-full items-center justify-between rounded-input border border-dashed border-line-input px-4 text-left text-[15px] font-medium text-ink-2 active:bg-chip">
            Add what happened (optional)
            <Plus size={18} aria-hidden="true" />
          </button>
        )}
      </div>
    </MobileStep>
  );
}

export function StepPeopleMobile() {
  const { side, others, set, addOther, updateOther, removeOther } = useWizard();
  return (
    <MobileStep title="Who is involved?" sub="Tell us your side, and who else is part of this.">
      <SideField value={side} onChange={(s) => set({ side: s })} />
      <div className="border-t border-line pt-5">
        <OthersField others={others} onAdd={addOther} onUpdate={updateOther} onRemove={removeOther} />
      </div>
    </MobileStep>
  );
}

/** What they can spend, as one list to tap: a range, their own amount, or not sure. */
function BudgetFieldMobile({ value, onChange, error }: { value: BudgetDraft; onChange: (patch: Partial<BudgetDraft>) => void; error?: boolean }) {
  const ownError = error ? ownAmountError(value) : null;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="What can you spend on a lawyer?">
        <WizardLabel>What can you spend on a lawyer?</WizardLabel>
        {BUDGET_RANGES.map((r) => (
          <RadioCard key={r.value} compact selected={value.choice === r.value} onSelect={() => onChange({ choice: r.value })} title={r.label} />
        ))}
        <RadioCard compact selected={value.choice === "OWN"} onSelect={() => onChange({ choice: "OWN" })} title="Set my own amount" />
        {value.choice === "OWN" && (
          <div className="flex flex-col gap-1.5">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-muted" aria-hidden="true">
                £
              </span>
              <TextInput
                id="budget-own"
                aria-label="Your budget in pounds"
                inputMode="decimal"
                autoFocus
                value={value.own}
                placeholder="1,200"
                aria-invalid={!!ownError}
                aria-describedby={ownError ? "budget-own-err" : undefined}
                onChange={(e) => onChange({ own: e.target.value })}
                className={cn("pl-8", ownError && "border-error-field")}
              />
            </div>
            {ownError && (
              <div id="budget-own-err" role="alert" className="text-[13px] text-error">
                {ownError}
              </div>
            )}
          </div>
        )}
        <RadioCard compact selected={value.choice === ""} onSelect={() => onChange({ choice: "", own: "" })} title="Not sure" />
        <Hint>Lawyers see this before they quote, so their quotes fit what you can spend. You can change it later.</Hint>
      </div>
      <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Which kind of fee would you prefer?">
        <WizardLabel>Which kind of fee would you prefer?</WizardLabel>
        {FEE_PREFERENCES.map((f) => (
          <RadioCard key={f.label} compact selected={value.fee === f.value} onSelect={() => onChange({ fee: f.value })} title={f.label} />
        ))}
        <Hint>A fixed fee covers the whole piece of work. A first consultation is a paid first meeting to talk it through.</Hint>
      </div>
    </div>
  );
}

export function StepBudgetMobile() {
  const { budget, budgetErr, setBudget } = useWizard();
  return (
    <MobileStep title="Your budget" sub="Optional. It helps lawyers decide whether to take your case and what to quote.">
      <BudgetFieldMobile value={budget} onChange={setBudget} error={budgetErr} />
    </MobileStep>
  );
}

export function StepDocumentsMobile() {
  const { title, side, others, budget } = useWizard();
  const { files, removeFile, limits, rejected, add } = useWizardFiles();
  const named = others.map((o) => o.name.trim()).filter(Boolean);
  const summary: [string, string][] = [
    ["Case", title.trim() || "Untitled"],
    ["I am", sideLabel(side)],
    ["Others", named.join(", ") || "None added"],
    ["Budget", formatBudget(budgetFromDraft(budget))],
  ];

  return (
    <MobileStep title="Add your documents" sub="Contracts, messages, notices, receipts. The AI reads them to answer your questions. Optional.">
      <dl className="rounded-input border border-line bg-subtle px-4">
        {summary.map(([label, text]) => (
          <div key={label} className="border-b border-line py-2.5 last:border-b-0">
            <dt className="text-[12px] text-muted">{label}</dt>
            <dd className="mt-0.5 break-words text-[14px] text-ink">{text}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-2">
        <FilePicker onPick={add}>
          {(open) => (
            <button
              type="button"
              onClick={open}
              data-no-tap
              className="flex min-h-[132px] flex-col items-center justify-center gap-1.5 rounded-input border border-dashed border-line-input bg-subtle px-4 py-6 text-center active:bg-chip"
            >
              <UploadCloud size={28} className="text-muted" aria-hidden="true" />
              <span className="font-display text-[19px] tracking-[-0.02em]">Choose files</span>
              <span className="text-[13px] leading-[1.45] text-muted">Pick photos or documents, or take a photo of a letter. {describeLimits(limits)}. They upload once your case is created.</span>
            </button>
          )}
        </FilePicker>
      </div>

      {rejected.length > 0 && (
        <div role="alert" className="text-[14px] leading-[1.4] text-error">
          {rejected.join(" ")}
        </div>
      )}
      {files.length > 0 && (
        <ul className="flex flex-col overflow-hidden rounded-input border border-line" aria-label="Chosen files">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-3 border-b border-line py-1 pl-4 pr-1 text-[14px] last:border-b-0">
              <FileText size={16} className="shrink-0 text-gold" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <button type="button" aria-label={`Remove ${f.name}`} onClick={() => removeFile(i)} data-no-tap className="flex size-11 items-center justify-center rounded-full text-muted active:bg-chip">
                <X size={18} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </MobileStep>
  );
}
