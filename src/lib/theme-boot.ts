// Shared by lib/theme.ts and the server-rendered root layout, so it holds no client code.

export const THEME_STORAGE_KEY = "ilovelawyer:theme";
export const DARK_QUERY = "(prefers-color-scheme: dark)";

/** Run by app/layout.tsx before the page hydrates: sets <html data-theme> to "light" or "dark" from
 * the stored choice (or the device, on "system"), so a page doesn't paint in the wrong one first. */
export const THEME_BOOT_SCRIPT = `(function(){try{var c=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})||"system";var d=c==="dark"||(c==="system"&&matchMedia(${JSON.stringify(DARK_QUERY)}).matches);document.documentElement.dataset.theme=d?"dark":"light";}catch(e){}})();`;
