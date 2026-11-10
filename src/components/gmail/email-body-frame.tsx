"use client";

/** Locks the email down inside its frame: no scripts, no remote images (tracking pixels), no
 * fonts or styles fetched from elsewhere. Inline styles and embedded data: images still show. */
const CSP = "default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:";

function documentFor(html: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${CSP}"><base target="_blank"><style>html,body{margin:0;padding:0;font:14px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif;color:#1a1a1a;background:#fff;word-wrap:break-word}body{padding:16px}img{max-width:100%;height:auto}table{max-width:100%}pre{white-space:pre-wrap}</style></head><body>${html}</body></html>`;
}

/**
 * An email's body as it was sent. HTML renders in a sandboxed frame with no permissions except
 * opening links in a new tab (no scripts, forms, same-origin or top navigation), plus a CSP that
 * blocks every remote load, so a hostile email can't run code or tell its sender it was opened.
 * Without same-origin the frame can't be measured, so it has a fixed height and scrolls inside.
 * Plain text falls back to a <pre>.
 */
export function EmailBodyFrame({ html, text }: { html: string | null; text: string | null }) {
  if (!html) {
    return (
      <pre className="whitespace-pre-wrap break-words rounded-input border border-line bg-white px-4 py-3.5 font-sans text-[14px] leading-[1.6] text-ink">
        {text?.trim() || "This email has no text."}
      </pre>
    );
  }

  return (
    <iframe
      title="Email body"
      sandbox="allow-popups allow-popups-to-escape-sandbox"
      srcDoc={documentFor(html)}
      referrerPolicy="no-referrer"
      className="h-[420px] w-full rounded-input border border-line bg-white"
    />
  );
}
