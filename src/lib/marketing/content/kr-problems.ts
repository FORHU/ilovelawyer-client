// The legal problems the Korean site's hero cycles through, from the design (ilovelawyer Client KR
// v1). Each photo is 3168×1344 unless it says otherwise. Which side the person stands on alternates
// down the design's list, so `at` is the problem's place in that list: dropping one for want of a
// photo mustn't move the others.

import type { Problem } from "../problems";

/** What the "how we help" line ends with: the client can ask a lawyer they choose to review it. */
const QUOTE_TAIL = " 이후 직접 고른 변호사에게 검토를 요청할 수 있습니다.";

/** Several cards quote deadlines, so each says the examples promise no remedy and no lawyer. */
const EXAMPLE_NOTE = " 예시는 상황 설명을 돕기 위한 것이며, 특정 구제 수단이나 변호사를 보장하지 않으며, 법원 기일이나 기한은 반드시 직접 확인해야 합니다.";

export interface KrProblemRow {
  /** The photo's name, at /landing/kr/hero/<slug>.webp. */
  slug: string;
  at: number;
  tag: string;
  label: string;
  /** The headline. */
  h: string;
  /** What we explain, as one sentence. */
  ex: string;
  say: string;
  keywords: string[];
}

// "대포통장 · 계좌 정지" (frozen account, at 10 in the design) is left out: its photo isn't in the
// bundle. It comes back once supplied, at its own place.
export const KR_PROBLEM_ROWS: KrProblemRow[] = [
  { slug: "jeonse-deposit", at: 0, tag: "주거", label: "전세보증금 반환", h: "전세보증금을 못 돌려받고 있나요?", ex: "임차권등기명령, 지급명령, 보증금반환소송이 각각 어떤 절차인지와 일반적인 기한을 안내해 드립니다.", say: "계약이 끝났는데 집주인이 보증금을 안 돌려줘요", keywords: ["보증금", "전세", "집주인", "임대인", "계약 만료", "deposit", "jeonse", "landlord"] },
  { slug: "jeonse-fraud", at: 1, tag: "주거", label: "전세사기", h: "전세사기 피해가 의심되나요?", ex: "피해자 결정 신청, 경매 절차, 보증보험 청구 등 지금 할 수 있는 일을 정리해 드립니다.", say: "집주인이 연락이 끊기고 집이 경매에 넘어갔어요", keywords: ["전세사기", "사기", "연락두절", "깡통", "fraud"] },
  { slug: "online-defamation", at: 2, tag: "형사", label: "사이버 명예훼손", h: "온라인 글 때문에 고소를 당했나요?", ex: "사실을 적어도 명예훼손이 될 수 있는 경우와 경찰 조사 전에 준비할 것을 설명해 드립니다.", say: "리뷰를 썼는데 명예훼손으로 고소당했어요", keywords: ["명예훼손", "리뷰", "게시글", "후기", "defam", "review", "post"] },
  { slug: "cyber-insult", at: 3, tag: "형사", label: "모욕죄 고소", h: "악성 댓글로 고소하고 싶나요?", ex: "모욕죄와 명예훼손의 차이, 증거를 남기는 방법, 고소 기한(6개월)을 설명해 드립니다.", say: "악플러를 고소하고 싶어요", keywords: ["모욕", "악플", "댓글", "욕설", "insult", "comment", "abuse"] },
  { slug: "police-summons", at: 4, tag: "형사", label: "경찰 출석요구서", h: "경찰에서 출석요구를 받았나요?", ex: "출석 전에 확인할 것, 진술할 때의 권리, 변호인 동석이 왜 중요한지 설명해 드립니다.", say: "경찰서에서 출석하라는 연락을 받았어요", keywords: ["출석", "경찰", "조사", "소환", "피의자", "summons", "police", "questioning"] },
  { slug: "unpaid-wages", at: 5, tag: "노동", label: "임금체불", h: "월급을 제때 못 받았나요?", ex: "노동청 진정, 대지급금, 민사소송이 각각 어떤 절차인지와 일반적인 기한을 안내해 드립니다.", say: "3개월째 월급을 못 받고 있어요", keywords: ["월급", "임금", "체불", "급여", "알바비", "wage", "salary", "paid"] },
  { slug: "severance-pay", at: 6, tag: "노동", label: "퇴직금", h: "퇴직금을 못 받았나요?", ex: "퇴직금 지급 요건과 계산 방법, 퇴직 후 14일 지급 기한을 설명해 드립니다.", say: "퇴사했는데 퇴직금을 안 줘요", keywords: ["퇴직금", "퇴사", "severance"] },
  { slug: "unfair-dismissal", at: 7, tag: "노동", label: "부당해고", h: "갑자기 해고를 당했나요?", ex: "해고 사유와 서면 통지 요건, 노동위원회 구제신청 기한(3개월)을 설명해 드립니다.", say: "하루아침에 해고 통보를 받았어요", keywords: ["해고", "잘렸", "권고사직", "fired", "dismiss", "sacked"] },
  { slug: "workplace-bullying", at: 8, tag: "노동", label: "직장 내 괴롭힘", h: "직장에서 괴롭힘을 당하고 있나요?", ex: "괴롭힘에 해당하는 행위, 회사 신고 절차, 남겨 둘 증거를 설명해 드립니다.", say: "상사가 매일 폭언을 해요", keywords: ["괴롭힘", "폭언", "갑질", "상사", "bully", "harass"] },
  { slug: "voice-phishing", at: 9, tag: "금융", label: "보이스피싱 피해", h: "보이스피싱에 속아 돈을 보냈나요?", ex: "지급정지 요청, 피해구제 신청, 고소 절차를 일반적인 순서대로 안내해 드립니다.", say: "검찰이라는 전화에 속아 돈을 보냈어요", keywords: ["보이스피싱", "피싱", "송금", "사기", "phishing", "scam"] },
  { slug: "dui", at: 11, tag: "교통", label: "음주운전", h: "음주운전으로 단속됐나요?", ex: "면허 취소·정지 기준, 행정심판 기한(90일), 형사 절차를 설명해 드립니다.", say: "음주 단속에 걸려 면허가 취소될 것 같아요", keywords: ["음주", "면허", "단속", "혈중", "drink", "dui", "licence"] },
  { slug: "traffic-accident", at: 12, tag: "교통", label: "교통사고 합의", h: "교통사고 합의금이 고민되나요?", ex: "형사합의와 보험 보상의 차이, 합의서에 넣을 내용과 기한을 설명해 드립니다.", say: "사고가 났는데 합의금을 얼마나 줘야 할지 모르겠어요", keywords: ["교통사고", "사고", "합의금", "합의", "accident", "settlement", "crash"] },
  { slug: "divorce", at: 13, tag: "가사", label: "이혼 · 위자료", h: "이혼을 고민하고 있나요?", ex: "협의이혼과 재판이혼 절차, 위자료와 재산분할 기준을 설명해 드립니다.", say: "이혼하려는데 재산분할이 걱정돼요", keywords: ["이혼", "위자료", "재산분할", "남편", "아내", "배우자", "divorce", "alimony"] },
  { slug: "child-support", at: 14, tag: "가사", label: "양육비", h: "양육비를 받지 못하고 있나요?", ex: "양육비 청구, 이행명령, 양육비이행관리원 지원 절차를 설명해 드립니다.", say: "전 배우자가 양육비를 안 보내요", keywords: ["양육비", "양육", "아이", "자녀", "child", "support"] },
  { slug: "unpaid-invoice", at: 15, tag: "기업", label: "하도급 · 미수금", h: "거래처가 대금을 안 주나요?", ex: "내용증명, 지급명령, 하도급 분쟁 신고가 각각 어떤 절차인지 안내해 드립니다.", say: "거래처가 공사대금을 6개월째 안 줘요", keywords: ["미수금", "대금", "하도급", "거래처", "공사대금", "invoice", "client", "unpaid"] },
  { slug: "payment-order", at: 16, tag: "민사", label: "지급명령 받음", h: "법원에서 지급명령을 받았나요?", ex: "지급명령은 송달 후 2주 안에 이의신청하지 않으면 확정됩니다. 이의신청 방법을 설명해 드립니다.", say: "법원에서 지급명령 서류가 왔어요", keywords: ["지급명령", "법원", "독촉", "이의신청", "payment order", "court"] },
];

