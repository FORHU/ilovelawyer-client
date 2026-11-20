import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { lawyerRequestKeys, seedOpenRequest, type LawyerRequest } from "../api";

const request = (status: LawyerRequest["status"]) =>
  ({ id: "r1", caseId: "c1", status, requestedLawyer: { id: "l1", name: "Jane Smith" }, requestedOnly: true }) as unknown as LawyerRequest;

describe("seedOpenRequest", () => {
  it("makes a request just sent the case's open one, before any refetch", () => {
    const queryClient = new QueryClient();
    const sent = request("REQUESTED");
    seedOpenRequest(queryClient, "u1", "c1", sent);
    expect(queryClient.getQueryData(lawyerRequestKeys.open("u1", "c1"))).toBe(sent);
  });

  it("leaves the cache alone for a request that isn't open", () => {
    const queryClient = new QueryClient();
    seedOpenRequest(queryClient, "u1", "c1", request("WITHDRAWN"));
    expect(queryClient.getQueryData(lawyerRequestKeys.open("u1", "c1"))).toBeUndefined();
  });
});
