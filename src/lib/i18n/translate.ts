import { KO } from "@/locales/ko";

/**
 * The client app's translations. The English text is the key: `t("Start your case")` shows it as
 * written in English and looks it up in src/locales/ko for Korean. A Korean string missing from
 * the catalog falls back to the English, and lib/i18n/__tests__/catalog.test.ts fails the build
 * when any `t("…")` in the source has no Korean (or the catalog keeps one nothing uses).
 *
 * Why not i18next, as ilovelawyer-app has: i18next holds one language for the whole process, and
 * this app renders pages on the server for every site at once (a KR page and a UK one in the same
 * moment), so the language has to travel with each render instead. React components get it from
 * LanguageProvider (useT); code outside React reads the browser's current one (tr), which is only
 * right in the browser.
 *
 * `{name}` in a key is filled from `vars`: t("Hello, {name}", { name }). Pass the whole sentence,
 * never pieces of one, so Korean can put the words in its own order. For a count, pick the English
 * key in code (count === 1 ? t("{n} document", { n }) : t("{n} documents", { n })); Korean maps
 * both to the same text.
 */
export type Lang = "en" | "ko";

export const LANG_LABELS: Record<Lang, string> = { en: "English", ko: "한국어" };

export type Vars = Record<string, string | number>;

function fill(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
}

export function translate(lang: Lang, key: string, vars?: Vars): string {
  const text = lang === "ko" ? (KO[key] ?? key) : key;
  return fill(text, vars);
}

export type T = (key: string, vars?: Vars) => string;

// The browser's language, for code outside React (formatters, labels). LanguageProvider keeps it
// current; on the server it stays English, so server-rendered pages use useT instead.
let current: Lang = "en";

export function setCurrentLang(lang: Lang) {
  current = lang;
}

export function currentLang(): Lang {
  return current;
}

/** t() outside React: the browser's current language. */
export function tr(key: string, vars?: Vars): string {
  return translate(current, key, vars);
}

/** The locale dates and numbers are written in: Korean's own, or the site's English (en-GB on UK,
 * en-PH on PH; lib/tenant/sites.ts). */
export function localeFor(lang: Lang, siteLocale: string): string {
  if (lang === "ko") return "ko-KR";
  return siteLocale.startsWith("en") ? siteLocale : "en-GB";
}

let currentLocaleValue = "en-GB";

export function setCurrentLocale(locale: string) {
  currentLocaleValue = locale;
}

export function currentLocale(): string {
  return currentLocaleValue;
}
