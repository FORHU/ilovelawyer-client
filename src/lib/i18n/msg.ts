/** Marks a string as a translation key where it's defined, for one that's translated later, where
 * it's shown (a nav label kept in a list, then t(item.label)). Returns it unchanged; the catalog
 * test (lib/i18n/__tests__/catalog.test.ts) finds keys by these calls as well as by t() and tr(). */
export const msg = (key: string): string => key;
