"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Locks the email down inside its frame: no scripts, no remote images (tracking pixels), no
 * fonts or styles fetched from elsewhere. Inline styles and embedded data: images still show; the
 * API embeds the email's own inline pictures (cid:) as data: images. */
const CSP = "default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:";

/** The same, plus images from the web, once the client asks to see them for this email. Still no
 * scripts, remote styles or fonts. */
const CSP_WITH_REMOTE_IMAGES = "default-src 'none'; img-src data: https: http:; style-src 'unsafe-inline'; font-src data:";

/** An image the email would load from the web: an <img>/srcset/background attribute or a CSS
 * url() pointing at http(s) or a protocol-relative address. */
const REMOTE_IMAGE = /(?:\bsrc|\bsrcset|\bbackground)\s*=\s*["']?\s*(?:https?:)?\/\/|url\(\s*["']?\s*(?:https?:)?\/\//i;

export function hasRemoteImages(html: string): boolean {
  return REMOTE_IMAGE.test(html);
}

function documentFor(html: string, csp: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><meta name="referrer" content="no-referrer"><base target="_blank"><style>html,body{margin:0;padding:0;font:14px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif;color:#1a1a1a;background:#fff;word-wrap:break-word}body{padding:16px}img{max-width:100%;height:auto}table{max-width:100%}pre{white-space:pre-wrap}</style></head><body>${html}</body></html>`;
}

/**
 * An email's body as it was sent. HTML renders in a sandboxed frame with no permissions except
 * opening links in a new tab (no scripts, forms, same-origin or top navigation), plus a CSP that
 * blocks every remote load, so a hostile email can't run code or tell its sender it was opened.
 * When the email has images from the web, a bar offers to show them for this email only (like
 * Gmail's "Display images below"); loading them does tell the sender it was opened. Mount with a
 * `key` per message so that choice never carries over to the next email.
 * Without same-origin the frame can't be measured, so it has a fixed height and scrolls inside.
 * Plain text falls back to a <pre>.
 */
export function EmailBodyFrame({ html, text }: { html: string | null; text: string | null }) {
  const [showRemoteImages, setShowRemoteImages] = useState(false);

  if (!html) {
    return (
      <pre className="whitespace-pre-wrap break-words rounded-input border border-line bg-white px-4 py-3.5 font-sans text-[14px] leading-[1.6] text-ink">
        {text?.trim() || "This email has no text."}
      </pre>
    );
  }

  const remote = hasRemoteImages(html);

  return (
    <div className="flex flex-col gap-2">
      {remote && !showRemoteImages && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-input border border-line bg-subtle px-4 py-2.5">
          <ImageOff size={14} aria-hidden className="shrink-0 text-ink-2" />
          <p className="min-w-0 flex-1 text-[12.5px] leading-[1.5] text-ink-2">
            Images from the web are hidden to protect your privacy. Showing them lets the sender know you opened this email.
          </p>
          <Button variant="soft" size="sm" onClick={() => setShowRemoteImages(true)} className="!h-[32px] !px-3.5">
            Show images
          </Button>
        </div>
      )}
      <iframe
        // A new key makes the browser load a fresh frame with the new CSP instead of patching it.
        key={showRemoteImages ? "with-images" : "locked"}
        title="Email body"
        sandbox="allow-popups allow-popups-to-escape-sandbox"
        srcDoc={documentFor(html, showRemoteImages ? CSP_WITH_REMOTE_IMAGES : CSP)}
        referrerPolicy="no-referrer"
        className="h-[420px] w-full rounded-input border border-line bg-white"
      />
    </div>
  );
}
