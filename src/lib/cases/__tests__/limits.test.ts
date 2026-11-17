import { describe, expect, it } from "vitest";
import { DOCUMENT_ACCEPT } from "@/components/ui/file-picker";
import { checkFiles, describeLimits, offeredExtensions, type UploadLimits } from "../limits";

const file = (name: string, size = 10) => new File([new Uint8Array(size)], name);
const api = (extensions: string[]): UploadLimits => ({ upload: { extensions, maxBytes: 1024 ** 3 } });

describe("upload file types", () => {
  it.each(["heic", "webp", "m4a", "wav"])("offers .%s in the picker", (ext) => {
    expect(DOCUMENT_ACCEPT.split(",")).toContain(`.${ext}`);
  });

  it("accepts photos and voice memos the API accepts, by picker or drop", () => {
    const limits = api(["pdf", "jpg", "png", "webp", "heic", "mp3", "mp4", "m4a", "wav"]);
    const names = ["phone-photo.heic", "screenshot.webp", "voice-memo.m4a", "recording.wav", "IMG_1.HEIC"];
    const { accepted, rejected } = checkFiles(names.map((n) => file(n)), limits);
    expect(accepted.map((f) => f.name)).toEqual(names);
    expect(rejected).toEqual([]);
  });

  it("refuses an unsupported file and lists the supported formats", () => {
    const { accepted, rejected } = checkFiles([file("setup.exe")], api(["pdf", "png", "heic"]));
    expect(accepted).toEqual([]);
    expect(rejected).toEqual(["setup.exe isn't a type we can read. We accept PDF, PNG or HEIC."]);
  });

  it("never offers a type the API no longer takes", () => {
    expect(offeredExtensions(api(["pdf"]))).toEqual(["pdf"]);
    expect(checkFiles([file("a.heic")], api(["pdf"])).rejected).toHaveLength(1);
  });

  it("names the new types in the limits line", () => {
    expect(describeLimits(api(["webp", "heic", "m4a", "wav"]))).toBe("WEBP, HEIC, M4A or WAV, up to 1 GB at a time");
  });
});
