"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { inputClass, TextInput, WizardLabel } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { AreaField, BudgetField, IntakeNotesField, OthersField, RegionField, SideField } from "@/components/wizard/steps";
import { budgetFromDraft, draftFromBudget, ownAmountError, type BudgetDraft } from "@/lib/cases/budget";
import { composeNotes, parseNotes } from "@/lib/cases/notes";
import { useUpdateCaseMutation } from "@/lib/cases/queries";
import { useOpenLawyerRequestQuery } from "@/lib/lawyer-requests/api";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/cn";
import type { Case, CaseRegion, OtherParty, Side } from "@/lib/types";

/** Once a lawyer holds the request their conflict check and quote rest on these, so the API fixes
 * the type of issue, the part of the UK and the people (409 CASE_LOCKED_BY_REQUEST). */
const LAWYER_HOLDS = ["CLAIMED", "QUOTED", "CONFIRMED", "ENGAGED"];

let nextId = 0;
const newId = () => `edit-${Date.now()}-${nextId++}`;

/** The case's details, editable. Mounted only while open, so it starts from the case as it is. */
export function EditCaseModal({ c, onClose }: { c: Case; onClose: () => void }) {
  const update = useUpdateCaseMutation(c.id);
  const { data: openRequest } = useOpenLawyerRequestQuery(c.id);
  const locked = !!openRequest && LAWYER_HOLDS.includes(openRequest.status);
  const notes = parseNotes(c.notes);

  const [title, setTitle] = useState(c.title);
  const [areas, setAreas] = useState<string[]>(c.areas.map((a) => a.code));
  const [region, setRegion] = useState<CaseRegion>(c.ukJurisdiction ?? "OUTSIDE_UK");
  const [where, setWhere] = useState(c.where);
  const [side, setSide] = useState<Side>(c.side ?? "");
  const [others, setOthers] = useState<OtherParty[]>(c.others);
  const [happened, setHappened] = useState(notes.happened);
  const [wants, setWants] = useState(notes.wants);
  const [budget, setBudget] = useState<BudgetDraft>(() => draftFromBudget(c.budget));
  const [titleErr, setTitleErr] = useState(false);
  const [areasErr, setAreasErr] = useState(false);
  const [budgetErr, setBudgetErr] = useState(false);
  const [error, setError] = useState("");

  const save = () => {
    if (!title.trim() || areas.length === 0 || ownAmountError(budget)) {
      setTitleErr(!title.trim());
      setAreasErr(areas.length === 0);
      setBudgetErr(!!ownAmountError(budget));
      return;
    }
    setError("");
    update.mutate(
      {
        title: title.trim(),
        areas,
        ukJurisdiction: region === "OUTSIDE_UK" ? null : region,
        where: where.trim(),
        side: side || null,
        others: others.filter((o) => o.name.trim()).map(({ name, role }) => ({ name: name.trim(), role })),
        notes: composeNotes({ happened, wants }),
        budget: budgetFromDraft(budget),
      },
      {
        onSuccess: () => {
          useApp.getState().setBanner("Case details saved.");
          onClose();
        },
        onError: (err) => setError(err instanceof Error ? err.message : "Couldn't save your changes. Try again."),
      },
    );
  };

  return (
    <Modal open onClose={onClose} locked={update.isPending} title="Edit case details" subtitle="Changes apply to what the AI and any lawyer see from now on.">
      {locked && (
        <div className="rounded-input border border-line bg-subtle px-4 py-3 text-[13px] leading-[1.5] text-ink-2">
          A lawyer is working on your request, so the type of issue, the part of the UK and the people involved can&apos;t change now.
        </div>
      )}
      <div className="flex flex-col gap-2">
        <WizardLabel htmlFor="edit-title">Case title *</WizardLabel>
        <input
          id="edit-title"
          value={title}
          maxLength={150}
          aria-invalid={titleErr}
          onChange={(e) => {
            setTitle(e.target.value);
            setTitleErr(false);
          }}
          className={cn(inputClass, "font-display text-[17px]", titleErr && "border-error-field")}
        />
        {titleErr && <div className="text-xs text-error">Please give your case a title.</div>}
      </div>
      <AreaField
        value={areas}
        onChange={(codes) => {
          setAreas(codes);
          setAreasErr(false);
        }}
        held={c.areas}
        error={areasErr}
        disabled={locked}
      />
      <RegionField
        value={region}
        onChange={setRegion}
        disabled={locked}
        hint="A case can't move outside the UK while a lawyer request is open."
      />
      <div className="flex flex-col gap-2">
        <WizardLabel htmlFor="edit-where">Town or city</WizardLabel>
        <TextInput id="edit-where" value={where} placeholder="e.g. Leeds" onChange={(e) => setWhere(e.target.value)} />
      </div>
      <SideField value={side} onChange={setSide} />
      <OthersField
        others={others}
        disabled={locked}
        onAdd={() => setOthers((o) => [...o, { id: newId(), name: "", role: "Opposing party" }])}
        onUpdate={(id, patch) => setOthers((o) => o.map((p) => (p.id === id ? { ...p, ...patch } : p)))}
        onRemove={(id) => setOthers((o) => o.filter((p) => p.id !== id))}
      />
      <IntakeNotesField
        happened={happened}
        wants={wants}
        onChange={(p) => {
          if (p.happened !== undefined) setHappened(p.happened);
          if (p.wants !== undefined) setWants(p.wants);
        }}
      />
      {/* Not fixed by a lawyer's hold: the client can change it until they hire. */}
      <BudgetField
        value={budget}
        onChange={(p) => {
          setBudget((b) => ({ ...b, ...p }));
          setBudgetErr(false);
        }}
        error={budgetErr}
      />
      {error && <ErrorBox message={error} />}
      <div className="flex justify-end gap-2.5">
        <Button variant="outline" onClick={onClose} disabled={update.isPending}>
          Cancel
        </Button>
        <Button onClick={save} disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </Modal>
  );
}
