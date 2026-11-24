// The Korean site's Refunds Policy, in Korean and in English for a visitor who switches language. It
// covers only what ilovelawyer sells there (AI credits) and the withdrawal rights of the E-Commerce
// Act (전자상거래법 제17조, 제18조), which the landing's fee card and FAQ point to. DRAFT: Korean counsel
// reviews it before launch (FORHU/ilovelawyer-client#169). The UK page stays in copy.ts.

import { COMPANY, SUPPORT_EMAIL, type LegalSection } from "./copy";

export const REFUNDS_KR = {
  ko: {
    title: "환불 정책",
    updated: "시행일: 2026년 11월 23일.",
    description: "ilovelawyer에서 구매한 AI 크레딧의 청약철회와 환불 기준입니다.",
  },
  en: {
    title: "Refunds Policy",
    updated: "Effective date: 23 November 2026.",
    description: "How cancellation and refunds work for AI credits bought on ilovelawyer Korea.",
  },
} as const;

export const REFUNDS_SECTIONS_KO: LegalSection[] = [
  {
    title: "1. 적용 범위",
    blocks: [
      "사건 만들기와 변호사 요청은 무료입니다. 이 정책은 이용자가 ilovelawyer에서 구매하는 AI 크레딧에만 적용됩니다.",
      "변호사의 보수는 이용자와 변호사가 따로 맺는 위임 계약에 따르며, 이 정책의 대상이 아닙니다.",
    ],
  },
  {
    title: "2. 청약철회 (7일)",
    blocks: ["AI 크레딧을 구매한 날부터 7일 이내에는 사용하지 않은 크레딧에 대해 이유를 밝히지 않고 청약철회를 요청할 수 있습니다(「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제1항)."],
  },
  {
    title: "3. 청약철회가 제한되는 경우",
    blocks: [
      "이미 사용한 크레딧과 같은 법 제17조 제2항이 정한 경우에는 청약철회가 제한될 수 있습니다. 제한되는 경우에는 결제 전에 그 사실을 분명하게 표시합니다.",
      "크레딧의 일부만 사용했다면 사용하지 않은 크레딧에 해당하는 금액을 환불합니다.",
    ],
  },
  {
    title: "4. 서비스가 표시와 다른 경우",
    blocks: ["AI 크레딧이 표시·광고된 내용이나 계약 내용과 다르게 제공된 경우, 제공받은 날부터 3개월 이내 또는 그 사실을 안 날이나 알 수 있었던 날부터 30일 이내에 청약철회를 요청할 수 있습니다(같은 법 제17조 제3항)."],
  },
  {
    title: "5. 요청 방법",
    blocks: [`${SUPPORT_EMAIL}로 계정 이메일과 결제 내역을 보내 주세요.`],
  },
  {
    title: "6. 환불 시기와 방법",
    blocks: ["청약철회가 접수되면 3영업일 이내에 결제한 수단으로 환불합니다(같은 법 제18조). 카드 결제는 카드사 사정에 따라 취소가 반영되기까지 시간이 더 걸릴 수 있습니다."],
  },
  {
    title: "7. 계정을 해지할 때",
    blocks: [
      "계정 해지를 요청하면 30일의 유예 기간이 지난 뒤 해지가 확정됩니다. 해지가 확정되면 유료로 구매한 미사용 AI 크레딧을 따로 요청하지 않아도 자동으로 환불합니다. 유예 기간 중 다시 로그인해 해지를 취소하면 크레딧은 환불되지 않고 그대로 남습니다.",
      [
        "환불 금액은 실제 결제한 금액을 기준으로, 구매한 크레딧 중 사용하지 않은 비율만큼 계산합니다. 할인을 받아 구매했다면 할인된 결제 금액이 기준입니다. 예를 들어 크레딧 100개를 90,000원에 구매해 30개를 사용했다면 63,000원(90,000원 × 70/100)을 환불합니다.",
        "사건에 무료로 포함된 크레딧은 환불되지 않습니다.",
        `환불은 결제한 수단으로 진행합니다. 환불이 처리되지 않으면 ${SUPPORT_EMAIL}로 연락해 주세요. 본인 확인 후 다른 방법으로 환불해 드립니다.`,
      ],
      "회사가 약관 위반을 이유로 계정을 해지하는 경우에도 같은 기준으로 환불합니다. 부정 결제나 결제 분쟁과 관련된 금액은 따로 확인합니다.",
      "구매 후 7일 이내의 청약철회(제2조)는 계정 해지와 관계없이 이 정책에 따라 처리됩니다.",
    ],
  },
  {
    title: "8. 문의와 분쟁 해결",
    blocks: [
      `환불 처리에 불만이 있으면 ${SUPPORT_EMAIL}로 알려 주세요. 한국소비자원(국번 없이 1372) 또는 전자거래분쟁조정위원회에 상담이나 분쟁조정을 신청할 수도 있습니다.`,
      "변호사의 서비스에 대한 불만은 해당 변호사 또는 대한변호사협회에 제기할 수 있습니다.",
    ],
  },
  {
    title: "9. 사업자 정보",
    blocks: [`ilovelawyer는 ${COMPANY.name}(미국 델라웨어주 법인, File No. ${COMPANY.fileNo})가 운영합니다. 대표: ${COMPANY.representative} · 주소: ${COMPANY.address} · 사업자등록번호: ${COMPANY.krBusinessNo} · 고객 문의: ${SUPPORT_EMAIL}`],
  },
];

