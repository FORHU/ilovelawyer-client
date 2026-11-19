// The Korean site's landing page (kr.ilovelawyer.com), from the design ilovelawyer Client KR v1.
// DRAFT: a Korean lawyer must review all of it before launch. [Square brackets] are facts or
// decisions still to come; they show as dashed chips and must all be gone before the page goes
// public.
//
// Pricing follows the Korean model (copy review, 19 Nov 2026): creating a case is free and credits
// are paid, but ilovelawyer takes no fee for introducing or hiring a lawyer. The client picks one
// lawyer and agrees and pays that lawyer's fee directly with them; ilovelawyer earns from credits and
// lawyers' software subscriptions. The Attorney-at-Law Act bars paid referrals and fee sharing. This
// copy is only true once the app and API drop the platform fee and multi-lawyer quotes, so it ships in
// the same release as that change.

import { SUPPORT_EMAIL } from "../copy";
import { KR_PROBLEMS, KR_START_PROBLEM } from "./kr-problems";
import type { LandingContent } from "./types";

const TITLE = "ilovelawyer: 법률 문제, 명확하게";
const DESCRIPTION =
  "내 법률 문제를 먼저 이해하고, 대한변협에 등록된 변호사에게 견적을 받아 보세요. 사건 생성은 무료이며, 모든 비용은 결제 전에 표시됩니다. AI 안내는 법률 자문이 아닙니다.";
const DISCLAIMER = "AI 안내는 일반 법률 정보이며 법률 자문이 아닙니다. 자문은 직접 선택한 변호사가 제공합니다.";

