import { beforeEach, describe, expect, it } from "vitest";
import { clearSearchText, readSearchText, saveSearchText } from "../search-prefill";

function fakeStore() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

describe("search prefill", () => {
  let store: ReturnType<typeof fakeStore>;
  beforeEach(() => {
    store = fakeStore();
  });

  it("keeps the text, trimmed, until it is cleared", () => {
    saveSearchText("  my landlord kept my deposit ", store);
    expect(readSearchText(store)).toBe("my landlord kept my deposit");
    expect(readSearchText(store)).toBe("my landlord kept my deposit");
    clearSearchText(store);
    expect(readSearchText(store)).toBeNull();
  });

  it("treats a blank search as clearing an earlier one", () => {
    saveSearchText("an earlier search", store);
    saveSearchText("   ", store);
    expect(readSearchText(store)).toBeNull();
  });

  it("limits what it keeps", () => {
    saveSearchText("x".repeat(5000), store);
    expect(readSearchText(store)).toHaveLength(2000);
  });

  it("does nothing, without throwing, where storage is missing", () => {
    expect(() => saveSearchText("text", null)).not.toThrow();
    expect(readSearchText(null)).toBeNull();
    expect(() => clearSearchText(null)).not.toThrow();
  });

  it("survives a browser that blocks storage", () => {
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(() => saveSearchText("text", blocked)).not.toThrow();
    expect(readSearchText(blocked)).toBeNull();
    expect(() => clearSearchText(blocked)).not.toThrow();
  });
});