/** The words around a row's own text, which differ by language. */
export interface KrProblemWords {
  /** What follows what we explain: the client can ask a lawyer they choose to review it. */
  tail: string;
  /** The line saying the examples promise no remedy and no lawyer. */
  note: string;
  /** The photo's alt text. The photos are of people in the situation, not of the problem. */
  alt: (label: string) => string;
}

/** The problems in one language. The photo, its crop and the keywords come from the row, so the
 * Korean and English pages show the same people in the same places. */
export function buildKrProblems(rows: KrProblemRow[], words: KrProblemWords): Problem[] {
  return rows.map((r) => ({
    label: r.label,
    slug: r.slug,
    imageDir: "kr/hero",
    tag: r.tag,
    h: r.h,
    help: r.ex + words.tail + words.note,
    brief: r.ex,
    say: r.say,
    keywords: r.keywords,
    alt: words.alt(r.label),
    fx: r.at % 2 ? 0.68 : 0.35,
    fy: r.slug === "unfair-dismissal" ? 0.27 : 0.3,
    ...(r.slug === "unfair-dismissal" ? { width: 2752, height: 1536 } : {}),
  }));
}

export const KR_PROBLEMS: Problem[] = buildKrProblems(KR_PROBLEM_ROWS, {
  tail: QUOTE_TAIL,
  note: EXAMPLE_NOTE,
  alt: (label) => `${label} 상황의 사진`,
});

/** The problem selected when the page opens. */
export const KR_START_PROBLEM = 0;
