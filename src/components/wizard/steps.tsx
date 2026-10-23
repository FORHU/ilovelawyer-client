"use client";

import { useState, type ReactNode } from "react";
import { FileText, Plus, UploadCloud, X } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { FilePicker } from "@/components/ui/file-picker";
import { inputClass, TextArea, TextInput, WizardLabel } from "@/components/ui/input";
import { RadioCard } from "@/components/ui/radio-card";
import { Eyebrow } from "@/components/ui/misc";
import { cn } from "@/lib/cn";
import { checkFiles, describeLimits, useLimitsQuery } from "@/lib/cases/limits";
import { NOTES_FIELD_MAX } from "@/lib/cases/notes";
import {
  AREA_LABELS,
  CASE_AREAS,
  PARTY_ROLES,
  UK_JURISDICTIONS,
  sideLabel,
  type CaseArea,
  type CaseRegion,
  type OtherParty,
  type PartyRole,
  type Side,
} from "@/lib/types";
import { useWizard } from "@/lib/wizard-store";

function Section({
  numeral,
  title,
  sub,
  gap = 24,
  children,
}: {
  numeral: string;
  title: string;
  sub: string;
  gap?: 20 | 24;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-modal border border-line bg-white p-5 md:p-8",
        gap === 24 ? "gap-6" : "gap-5",
      )}
    >
      <div className="flex flex-col gap-1.5">
        <Eyebrow>{numeral}</Eyebrow>
        <h2 className="font-display text-2xl font-normal tracking-[-0.02em]">{title}</h2>
        <div className="text-[13px] text-ink-2">{sub}</div>
      </div>
      {children}
    </section>
  );
}

// The fields below are shared by the new-case wizard (values from the wizard store) and the edit
// form on the Overview tab (values from the form's own state), so both ask the same questions the
// same way.

const REGIONS: { value: CaseRegion; label: string }[] = [
  ...UK_JURISDICTIONS.map((j) => ({ value: j, label: j })),
  { value: "OUTSIDE_UK", label: "Outside the UK" },
];

export function AreaField({ value, onChange, disabled }: { value: CaseArea; onChange: (a: CaseArea) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <WizardLabel>Type of issue</WizardLabel>
      <div className="flex flex-wrap gap-1.5">
        {CASE_AREAS.map((a) => (
          <Chip key={a} selected={value === a} disabled={disabled} onClick={() => onChange(a)}>
            {AREA_LABELS[a]}
          </Chip>
        ))}
      </div>
    </div>
  );
}

export function RegionField({
  value,
  onChange,
  error,
  hint = "The law is different in each, so this decides the rules we use and, later, the right lawyer.",
  disabled,
}: {
  value: CaseRegion | "";
  onChange: (r: CaseRegion) => void;
  error?: boolean;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label="Which part of the UK?">
      <WizardLabel>Which part of the UK? *</WizardLabel>
      <div className="flex flex-wrap gap-1.5">
        {REGIONS.map((r) => (
          <Chip key={r.value} selected={value === r.value} disabled={disabled} onClick={() => onChange(r.value)}>
            {r.label}
          </Chip>
        ))}
      </div>
      <div className={cn("text-xs", error ? "text-error" : "text-muted")}>
        {error ? "Please choose where this happened." : hint}
      </div>
    </div>
  );
}

const SIDES: { value: Side; title: string; desc: string }[] = [
  { value: "CLAIMANT", title: "I'm bringing the complaint", desc: "I'm raising an issue or making a claim." },
  { value: "RESPONDENT", title: "I'm responding to one", desc: "Someone raised an issue or claim against me." },
  { value: "", title: "Not sure yet", desc: "You can set this later." },
];

export function SideField({ value, onChange }: { value: Side; onChange: (s: Side) => void }) {
  return (
    <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Which side are you on?">
      <WizardLabel>Which side are you on?</WizardLabel>
      {SIDES.map((o) => (
        <RadioCard
          key={o.title}
          selected={value === o.value}
          onSelect={() => onChange(o.value)}
          title={o.title}
          description={o.desc}
        />
      ))}
      <div className="text-xs text-muted">Answers are written from your side. You can change this later.</div>
    </div>
  );
}

