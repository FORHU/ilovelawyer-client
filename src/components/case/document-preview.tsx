"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ExternalLink, FileText, Loader2 } from "lucide-react";
import { fixTransparentCellColors, previewKind } from "@/lib/documents/preview-kind";

/** Rules that keep docx-preview's pages inside the frame (its own stylesheet sizes them from the
 * source paper size, which overflows a narrow panel with no scrollbar). */
const DOCX_FIT_CSS = `
  .docx-wrapper { width: 100% !important; background: transparent !important; padding: 0 !important; }
  .docx-wrapper > section.docx { width: 100% !important; box-shadow: none !important; margin-bottom: 16px !important; }
  .docx-wrapper * { max-width: 100% !important; box-sizing: border-box !important; }
  .docx-wrapper img { height: auto !important; }
`;

function Loading() {
  return (
    <div role="status" className="flex h-full items-center justify-center gap-2 text-[13px] text-ink-2">
      <Loader2 size={16} className="animate-spin" aria-hidden />
      Loading preview…
    </div>
  );
}

function Fallback({ name, url, failed }: { name: string; url: string; failed: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <FileText size={40} className="text-ink-2" aria-hidden />
      <p className="text-[13px] text-ink-2">
        {failed ? "We couldn't show this file here." : "This kind of file can't be shown here."}
      </p>
      <a href={url} download={name} className="inline-flex items-center gap-1.5 text-[13px] font-medium">
        <Download size={14} aria-hidden />
        Download
      </a>
    </div>
  );
}

/** The file itself, drawn in the page. PDFs and images use the browser's own viewer; .docx, .xlsx
 * and .txt are fetched and drawn here (the file is a same-origin /files/<token> link, so it never
 * goes to a third-party viewer). Fills its parent's height. */
export function DocumentPreview({ name, url }: { name: string; url: string }) {
  const kind = previewKind(name);
  const needsFetch = kind === "docx" || kind === "xlsx" || kind === "text";
  const [loading, setLoading] = useState(needsFetch);
  const [failed, setFailed] = useState(false);
  const [sheets, setSheets] = useState<string[]>([]);
  const [sheet, setSheet] = useState(0);
  const [text, setText] = useState("");
  const docx = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!needsFetch) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        if (kind === "text") {
          const body = await res.text();
          if (!cancelled) setText(body);
          return;
        }
        const blob = await res.blob();
        if (cancelled) return;
        if (kind === "docx") {
          const { renderAsync } = await import("docx-preview");
          const container = docx.current;
          if (!container || cancelled) return;
          container.innerHTML = "";
          await renderAsync(blob, container, undefined, { ignoreWidth: true, ignoreHeight: true });
          const style = document.createElement("style");
          style.textContent = DOCX_FIT_CSS;
          container.appendChild(style);
        } else {
          const { default: xlsxPreview } = await import("xlsx-preview");
          // separateSheets gives one plain HTML table per sheet, without the library's fixed-position
          // tab bar and inline script, neither of which works when embedded in a page.
          const html = (await xlsxPreview.xlsx2Html(blob, { minimumRows: 1, minimumCols: 1, separateSheets: true })) as string[];
          if (!cancelled) setSheets(html.map(fixTransparentCellColors));
        }
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind, needsFetch, url]);

  if (kind === "none" || failed) return <Fallback name={name} url={url} failed={failed} />;

  if (kind === "pdf") {
    // FitH: the page starts scaled to the frame width and only needs vertical scroll.
    return <iframe src={`${url}#view=FitH`} title={name} className="h-full w-full border-0" />;
  }

  if (kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a private, token-proxied file that Next's image optimizer can't fetch
      <img src={url} alt={name} className="mx-auto h-full max-w-full object-contain p-4" />
    );
  }

  if (kind === "docx") {
    return (
      <div className="h-full overflow-y-auto overscroll-contain bg-white p-4 text-black md:p-8">
        {loading && <Loading />}
        <div ref={docx} className={loading ? "hidden" : "mx-auto max-w-3xl"} />
      </div>
    );
  }

  if (loading) return <Loading />;

  if (kind === "xlsx") {
    return (
      <div className="flex h-full flex-col bg-white text-black">
        {sheets.length > 1 && (
          <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-line px-2 pt-2">
            {sheets.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSheet(i)}
                aria-pressed={i === sheet}
                data-no-tap
                className={`shrink-0 rounded-t-md px-3 py-1.5 text-xs font-medium ${i === sheet ? "bg-chip text-ink" : "text-ink-2 hover:bg-subtle"}`}
              >
                Sheet {i + 1}
              </button>
            ))}
          </div>
        )}
        {/* The workbook's own cells as an HTML table: the client's own file, so the same trust as the file. */}
        <div className="min-h-0 flex-1 overflow-auto overscroll-contain p-4 md:p-8" dangerouslySetInnerHTML={{ __html: sheets[sheet] ?? "" }} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto overscroll-contain bg-white p-4 md:p-8">
      <p className="mx-auto max-w-3xl whitespace-pre-wrap break-words text-[13px] text-ink">{text}</p>
    </div>
  );
}

export function OpenInNewTab({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open in a new tab"
      title="Open in a new tab"
      className="flex size-9 items-center justify-center rounded-full text-ink-2 hover:bg-chip hover:text-ink"
    >
      <ExternalLink size={16} aria-hidden />
    </a>
  );
}
