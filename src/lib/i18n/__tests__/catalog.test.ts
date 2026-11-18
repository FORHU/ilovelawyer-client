import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { KO, KO_FILES } from "@/locales/ko";
import { translate } from "../translate";

// Every key the source passes to t(), tr() or msg(), as a double-quoted string literal.
const SRC = path.resolve(import.meta.dirname, "../../..");
const CALL = /\b(?:t|tr|msg)\(\s*"((?:[^"\\]|\\.)*)"/g;

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "__tests__" ? [] : sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

function usedKeys(): Map<string, string> {
  const keys = new Map<string, string>();
  for (const file of sourceFiles(SRC)) {
    // Comments can show a call as an example; only code counts.
    const text = fs.readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    for (const match of text.matchAll(CALL)) keys.set(JSON.parse(`"${match[1]}"`), path.relative(SRC, file));
  }
  return keys;
}

describe("Korean catalog", () => {
  const used = usedKeys();

  it("has Korean for every key the app shows", () => {
    const missing = [...used].filter(([key]) => !(key in KO)).map(([key, file]) => `${file}: ${key}`);
    expect(missing).toEqual([]);
  });

  it("keeps no Korean that nothing shows", () => {
    expect(Object.keys(KO).filter((key) => !used.has(key))).toEqual([]);
  });

  it("defines each key in one file only", () => {
    const seen = new Map<string, string>();
    const twice: string[] = [];
    for (const [file, entries] of Object.entries(KO_FILES)) {
      for (const key of Object.keys(entries)) {
        if (seen.has(key)) twice.push(`${key} (${seen.get(key)}, ${file})`);
        seen.set(key, file);
      }
    }
    expect(twice).toEqual([]);
  });

  it("keeps every {placeholder} of the English in the Korean", () => {
    // The same names, each at least once: Korean may say one fewer times what English repeats.
    const names = (s: string) => [...new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort();
    const broken = Object.entries(KO).filter(([en, ko]) => names(en).join() !== names(ko).join()).map(([en]) => en);
    expect(broken).toEqual([]);
  });

  it("fills placeholders and falls back to English", () => {
    expect(translate("en", "Hello, {name}", { name: "Ji-woo" })).toBe("Hello, Ji-woo");
    expect(translate("ko", "a key with no Korean")).toBe("a key with no Korean");
  });
});
