export type DeviceClass = "mobile" | "desktop";

/** Tailwind's `md` is 768px: below it the app is the phone layout. */
export const MOBILE_QUERY = "(max-width: 767px)";

const PHONE_UA = /iPhone|iPod|Windows Phone|BlackBerry|webOS|Opera Mini|IEMobile|Android.+Mobile|Mobile.+Firefox/i;

/** What the server can tell about the device before any JS runs. Phones are `mobile`; tablets
 * (iPad, Android without "Mobile") and everything else are `desktop`. `chMobile` is the
 * `Sec-CH-UA-Mobile` header when the browser sends it, and wins over the UA string. */
export function deviceFromUserAgent(ua: string | null | undefined, chMobile?: string | null): DeviceClass {
  if (chMobile === "?1") return "mobile";
  if (chMobile === "?0") return "desktop";
  return ua && PHONE_UA.test(ua) ? "mobile" : "desktop";
}