export const REFUNDS_SECTIONS_KR_EN: LegalSection[] = [
  {
    title: "1. What this covers",
    blocks: [
      "Creating a case and requesting a lawyer are free. This policy covers only the AI credits you buy from ilovelawyer.",
      "A lawyer's fee falls under your own agreement with that lawyer and is not covered by this policy.",
    ],
  },
  {
    title: "2. Your right to cancel (7 days)",
    blocks: ["Within 7 days of buying AI credits, you can cancel the credits you haven't used, without giving a reason (Act on the Consumer Protection in Electronic Commerce, Article 17(1))."],
  },
  {
    title: "3. When cancellation is limited",
    blocks: [
      "Credits you have already used, and the other cases set out in Article 17(2) of the same Act, may not be cancellable. Where that applies, we say so clearly before you pay.",
      "If you have used only some of your credits, we refund the amount for the credits you haven't used.",
    ],
  },
  {
    title: "4. If the credits weren't as described",
    blocks: ["If the AI credits differ from what was shown, advertised or agreed, you can cancel within 3 months of receiving them, or within 30 days of when you found out or could have found out (Article 17(3) of the same Act)."],
  },
  {
    title: "5. How to ask",
    blocks: [`Email ${SUPPORT_EMAIL} with the email on your account and your payment details.`],
  },
  {
    title: "6. When and how you're refunded",
    blocks: ["Once we accept your cancellation, we refund you to your original payment method within 3 business days (Article 18 of the same Act). Card refunds can take longer to appear, depending on your card company."],
  },
  {
    title: "7. When you close your account",
    blocks: [
      "When you ask to close your account, the closure becomes final after a 30-day grace period. Once it is final, we refund your unused paid AI credits automatically: you don't need to ask. If you sign in again during the grace period and cancel the closure, your credits stay and aren't refunded.",
      [
        "The refund is based on the amount you actually paid, for the share of the credits you bought that you haven't used. If you bought them at a discount, the discounted amount is what counts. For example, if you paid ₩90,000 for 100 credits and used 30, we refund ₩63,000 (₩90,000 × 70/100).",
        "Credits included free with a case aren't refunded.",
        `We refund you to your original payment method. If the refund can't be made, contact ${SUPPORT_EMAIL}. Once we have confirmed who you are, we refund you another way.`,
      ],
      "If we close an account because it broke our Terms, we refund on the same basis. Amounts linked to fraudulent payments or payment disputes are reviewed separately.",
      "A cancellation within 7 days of purchase (section 2) is handled under this policy whether or not you close your account.",
    ],
  },
  {
    title: "8. Questions and disputes",
    blocks: [
      `If you're unhappy with how we handled a refund, tell us at ${SUPPORT_EMAIL}. You can also ask the Korea Consumer Agency (call 1372 in Korea) or the E-Commerce Mediation Committee for advice or mediation.`,
      "Complaints about a lawyer's service go to that lawyer or to the Korean Bar Association.",
    ],
  },
  {
    title: "9. Who we are",
    blocks: [`ilovelawyer is operated by ${COMPANY.name}, a Delaware corporation (File No. ${COMPANY.fileNo}). Representative: ${COMPANY.representative}. Address: ${COMPANY.address}. Business registration number: ${COMPANY.krBusinessNo}. Contact: ${SUPPORT_EMAIL}.`],
  },
];
