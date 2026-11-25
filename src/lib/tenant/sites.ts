import { lawyerAppUrl, type TenantCode } from "./client-tenant";
import { msg } from "@/lib/i18n/msg";

/**
 * What one site of the client app offers and how it speaks. The client counterpart of
 * ilovelawyer-app's config/tenant-codes/*.ts. The API enforces the same limits (its
 * CLIENT_REQUESTS_OPEN_TENANTS and INTAKE_CHAT_OPEN_TENANTS), so hiding something here is never the
 * only guard.
 */
export interface SiteConfig {
  code: TenantCode;
  /** The country, as a sentence uses it: "the UK", "the Philippines", "Korea". */
  country: string;
  /** Formats dates and numbers. */
  locale: string;
  /** Finding a lawyer, quotes and hiring. "coming-soon" until lawyers on the site can take requests. */
  clientRequests: "open" | "coming-soon";
  /** The AI intake chat. "coming-soon" until the site has its own intake persona: the UK one must
   * never answer a client of another country. */
  intakeChat: "open" | "coming-soon";
  /** Ask which part of the UK a case is in (England and Wales, Scotland, Northern Ireland). */
  regionQuestion: boolean;
  /** The client pays the hired lawyer directly, and ilovelawyer takes no fee (ilovelawyer-api#695,
   * #694). The API's `paysLawyerDirectly` on a request says the same; this is for screens with no
   * request, like Find a lawyer. */
  paysLawyerDirectly: boolean;
  /** The lawyer app on this site, for a lawyer account that signed in here. */
  lawyerAppUrl: string;
  seo: { title: string; description: string };
}

export const SITES: Record<TenantCode, SiteConfig> = {
  UK: {
    code: "UK",
    country: msg("the UK"),
    locale: "en-GB",
    clientRequests: "open",
    intakeChat: "open",
    regionQuestion: true,
    paysLawyerDirectly: false,
    lawyerAppUrl: lawyerAppUrl("UK"),
    seo: {
      title: "ilovelawyer",
      description: "Free cases, pay only for the chat credits you use. Chat with the AI, bring in a lawyer when it matters.",
    },
  },
  PH: {
    code: "PH",
    country: msg("the Philippines"),
    locale: "en-PH",
    clientRequests: "coming-soon",
    intakeChat: "coming-soon",
    regionQuestion: false,
    paysLawyerDirectly: false,
    lawyerAppUrl: lawyerAppUrl("PH"),
    seo: {
      title: "ilovelawyer Philippines",
      description: "Keep your legal problem and its documents in one place. Lawyers in the Philippines are coming soon.",
    },
  },
  KR: {
    code: "KR",
    country: msg("Korea"),
    locale: "ko-KR",
    // KR clients ask KR lawyers, quoted and paid in won.
    clientRequests: "open",
    // Chat Wonder's Korean intake persona (intake_kr).
    intakeChat: "open",
    regionQuestion: false,
    // KR clients pay the lawyer directly: no payment or fee through ilovelawyer.
    paysLawyerDirectly: true,
    lawyerAppUrl: lawyerAppUrl("KR"),
    seo: {
      title: "ilovelawyer Korea",
      description: "Understand your legal problem, then find a verified lawyer in Korea.",
    },
  },
};
