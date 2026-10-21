# ilovelawyer-client

Consumer web app for ilovelawyer: pay per case ($9.99, 50 chat credits), AI consultation inside each case, and a free optional lawyer request.

Sign up, sign in, cases, documents and the AI consultation are real, against ilovelawyer-api (accounts with `role = USER`). Payments and chat credits are recorded by the API, but the payment itself is a dummy for now (see below). Lawyer matching is still mocked in the client store.

## Run

1. Start ilovelawyer-api on port 3001. Its `.env` must list `http://localhost:3004` in both `CLIENT_URL` and `USER_APP_URL`.
2. Create `.env.local` (git-ignored):
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_LAWYER_APP_URL=http://uk.ilovelawyer.local:3002
   ```
3. Run:
   ```bash
   pnpm install
   pnpm dev        # http://localhost:3004
   pnpm lint
   pnpm build
   ```

Every client account is in the **UK** tenant. The client app is served from one domain for every region (ilovelawyer.com, and app.ilovelawyer.com for staging), so the host can't tell PH from UK. The API assigns `CLIENT_TENANT_CODE` at signup, and the Terms show UK governing law (`src/lib/tenant/client-tenant.ts`).

## How auth works

- Components call the API only through TanStack Query hooks (`src/lib/auth/mutations.ts`: `useLoginMutation`, `useSignupMutation`, `useVerifyOtpMutation`, `useResetPasswordMutation`, `useLogoutMutation`, `useRestoreSessionQuery`, …). They wrap the request functions in `src/lib/auth/api.ts`. New API calls should follow the same pattern.
- Every request sends `X-Client-App: user` (`src/lib/api/fetch.ts`). That is what makes the API create a `USER` account and refuse lawyer accounts here (`409 WRONG_APP`). A lawyer's email can't be used to sign up as a client (`409 EMAIL_REGISTERED_AS_LAWYER`).
- The access token lives in memory only (`src/lib/auth/session.ts`). The refresh token is an httpOnly cookie. The endpoints that set it are proxied same-origin by `next.config.ts` rewrites, so the cookie belongs to the client's host. A reload resumes the session with `/api/auth/refresh`.
- Sign-up flow: signup, then an emailed 6-digit code (verify-otp), then signed in. The account is active right away, with no admin approval.
- Recovery: the emailed link opens `/reset-password?token=…` on this app.
- The client has its own Terms (`src/lib/auth/terms.ts`, a draft pending legal review). When they change, bump `CLIENT_TERMS_VERSION` there and in ilovelawyer-api's `auth.constants.ts`.

## Cases and the AI

- Cases, their documents and the AI chat live in ilovelawyer-api, under `/api/client` (client accounts only). Each case is a normal case in the client's own personal workspace on the UK site, and the chat uses the same legal AI as the lawyer app. Calls are in `src/lib/cases/api.ts`, hooks in `src/lib/cases/queries.ts`.
- The AI answers in the background. The chat polls the messages every 1.5s while a reply is coming, and a case's documents every 4s while one is still being read.
- After each AI answer the chat asks the API whether the case has what a lawyer needs (`src/lib/cases/readiness.ts`). Jev checks five points: the problem, where in the UK, the other side, what happened and when, and what the client wants. The chat suggests a lawyer, naming the kind, only once all five are covered. Until then it shows what's still missing. With `USE_JEV_LAWYER_READINESS` off on the API, it offers a lawyer after any answer, as before.
- Uploads go straight from the browser to S3 on a signed URL, so the S3 bucket's CORS rules must allow this app's origin (`PUT`). Locally that's `http://localhost:3004`.

## Payments (dummy for now)

- Prices, credits per case, top-up packs and promo codes come from the API (`GET /api/client/pricing`). The numbers are placeholders.
- A new case is paid first (`POST /api/client/payments/case`), then created with that payment. A payment creates one case only.
- The API's payment provider is a dummy: it always succeeds, except a card number ending in `0002`, which declines so the failure screen can be seen. The card form never sends card details anywhere. Stripe replaces the dummy later, on the API side.
- Chat credits are counted on the server. Each AI message uses one, and the chat stops at 0 until the client tops up.

The lawyer request and its thread are still kept in `localStorage` (`ilovelawyer-client`), tied to the signed-in account and cleared on sign-out.

## Stack

Next.js (App Router), React, TypeScript, Tailwind CSS v4 (design tokens in `src/app/globals.css`), TanStack Query (server calls), zustand (session and local state), lucide-react. Fonts: Inter and Libre Caslon Text via `next/font`.

## Feature branches (stacked, merge in this order)

| Branch | Scope |
| --- | --- |
| `feat/foundation` | Tokens, fonts, brand assets, UI primitives (button, inputs, chips, radio cards, modal/sheet, banner) |
| `feat/onboarding` | Create account, email, phone, OTP, About you, Consent, Sign in |
| `feat/shell-cases` | App shell, collapsible sidebar (persisted), phone top bar, banner, cases list |
| `feat/new-case-wizard` | 3-step New case wizard, sticky phone footer |
| `feat/payment-modal` | New-case payment and credit top-up (dialog on web, bottom sheet on phone) |
| `feat/case-workspace` | Consultation (AI chat, credits), Overview, Documents |
| `feat/lawyer-request` | Request lawyer, matching state, lawyer chat tab |
| `feat/polish-docs` | Build check, edge states, this README |

Each branch starts from the previous one, so merge them in order.

## Mocks to replace with real services

- **Payment**: the API's dummy provider (see Payments above), until Stripe.
- **Lawyer side**: the lawyer experience (queue, My clients, client file) is not in this repo. In dev builds only, the matching card has **Demo: lawyer accepts** and the lawyer strip has **Demo: resolve** to exercise the client-side states. These are hidden in production builds.

## Open questions (from the handoff)

Top-up pack prices, credit expiry, refund policy, lawyer pricing visibility, bank-transfer confirmation timing, case-detail editing, and real upload limits are still undecided. See the handoff README.
