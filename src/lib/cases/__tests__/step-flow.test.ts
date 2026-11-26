import { describe, expect, it } from "vitest";
import { skipHrefOf, stepFlowLinks } from "../step-flow";

describe("stepFlowLinks", () => {
  it("keeps the onboarding's steps on its own pages, and the app's on the app's", () => {
    const onboarding = stepFlowLinks("onboarding");
    expect(onboarding.onboarding).toBe(true);
    expect(onboarding.questionsHref("c1")).toBe("/start/case/c1/questions");
    expect(onboarding.evidenceHref("c1")).toBe("/start/case/c1/evidence");

    const app = stepFlowLinks("app");
    expect(app.onboarding).toBe(false);
    expect(app.questionsHref("c1")).toBe("/cases/c1/questions");
    expect(app.evidenceHref("c1")).toBe("/cases/c1/evidence");
  });

  it("leaves either flow for the case in the app", () => {
    expect(stepFlowLinks("onboarding").caseHref("c1")).toBe("/cases/c1");
    expect(stepFlowLinks("app").caseHref("c1")).toBe("/cases/c1");
  });
});

describe("skipHrefOf", () => {
  it("skips the onboarding's questions or evidence for the case, which is made already", () => {
    expect(skipHrefOf("/start/case/abc-123/questions")).toBe("/cases/abc-123");
    expect(skipHrefOf("/start/case/abc-123/evidence")).toBe("/cases/abc-123");
  });

  it("skips the onboarding's story for the cases, since nothing is made yet", () => {
    expect(skipHrefOf("/start/case")).toBe("/cases");
  });
});
