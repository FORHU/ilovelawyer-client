"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { LANG_COOKIE, SITE_LANGS, langFor, readLangCookie } from "@/lib/i18n/language";
import { localeFor, setCurrentLang, setCurrentLocale, translate, type Lang, type T } from "@/lib/i18n/translate";
import { useSite } from "./site-provider";

interface LanguageValue {
  lang: Lang;
  /** Dates and numbers: ko-KR for Korean, else the site's English (en-GB, en-PH). */
  locale: string;
  /** The languages this site offers; one entry means there's nothing to switch. */
  offered: Lang[];
  t: T;
}

const LanguageContext = createContext<LanguageValue>({ lang: "en", locale: "en-GB", offered: ["en"], t: (key, vars) => translate("en", key, vars) });

const CHANGE = "ilovelawyer:lang";

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange);
  return () => window.removeEventListener(CHANGE, onChange);
}

const readCookie = () => readLangCookie(document.cookie);

/** Switches the language on this site (KR offers Korean and English), for this browser, a year. */
export function setLanguage(lang: Lang) {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  window.dispatchEvent(new Event(CHANGE));
}

/**
 * The language this page is in: the site's own (Korean on KR, English elsewhere) or the visitor's
 * choice on a site that offers more than one. `initial` is the server's read of the cookie (see
 * ServerSite), so a server-rendered page paints in the right language; without it (the signed-in
 * app, which paints only once the browser has hydrated) the browser's cookie decides.
 */
export function LanguageProvider({ initial, children }: { initial?: string | null; children: ReactNode }) {
  const site = useSite();
  const stored = useSyncExternalStore(subscribe, readCookie, () => initial ?? null);
  const lang = langFor(site.code, stored);
  const locale = localeFor(lang, site.locale);

  // Code outside React (formatters, labels) reads these; they're only right in the browser.
  if (typeof window !== "undefined") {
    setCurrentLang(lang);
    setCurrentLocale(locale);
  }
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<LanguageValue>(
    () => ({ lang, locale, offered: SITE_LANGS[site.code], t: (key, vars) => translate(lang, key, vars) }),
    [lang, locale, site.code],
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageValue {
  return useContext(LanguageContext);
}

/** The translator for this page's language: t("Start your case"). See lib/i18n/translate.ts. */
export function useT(): T {
  return useContext(LanguageContext).t;
}
