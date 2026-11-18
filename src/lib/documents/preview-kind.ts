export type PreviewKind = "pdf" | "image" | "audio" | "video" | "docx" | "xlsx" | "text" | "none";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
const AUDIO_EXTENSIONS = ["mp3", "m4a", "wav"];

/** How the document viewer shows a file, from its extension (the API doesn't send a mime type).
 * Anything it can't draw in the page (legacy .doc, .xls) is "none" and gets a Download link. */
export function previewKind(name: string): PreviewKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (IMAGE_EXTENSIONS.includes(ext)) return "image";
  if (AUDIO_EXTENSIONS.includes(ext)) return "audio";
  if (ext === "mp4") return "video";
  if (ext === "docx") return "docx";
  if (ext === "xlsx" || ext === "xlsm") return "xlsx";
  if (ext === "txt") return "text";
  return "none";
}

/** xlsx-preview paints every cell's colour with the alpha byte the workbook stored, and many
 * writers store 00 for ordinary colours, which makes them invisible. Makes those opaque. */
export function fixTransparentCellColors(html: string): string {
  return html.replace(/rgba\((\d+,\s*\d+,\s*\d+),\s*0\)/g, "rgba($1,1)");
}
