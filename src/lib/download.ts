// Saving a file to the device from the browser: a temporary <a download> clicked for the user.

/** Saves what `href` points at. Same-origin only (a /files/<token> link or a blob: URL): a browser
 * ignores `download` across origins and opens the file instead. A Content-Disposition filename on
 * the response wins over `filename`. */
export function saveUrl(href: string, filename?: string): void {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename ?? "";
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** Saves a file already in memory. The object URL is kept a while: revoked at once, some browsers
 * cancel the save. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  saveUrl(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
