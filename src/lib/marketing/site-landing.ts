import type { TenantCode } from "@/lib/tenant/client-tenant";
import type { Lang } from "@/lib/i18n/translate";

/**
 * The landing page of a site whose lawyers and AI chat aren't open yet (PH, KR; see
 * lib/tenant/sites.ts). The UK site's landing (components/landing/story.tsx and the rest) promises a
 * verified UK solicitor, so these sites get their own, which says only what works there today.
 * DRAFT: needs the same legal review as the UK copy (lib/marketing/copy.ts). One copy per language
 * the site offers (lib/i18n/language.ts): KR in Korean and English.
 */
export interface SiteLandingCopy {
  lang: string;
  eyebrow: string;
  headline: [string, string];
  sub: string;
  start: string;
  signIn: string;
  features: { title: string; body: string; soon?: boolean }[];
  soon: string;
  disclaimer: string;
  legal: { label: string; terms: string; privacy: string; refunds: string };
  seo: { title: string; description: string };
}

const COPY: Partial<Record<TenantCode, Partial<Record<Lang, SiteLandingCopy>>>> = {
  PH: { en: {
    lang: "en-PH",
    eyebrow: "ilovelawyer Philippines",
    headline: ["Legal trouble,", "made clear."],
    sub: "Write down what's happening and keep your documents together, in one place. Lawyers in the Philippines are coming soon.",
    start: "Start your case",
    signIn: "Sign in",
    features: [
      { title: "Your case, in order", body: "Keep the people involved, the dates and your own notes together, one case for each problem." },
      { title: "Your documents, kept safe", body: "Add contracts, letters and photos to your case, and find them again when you need them." },
      { title: "AI help and lawyers", body: "An AI that knows Philippine law, and verified lawyers in the Philippines to help with your case.", soon: true },
    ],
    soon: "Coming soon",
    disclaimer: "ilovelawyer is not a law firm and does not give legal advice.",
    legal: { label: "Legal", terms: "Terms", privacy: "Privacy", refunds: "Refunds" },
    seo: {
      title: "ilovelawyer Philippines: legal trouble, made clear",
      description: "Keep your legal problem and its documents in one place. Lawyers in the Philippines are coming soon.",
    },
  } },
  KR: { ko: {
    lang: "ko",
    eyebrow: "ilovelawyer 한국",
    headline: ["법률 문제,", "명확하게."],
    sub: "무슨 일이 있었는지 정리하고 관련 서류를 한곳에 모아 두세요. 한국 변호사 연결은 곧 제공됩니다.",
    start: "사건 시작하기",
    signIn: "로그인",
    features: [
      { title: "사건을 한눈에", body: "관련된 사람, 날짜, 메모를 문제마다 하나의 사건으로 정리합니다." },
      { title: "서류를 안전하게", body: "계약서, 편지, 사진을 사건에 올려 두고 필요할 때 다시 찾을 수 있습니다." },
      { title: "AI 상담과 변호사 연결", body: "한국 법을 아는 AI와 검증된 한국 변호사가 사건을 도와드릴 예정입니다.", soon: true },
    ],
    soon: "곧 제공",
    disclaimer: "ilovelawyer는 법률사무소가 아니며 법률 자문을 제공하지 않습니다.",
    legal: { label: "법적 고지", terms: "이용약관", privacy: "개인정보처리방침", refunds: "환불 정책" },
    seo: {
      title: "ilovelawyer 한국: 법률 문제, 명확하게",
      description: "법률 문제와 관련 서류를 한곳에 정리하세요. 한국 변호사 연결은 곧 제공됩니다.",
    },
  },
    en: {
      lang: "en",
      eyebrow: "ilovelawyer Korea",
      headline: ["Legal trouble,", "made clear."],
      sub: "Write down what's happening and keep your documents together, in one place. Lawyers in Korea are coming soon.",
      start: "Start your case",
      signIn: "Sign in",
      features: [
        { title: "Your case, in order", body: "Keep the people involved, the dates and your own notes together, one case for each problem." },
        { title: "Your documents, kept safe", body: "Add contracts, letters and photos to your case, and find them again when you need them." },
        { title: "AI help and lawyers", body: "An AI that knows Korean law, and verified lawyers in Korea to help with your case.", soon: true },
      ],
      soon: "Coming soon",
      disclaimer: "ilovelawyer is not a law firm and does not give legal advice.",
      legal: { label: "Legal", terms: "Terms", privacy: "Privacy", refunds: "Refunds" },
      seo: {
        title: "ilovelawyer Korea: legal trouble, made clear",
        description: "Keep your legal problem and its documents in one place. Lawyers in Korea are coming soon.",
      },
    },
  },
};

/** The landing copy for `site` in `lang`, or undefined for a site with the full story (UK). */
export function siteLandingCopy(site: TenantCode, lang: Lang): SiteLandingCopy | undefined {
  const byLang = COPY[site];
  return byLang?.[lang] ?? (byLang ? Object.values(byLang)[0] : undefined);
}
