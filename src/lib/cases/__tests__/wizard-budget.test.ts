import { describe, it, expect, beforeEach } from "vitest";
import { useWizard } from "../../wizard-store";

// Review finding 2 (client #68): an own amount that isn't one can't be left behind through the step
// list, or sent by Create case.
describe("wizard: the Budget step's own amount", () => {
  const BUDGET_STEP = 3;
  beforeEach(() => {
    useWizard.getState().reset();
    useWizard.setState({ step: BUDGET_STEP, maxStep: 4, budget: { choice: "OWN", own: "lots", fee: "" } });
  });

  it("stays on Budget, showing the error, when the step list is used to leave it", () => {
    useWizard.getState().goTo(4);
    expect(useWizard.getState()).toMatchObject({ step: BUDGET_STEP, budgetErr: true });
  });

  it("holds them on Budget going back too, until the amount is fixed or cleared", () => {
    useWizard.getState().goTo(1);
    expect(useWizard.getState().step).toBe(BUDGET_STEP);
  });

  it("sends Create case back to Budget if the amount was changed and left", () => {
    useWizard.setState({ step: 4 });
    expect(useWizard.getState().next()).toBe(false);
    expect(useWizard.getState()).toMatchObject({ step: BUDGET_STEP, budgetErr: true });
  });

  it("moves on once the amount is one", () => {
    useWizard.setState({ budget: { choice: "OWN", own: "1,200", fee: "" } });
    useWizard.getState().goTo(4);
    expect(useWizard.getState().step).toBe(4);
  });
});
