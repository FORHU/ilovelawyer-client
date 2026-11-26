import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SITES } from "../sites";

// KR clients pay the hired lawyer directly, and ilovelawyer takes no fee (ilovelawyer-api#695, #694;
// client #161, #162).
describe("paying the lawyer directly", () => {
  it("is KR only", () => {
    expect(Object.values(SITES).filter((s) => s.paysLawyerDirectly).map((s) => s.code)).toEqual(["KR"]);
  });

  it("leaves no Korean app text claiming a platform or introduction fee", () => {
    const dir = path.join(process.cwd(), "src", "locales", "ko");
    const korean = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .flatMap((f) => Object.values(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as Record<string, string>));
    for (const text of korean) {
      expect(text).not.toMatch(/플랫폼 수수료|소개 수수료|15%|£/);
    }
  });
});