export function OthersField({
  others,
  onAdd,
  onUpdate,
  onRemove,
  disabled,
}: {
  others: OtherParty[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<Pick<OtherParty, "name" | "role">>) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <WizardLabel>Other people or companies</WizardLabel>
      {others.map((o, i) => (
        <div key={o.id} className="flex flex-col gap-2.5 rounded-input border border-line bg-subtle p-[14px]">
          <div className="flex gap-2">
            <TextInput
              aria-label={`Other party ${i + 1} name`}
              value={o.name}
              disabled={disabled}
              placeholder="Full name or company"
              onChange={(e) => onUpdate(o.id, { name: e.target.value })}
            />
            <button
              type="button"
              aria-label="Remove"
              disabled={disabled}
              onClick={() => onRemove(o.id)}
              className="flex size-12 shrink-0 items-center justify-center rounded-input border border-line bg-white text-muted disabled:opacity-40"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PARTY_ROLES.map((r: PartyRole) => (
              <Chip key={r} small selected={o.role === r} disabled={disabled} onClick={() => onUpdate(o.id, { role: r })}>
                {r}
              </Chip>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        className="flex min-h-10 items-center gap-2 self-start rounded-full border border-dashed border-line-input px-4 text-[11px] font-semibold uppercase tracking-[1px] text-ink-2 disabled:opacity-40"
      >
        <Plus size={14} />
        Add person or company
      </button>
    </div>
  );
}

/** The two optional questions that go to the case's notes: what happened and what the client wants. */
export function IntakeNotesField({
  happened,
  wants,
  onChange,
}: {
  happened: string;
  wants: string;
  onChange: (patch: { happened?: string; wants?: string }) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <WizardLabel htmlFor="case-happened">What happened, and roughly when? (optional)</WizardLabel>
        <TextArea
          id="case-happened"
          rows={4}
          maxLength={NOTES_FIELD_MAX}
          value={happened}
          placeholder="e.g. My employer ended my contract by text on 3 October, with no notice."
          onChange={(e) => onChange({ happened: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <WizardLabel htmlFor="case-wants">What do you want to come of it? (optional)</WizardLabel>
        <TextArea
          id="case-wants"
          rows={3}
          maxLength={NOTES_FIELD_MAX}
          value={wants}
          placeholder="e.g. My job back, or compensation for the notice I should have had."
          onChange={(e) => onChange({ wants: e.target.value })}
        />
        <div className="text-xs text-muted">
          The more you say here, the less the AI has to ask you. You can add to this later.
        </div>
      </div>
    </div>
  );
}

export function StepDetails() {
  const { title, region, where, area, happened, wants, titleErr, regionErr, set } = useWizard();
  return (
    <Section
      numeral="I"
      title="What's your case about?"
      sub="Give it a short name you'll recognise later."
    >
      <div className="flex flex-col gap-2">
        <WizardLabel htmlFor="case-title">Case title *</WizardLabel>
        <input
          id="case-title"
          value={title}
          maxLength={150}
          placeholder="e.g. Fired without notice from my job"
          aria-invalid={titleErr}
          aria-describedby={titleErr ? "case-title-err" : undefined}
          onChange={(e) => set({ title: e.target.value })}
          className={cn(
            inputClass,
            "font-display text-[17px]",
            titleErr && "border-error-field",
          )}
        />
        <div className="flex justify-between text-xs text-muted">
          <span id="case-title-err" className="text-error">
            {titleErr ? "Please give your case a title." : ""}
          </span>
          <span>{title.length}/150</span>
        </div>
      </div>
      <AreaField value={area} onChange={(a) => set({ area: a })} />
      <RegionField value={region} onChange={(r) => set({ region: r })} error={regionErr} />
      <div className="flex flex-col gap-2">
        <WizardLabel htmlFor="case-where">Town or city</WizardLabel>
        <TextInput
          id="case-where"
          value={where}
          placeholder="e.g. Leeds"
          onChange={(e) => set({ where: e.target.value })}
        />
      </div>
      <div className="border-t border-line pt-5">
        <IntakeNotesField happened={happened} wants={wants} onChange={set} />
      </div>
    </Section>
  );
}

export function StepPeople() {
  const { side, others, set, addOther, updateOther, removeOther } = useWizard();
  return (
    <Section
      numeral="II"
      title="Who is involved?"
      sub="Tell us your side, and who else is part of this."
    >
      <SideField value={side} onChange={(s) => set({ side: s })} />
      <div className="border-t border-line pt-5">
        <OthersField others={others} onAdd={addOther} onUpdate={updateOther} onRemove={removeOther} />
      </div>
    </Section>
  );
}

export function StepDocuments() {
  const { title, side, others, files, addFiles, removeFile } = useWizard();
  const { data: limits } = useLimitsQuery();
  const [rejected, setRejected] = useState<string[]>([]);
  const named = others.map((o) => o.name.trim()).filter(Boolean);

  // Files the file dialog would have filtered out can still arrive by drag and drop.
  const add = (picked: File[]) => {
    const { accepted, rejected: turnedAway } = checkFiles(picked, limits);
    setRejected(turnedAway);
    if (accepted.length) addFiles(accepted);
  };

  return (
    <Section
      numeral="III"
      title="Add your documents"
      sub="Contracts, messages, notices, receipts. The AI reads them to answer your questions. Optional."
      gap={20}
    >
      <div className="flex flex-col gap-2 rounded-input border border-line bg-subtle px-4 py-[14px] text-[13px]">
        <div className="flex justify-between gap-3">
          <span className="text-muted">Case</span>
          <span className="text-right font-display tracking-[-0.02em]">
            {title.trim() || "Untitled"}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted">I am</span>
          <span>{sideLabel(side)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted">Others</span>
          <span className="text-right">{named.join(", ") || "None added"}</span>
        </div>
      </div>
      <FilePicker onPick={add}>
        {(open) => (
          <button
            type="button"
            onClick={open}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const dropped = Array.from(e.dataTransfer.files);
              if (dropped.length) add(dropped);
            }}
            className="flex flex-col items-center gap-2 rounded-input border border-dashed border-line-input bg-subtle px-4 py-8 text-center transition-colors hover:border-line-hover"
          >
            <UploadCloud size={26} className="text-muted" />
            <div className="font-display text-lg tracking-[-0.02em]">Add documents</div>
            <div className="text-[12.5px] text-muted">
              Tap to browse, or drag and drop. {describeLimits(limits)}. They upload once your case is created.
            </div>
          </button>
        )}
      </FilePicker>
      {rejected.length > 0 && (
        <div role="alert" className="text-[13px] text-error">
          {rejected.join(" ")}
        </div>
      )}
      {files.length > 0 && (
        <div className="flex flex-col overflow-hidden rounded-input border border-line">
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              className="flex items-center gap-3 border-b border-line px-4 py-3 text-[13px] last:border-b-0"
            >
              <FileText size={15} className="text-gold" />
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <button
                type="button"
                aria-label={`Remove ${f.name}`}
                onClick={() => removeFile(i)}
                className="flex items-center justify-center text-muted"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