export const KR_CONTENT: LandingContent = {
  htmlLang: "ko",
  meta: { title: TITLE, description: DESCRIPTION, ogLocale: "ko_KR", siteName: "ilovelawyer" },
  nav: { how: "이용 방법", faq: "자주 묻는 질문", signIn: "로그인", start: "사건 시작하기", menu: "메뉴" },
  hero: {
    sectionLabel: "법률 문제, 명확하게",
    groupLabel: "법률 문제 선택",
    defaultHeadline: ["법률 문제,", "명확하게."],
    defaultHeadlineLabel: "법률 문제, 명확하게.",
    searchLabel: "법률 문제를 설명해 주세요",
    searchFocusPlaceholder: "법률 문제를 설명해 주세요",
    submitLabel: "이 내용으로 사건 시작하기",
    noMatch: "잘 모르겠다면, 사건을 시작하고 직접 설명해 보세요",
    tagline: "내 법률 문제를 먼저 이해하고, 대한변협에 등록된 변호사에게 견적을 받아 보세요.",
    cta: "사건 시작하기",
    disclaimer: DISCLAIMER,
    play: "움직임 재생",
    pause: "움직임 일시정지",
  },
  problems: KR_PROBLEMS,
  startProblem: KR_START_PROBLEM,
  how: {
    sectionLabel: "혼자 짐작하지 마세요",
    intro: {
      left: "혼자 짐작하지",
      right: "마세요.",
      sub: "지금 겪는 일을 편하게 말해 주세요. 쉬운 말로 정리해 드리고, 대한변협에 등록된 변호사가 견적을 보냅니다.",
    },
    cta: "사건 시작하기",
    headings: [
      "휴대폰으로 시작하고, PC에서 이어가세요.",
      "사건은 정리되고, 변호사는 준비됩니다.",
      "대한변협 등록 변호사에게 견적을 받으세요.",
      "믿을 수 있는 변호사를 직접 고르세요. 모든 변호사의 대한변협 등록을 확인합니다.",
      "변호사와 한곳에서 대화하세요.",
      "서류를 올리면, 날짜와 요청 사항을 정리해 드립니다.",
      "정리된 사건은, 직접 고른 변호사가 이어받습니다.",
    ],
    captions: [
      { label: "01 / 04 · 의뢰인 요약", text: "사실관계, 날짜, 수사·소송 단계, 합의 상태가 정리된 채로 전달됩니다." },
      { label: "02 / 04 · 증거 목록", text: "내용증명, 임대차계약서, 카카오톡 대화, 계좌이체 내역을 종류별로 분류합니다." },
      { label: "03 / 04 · 타임라인", text: "사건 순서와 함께 출석일, 합의 기한, 소송 기한이 표시됩니다." },
      { label: "04 / 04 · 사건 현황", text: "변호사가 강점, 부족한 증거, 모든 기한을 한눈에 봅니다." },
    ],
    clientLabel: "의뢰인",
    solicitorLabel: "변호사",
    clientPhotos: [
      { src: "/landing/kr/people/pair-c0.webp", alt: "소파에 앉아 태블릿으로 사건 요약을 읽는 의뢰인" },
      { src: "/landing/kr/people/pair-c1.webp", alt: "버스에서 휴대폰으로 견적을 확인하는 의뢰인" },
      { src: "/landing/kr/people/pair-c2.webp", alt: "주방 식탁에서 메시지를 입력하는 의뢰인" },
      { src: "/landing/kr/people/pair-c3.webp", alt: "주방 식탁에서 서류와 휴대폰을 들고 있는 의뢰인" },
    ],
    solicitorPhotos: [
      { src: "/landing/kr/people/pair-l0.webp", alt: "모니터 네 대가 놓인 책상에서 사건을 생각하는 변호사" },
      { src: "/landing/kr/people/pair-l1.webp", alt: "모니터 네 대가 놓인 책상에서 미소 짓는 변호사" },
      { src: "/landing/kr/people/pair-l2.webp", alt: "모니터 네 대가 놓인 책상에서 답장을 쓰는 변호사" },
      { src: "/landing/kr/people/pair-l3.webp", alt: "모니터 네 대가 놓인 책상에서 의뢰인의 서류를 읽는 변호사" },
    ],
  },
  paper: {
    senders: ["○○부동산", "○○지방법원", "○○경찰서 수사과", "인사팀", "○○캐피탈 채권팀", "○○건설"],
    formCodes: ["서식 제1호", "서식 제3호", "서식 제7호", "서식 제12호", "서식 제24호", "서식 제31호"],
    fill: [
      "귀하와 관련된 위 사안에 대하여 다음과 같이 알려 드립니다. 이 문서를 주의 깊게 읽고 보관하시기 바랍니다. 아래 내용은 지금까지의 경과, 귀하에게 요청하는 사항, 회신 기한을 설명합니다. 기한까지 회신이 없을 경우 별도의 통지 없이 법적 절차를 진행할 수 있습니다.",
      "본 통지는 당사자 간 계약과 관련하여 발송합니다. 기재된 금액과 날짜는 작성일 기준 기록에 따른 것입니다. 내용에 이의가 있는 경우 관련 자료를 첨부하여 서면으로 알려 주시기 바랍니다. 모든 연락 시 상단의 문서번호를 기재해 주십시오.",
    ],
    re: "제목: ",
    ref: (n) => `문서번호 ${n}`,
    date: (day) => `2026년 10월 ${day + 1}일`,
    address: "서울특별시 마포구 ○○로 14, 202호",
    signOff: "발신인 (인)",
    envelopeTag: "내용증명",
    formName: (code) => code,
    section1: "1. 인적 사항",
    section2: "2. 사건 경위",
    nextSteps: "향후 절차",
    howWeHelp: "이렇게 도와드립니다",
  },
  mock: {
    lawyers: [
      { name: "김서연 변호사", first: "김서연 변호사", initials: "김", firm: "법률사무소 서연", bio: "임대차·부동산 사건을 주로 맡고 있습니다.", message: "요약을 읽었습니다. 서류를 검토하고 선택지를 안내해 드리며, 필요하면 회신 서면도 대신 작성하겠습니다." },
    ],
    starters: ["회사에서 해고됐어요", "집주인이 보증금을 안 줘요", "경찰 출석요구서를 받았어요"],
    disclosure:
      "변호사 보수는 의뢰인과 변호사가 직접 약정하고 결제합니다. ilovelawyer는 변호사 소개나 선임의 대가로 수수료를 받지 않습니다.",
    aiNote: "저는 변호사에게 전달할 정보를 모으고 정리합니다. 법률 자문은 할 수 없습니다.",
    city: "서울",
    clientName: "김지민",
    clientFirst: "지민",
    credits: "46 크레딧",
    topUp: "충전",
    getLawyer: "변호사 찾기",
    tabs: { interview: "인터뷰", overview: "개요", documents: "서류", lawyer: "변호사" },
    composerPlaceholder: "무슨 일인지 말씀해 주세요…",
    cases: "사건 목록",
    guide: "가이드",
    newCaseTitle: "무슨 일이 있으신가요?",
    newCaseBody: "글이나 음성으로 편하게 말씀해 주세요. 몇 가지 질문 후 사건을 정리해 드립니다. AI 안내는 법률 자문이 아닙니다.",
    newCaseBodyPhone: "글이나 음성으로 편하게 말씀해 주세요. 몇 가지 질문 후 사건을 정리해 드립니다.",
    fillForm: "양식이 편하신가요? 양식으로 작성하기",
    fillFormPhone: "양식이 편하신가요? 양식으로 작성하기",
    shortDisclaimer: "AI 안내는 법률 자문이 아닙니다.",
    overview: {
      readyEyebrow: "변호사 검토 준비",
      readyTitle: "변호사에게 필요한 3가지 중 3가지",
      criteria: ["사건 경위", "핵심 서류", "원하는 도움"],
      upToDate: "최신 상태 · 3시간 전 업데이트",
      continueInterview: "인터뷰 계속하기",
      summary: "요약",
      aiWritten: "AI 작성 · 말씀하신 내용과 맞는지 확인하세요",
      summaryText: (msg) => `말씀하신 내용: “${msg}”. 관련 서류를 추가하셨고, 그 의미와 다음에 할 일을 알고 싶어 하십니다.`,
      timeline: "타임라인",
      timelineDate: "2026. 10. 2.",
      timelineEvent: "이 사안에 관한 서류를 받았습니다.",
      timelineSource: "출처: 서류.pdf, 1쪽",
      stillNeeded: "추가로 필요한 정보",
      stillQuestion: "언제부터 시작됐나요?",
      stillWhy: "변호사가 기한을 확인하는 데 도움이 됩니다.",
      stillAnswer: "인터뷰에서 답하기 →",
    },
    request: {
      eyebrow: "요청 진행 상황",
      title: "변호사 요청",
      sent: { label: "요청 전송", sub: "직접 고른 변호사에게 익명 요약 전달" },
      finding: { label: "이해충돌 확인", sub: "사건에 등장하는 이름 확인" },
      reviewingSub: "요약을 읽고 답변 작성",
      quoteSub: "수락하면 변호사와 바로 대화를 시작합니다",
      working: { label: "변호사와 진행 중", sub: "메시지, 사건 읽기 전용 열람" },
    },
    quotes: {
      verified: "대한변협 등록 확인",
      status: "답변 도착",
      reviewing: "변호사가 검토 중",
      compare: "답변 확인",
      heading: "선택한 변호사의 답변",
      deadline: "11월 20일 금요일 오전 9시까지 수락하거나 거절하세요. 응답하지 않으면 요청이 종료되며 다시 요청할 수 있습니다.",
      quoteEyebrow: "변호사 답변",
      directFee: "보수는 변호사와 직접 약정",
      accept: () => "수락하고 대화 시작",
      decline: "거절",
    },
    messages: {
      workingWith: (first) => `${first}와 진행 중`,
      reviewingOne: "변호사가 검토 중",
      reviewQuote: "답변 확인",
      workingBanner: (name) => `${name}와 함께 진행 중입니다`,
      heading: (name) => `${name}와의 메시지`,
      intro: "이미 사건과 서류를 볼 수 있습니다. 궁금한 점을 여기서 물어보세요.",
      you: "나",
      author: (name) => `${name} · 담당 변호사`,
      firstTime: "11월 4일 09:12",
      secondTime: "11월 4일 09:30",
      first: "지민 님, 사건 잘 읽었습니다. 받으신 서류를 공유해 주시겠어요? 상담 전에 검토하겠습니다.",
      reply: (first) => `감사합니다, ${first}님. 서류 올립니다.`,
      file: "서류.pdf",
      sharedBy: "김지민 공유 · 2026년 11월 4일",
      last: "확인했습니다. 이번 주 안에 회신드리겠습니다.",
    },
    letter: {
      userBubble: "이런 서류를 받았는데 무슨 뜻인지 모르겠어요.",
      file: "서류.pdf",
      aiReply: (label) => `추가하신 서류를 읽었습니다. ${label} 관련 공식 서류이며, 11월 20일까지 회신을 요구합니다. 그 날짜를 개요에 추가했으니 변호사도 확인할 수 있습니다.`,
      offerTitle: "변호사가 이 사건을 검토해 주길 원하시나요?",
      offerBody: "등록이 확인된 변호사가 사건과 대화를 검토합니다. 사건에 포함되어 있습니다.",
    },
    interview: {
      soundsLike: (label, help) => `${label} 문제로 보입니다. ${help}`,
      thanks: "말씀해 주셔서 감사합니다.",
    },
    frame: {
      laptopLabel: "노트북에서 보는 ilovelawyer 앱, 샘플 사건.",
      urlHost: "kr.ilovelawyer.com",
      sampleCase: "샘플 사건",
      paths: ["cases/new", "cases", "cases", "cases", "cases", "cases"],
      labels: [
        "무슨 일인지 묻는 새 사건 대화",
        "사건 개요: 변호사에게 필요한 정보, AI 요약, 출처가 달린 타임라인",
        "선택한 변호사의 답변: 보수는 변호사와 직접 약정",
        "변호사의 답변을 확인하는 화면, 수락과 거절 선택",
        "선택한 변호사와의 메시지, 공유된 서류",
        "AI가 서류를 읽은 사건 인터뷰",
      ],
    },
    quietChat: {
      msg: "계약이 끝났는데 집주인이 보증금을 안 돌려줘요",
      label: "전세보증금 반환",
      area: "주거",
      help: "임차권등기명령, 지급명령, 보증금반환소송이 각각 어떤 절차인지와 일반적인 기한을 안내해 드립니다.",
      question: "언제부터 시작됐나요? 경찰 출석요구서, 검찰 통지서, 법원 지급명령 같은 서류를 받으셨나요?",
    },
    phoneLabels: {
      sent: (msg) => `휴대폰의 ilovelawyer 앱: 사건 인터뷰, "${msg}"에 답하는 중`,
      empty: "휴대폰의 ilovelawyer 앱: 무슨 일인지 묻는 새 사건 대화",
    },
  },
  trust: {
    eyebrow: "신뢰",
    title: "시작하기 전에 알아 두세요",
    cards: [
      {
        title: "대한변협 등록 확인",
        body: "모든 변호사는 견적을 보내기 전에 대한변호사협회 등록 여부를 확인합니다. 대한변협 홈페이지에서 직접 조회할 수도 있습니다. [추가 확인 절차: 확정 후 기재]",
      },
      {
        title: "변호사가 볼 수 있는 정보",
        body: "변호사는 먼저 이름과 서류를 뺀 익명 요약만 봅니다. 의뢰인이 직접 고른 변호사는 이해충돌 여부를 확인하기 위해 사건에 등장하는 사람과 기관의 이름도 볼 수 있습니다. 그 변호사가 의뢰를 수락한 뒤에만 사건, 서류, AI와의 대화를 열람할 수 있습니다.",
      },
      {
        title: "ilovelawyer 수익 구조",
        body: "ilovelawyer는 의뢰인이 구매하는 채팅 크레딧과 변호사가 이용하는 업무용 소프트웨어 구독으로 수익을 얻습니다. 변호사 소개나 선임의 대가로 수수료를 받지 않으며, 변호사 보수는 의뢰인과 변호사가 직접 약정하고 결제합니다.",
      },
      {
        title: "AI와 개인정보",
        body: "AI는 사건 요약을 만드는 데 사용됩니다. 정보는 서비스 제공에만 쓰이고 판매되지 않으며, 언제든 열람과 삭제를 요청할 수 있습니다. [국내 서버 보관 여부: 확정 후 기재] 자세한 내용은 개인정보처리방침을 확인하세요.",
      },
    ],
  },
  fees: {
    eyebrow: "비용",
    title: "수락하기 전에 모든 비용을 확인하세요",
    lede: "ilovelawyer에서 결제하는 금액은 결제 전에 모두 표시되며, 동의하기 전에는 아무것도 청구되지 않습니다.",
    cards: [
      {
        title: "사건 생성은 무료",
        body: "사건을 만들고 변호사를 요청하는 데는 비용이 들지 않으며, 새 사건에는 채팅 크레딧이 포함됩니다. 더 필요하면 결제 전에 표시된 가격으로 구매할 수 있습니다.",
      },
      {
        title: "변호사 견적",
        body: "변호사를 직접 고르고, 보수는 그 변호사와 직접 약정하고 결제합니다. ilovelawyer는 변호사 보수에서 어떤 수수료도 받지 않습니다.",
      },
      {
        title: "결제와 환불",
        body: "결제한 뒤 환불이 필요하면 환불 정책에 따릅니다. [청약철회 기간: 확정 후 기재]",
      },
    ],
  },
  faq: {
    title: "자주 묻는 질문",
    items: [
      {
        q: "AI는 무엇을 하나요?",
        a: "상황을 내 말로 설명하도록 돕고, 핵심 날짜, 수사·소송 단계, 합의 상태, 변호사가 물어볼 질문을 정리한 요약을 만듭니다. 첫 상담을 준비하는 데도 도움이 됩니다.",
      },
      {
        q: "AI가 할 수 없는 일은 무엇인가요?",
        a: "법률 자문, 승소 가능성 판단, 대리를 할 수 없고 변호사를 대신하지 않습니다. 실수할 수 있으니 중요한 내용은 선택한 변호사에게 확인하세요.",
      },
      {
        q: "법률 자문인가요?",
        a: "아닙니다. ilovelawyer는 법률사무소가 아니며 AI는 일반적인 법률 정보만 제공합니다. 법률 자문은 의뢰인이 선택한 변호사가 제공하고 책임집니다.",
      },
      {
        q: "변호사 등록은 정말 확인하나요?",
        a: "네. 변호사가 요청을 받거나 견적을 보내기 전에 우리 팀이 대한변호사협회 등록 여부를 확인합니다. 이름이 일치하는지, 현재 활동 중인지도 살펴봅니다. [추가 확인 절차: 확정 후 기재]",
      },
      {
        q: "경찰 출석요구서를 받았어요. 빨리 도움을 받을 수 있나요?",
        a: "출석일을 입력하면 사건 요약 맨 위에 표시되어 변호사가 바로 확인할 수 있습니다. 경찰 조사 단계부터 변호인의 도움을 받을 수 있습니다.",
      },
      {
        q: "합의 상태는 왜 묻나요?",
        a: "형사 사건에서는 피해자와의 합의가 처분과 양형에, 민사 사건에서는 소송 여부와 비용에 큰 영향을 줍니다. 합의 상태와 기한을 요약과 타임라인에 기록합니다.",
      },
      {
        q: "변호사가 내 이름을 보나요?",
        a: "처음에는 보지 않습니다. 익명 처리된 요약만 봅니다. 의뢰인이 직접 고른 변호사는 이해충돌을 확인하기 위해 사건에 등장하는 사람과 기관의 이름을 볼 수 있습니다. 그 변호사가 의뢰를 수락하면 사건, 서류, AI와의 대화를 열람할 수 있고, 변호사의 기록 보관 의무에 따라 사본을 보관할 수 있습니다.",
      },
      {
        q: "비용은 얼마인가요?",
        a: "사건 생성은 무료이며, 새 사건에는 채팅 크레딧이 포함됩니다. 크레딧이 더 필요하면 결제 전에 표시된 가격으로 구매할 수 있습니다. 변호사 요청도 무료입니다. 변호사 보수는 선택한 변호사와 직접 약정합니다. [부가가치세 표시 방식: 확정 후 기재]",
      },
      {
        q: "ilovelawyer는 어떻게 수익을 얻나요?",
        a: "두 가지입니다. 의뢰인이 구매하는 채팅 크레딧, 그리고 변호사가 이용하는 업무용 소프트웨어 구독료입니다. 변호사 소개나 수임의 대가는 받지 않습니다. 자세한 내용은 위의 'ilovelawyer 수익 구조'를 확인하세요.",
      },
      {
        q: "환불받을 수 있나요?",
        a: "네, 환불 정책에 안내된 경우에 가능합니다. [청약철회 기간: 확정 후 기재]",
      },
      {
        q: "마음에 드는 견적이 없으면요?",
        a: "하나를 꼭 선택하지 않아도 되며, 견적을 받는 데 드는 비용은 없습니다. 의뢰를 수락한 변호사만 사건 전체를 볼 수 있습니다.",
      },
      {
        q: "어떤 사건을 다루나요?",
        a: "전세보증금·전세사기, 사이버 명예훼손·모욕, 경찰 조사, 임금체불·퇴직금·부당해고·직장 내 괴롭힘, 보이스피싱, 음주운전·교통사고, 이혼·양육비, 미수금·지급명령 사건 등을 다룹니다.",
      },
      {
        q: "내 정보는 안전한가요?",
        a: "[전송·저장 시 암호화: 확정 후 기재] 개인정보 보호법에 따라 처리합니다. 자세한 내용은 개인정보처리방침을 확인하세요.",
      },
    ],
  },
  closing: {
    imageLabel: "휴대폰을 보며 안도하는 여성",
    imageSrc: "/landing/kr/cta.webp",
    imageFace: { fx: 0.69, fy: 0.27, width: 2000, height: 1116 },
    title: "준비되면, 시작하세요.",
    body: "상황 설명에 10분 정도 걸립니다. 저장하고 언제든 이어갈 수 있습니다.",
    cta: "사건 시작하기",
  },
  footer: {
    disclaimer: DISCLAIMER,
    product: "서비스",
    legal: "약관",
    contact: "문의",
    terms: "이용약관",
    privacy: "개인정보처리방침",
    refunds: "환불 정책",
    supportEmail: SUPPORT_EMAIL,
    legalNote:
      "ilovelawyer는 [상호]의 서비스입니다. 사업자등록번호 [번호], 주소 [주소], 대표 [이름], 통신판매업 신고 [번호]. ilovelawyer는 법률사무소가 아니며 법률 자문을 제공하지 않습니다. 플랫폼의 변호사는 대한변호사협회에 등록된 독립 변호사입니다.",
  },
};
