# ilovelawyer-client

Consumer web app for ilovelawyer: pay per case ($9.99, 50 chat credits), AI consultation inside each case, and a free optional lawyer request.

This repo currently contains the **UI/UX implementation only** of the design handoff (`design_handoff_consumer_legal_consultation`). There is no backend: auth, payment, AI replies, uploads and lawyer matching are mocked in the client store and are marked as placeholders.

## Run

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm lint
pnpm build
```

State is kept in `localStorage` (`ilovelawyer-client`) so refreshes keep the demo session.

## Stack

Next.js (App Router), React, TypeScript, Tailwind CSS v4 (design tokens in `src/app/globals.css`), zustand, lucide-react. Fonts: Inter and Libre Caslon Text via `next/font`.

## Delivery phases (one branch each, stacked)

| Branch | Scope |
| --- | --- |
| `phase/0-foundation` | Tokens, fonts, brand assets, UI primitives (button, inputs, chips, radio cards, modal/sheet, banner) |
| `phase/1-onboarding` | Create account, email, phone, OTP, About you, Consent, Sign in |
| `phase/2-shell-cases` | App shell, collapsible sidebar (persisted), phone top bar, banner, cases list |
| `phase/3-new-case-wizard` | 3-step New case wizard, sticky phone footer |
| `phase/4-payment-modal` | New-case payment and credit top-up (dialog on web, bottom sheet on phone) |
| `phase/5-case-workspace` | Consultation (AI chat, credits), Overview, Documents |
| `phase/6-lawyer-request` | Request lawyer, matching state, lawyer chat tab |
| `phase/7-polish-docs` | Build check, edge states, this README |

Each branch starts from the previous one, so merge them in order.

## Mocks to replace with real services

- **Auth**: any credentials sign in; any 6-digit code verifies (`src/lib/store.ts`, `src/app/(auth)`).
- **Payment**: `charge()` in `src/components/payment/payment-modal.tsx` waits 1.1s and succeeds. A card number ending in `0002` is declined so the failure state can be seen. Promo `WELCOME5` is client-side only.
- **AI replies**: `src/lib/mock-ai.ts` (keyword-matched canned text).
- **Uploads**: "Add documents" adds a sample file name. No real file handling, limits or scanning.
- **Lawyer side**: the lawyer experience (queue, My clients, client file) is not in this repo. In dev builds only, the matching card has **Demo: lawyer accepts** and the lawyer strip has **Demo: resolve** to exercise the client-side states. These are hidden in production builds.

## Open questions (from the handoff)

Top-up pack prices, credit expiry, refund policy, lawyer pricing visibility, bank-transfer confirmation timing, case-detail editing, and real upload limits are still undecided. See the handoff README.
