# ilovelawyer-client

Consumer web app for ilovelawyer: pay per case ($9.99, 50 chat credits), AI consultation inside each case, and a free optional lawyer request.

Sign up, sign in and password recovery are real, against ilovelawyer-api (accounts with `role = USER`). Payment, AI replies, uploads and lawyer matching are still mocked in the client store and are marked as placeholders.

## Run

1. Start ilovelawyer-api on port 3001. Its `.env` must list the client origins in both `CLIENT_URL` and `USER_APP_URL`: `http://ph-client.ilovelawyer:3004,http://uk-client.ilovelawyer:3004`.
2. Add the client hosts to your hosts file (`C:\Windows\System32\drivers\etc\hosts` on Windows, as administrator):
   ```
   127.0.0.1 ph-client.ilovelawyer uk-client.ilovelawyer
   ```
3. Create `.env.local` (git-ignored):
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_LAWYER_APP_URL_PH=http://ph.ilovelawyer.local:3002
   NEXT_PUBLIC_LAWYER_APP_URL_UK=http://uk.ilovelawyer.local:3002
   ```
4. Run:
   ```bash
   pnpm install
   pnpm dev        # open http://ph-client.ilovelawyer:3004 (PH) or http://uk-client.ilovelawyer:3004 (UK)
   pnpm lint
   pnpm build
   ```

The host decides the account's Tenant (PH or UK) at signup, and the Terms' governing law. Plain `localhost:3004` works too but creates accounts with no Tenant.

## How auth works

- Components call the API only through TanStack Query hooks (`src/lib/auth/mutations.ts`: `useLoginMutation`, `useSignupMutation`, `useVerifyOtpMutation`, `useResetPasswordMutation`, `useLogoutMutation`, `useRestoreSessionQuery`, …). They wrap the request functions in `src/lib/auth/api.ts`. New API calls should follow the same pattern.
- Every request sends `X-Client-App: user` (`src/lib/api/fetch.ts`). That is what makes the API create a `USER` account and refuse lawyer accounts here (`409 WRONG_APP`). A lawyer's email can't be used to sign up as a client (`409 EMAIL_REGISTERED_AS_LAWYER`).
- The access token lives in memory only (`src/lib/auth/session.ts`). The refresh token is an httpOnly cookie. The endpoints that set it are proxied same-origin by `next.config.ts` rewrites, so the cookie belongs to the client's host. A reload resumes the session with `/api/auth/refresh`.
- Sign-up flow: signup, then an emailed 6-digit code (verify-otp), then signed in. The account is active right away, with no admin approval.
- Recovery: the emailed link opens `/reset-password?token=…` on this app.
- The client has its own Terms (`src/lib/auth/terms.ts`, a draft pending legal review). When they change, bump `CLIENT_TERMS_VERSION` there and in ilovelawyer-api's `auth.constants.ts`.

Cases and the lawyer thread are still kept in `localStorage` (`ilovelawyer-client`), tied to the signed-in account and cleared on sign-out.

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

- **Payment**: `charge()` in `src/components/payment/payment-modal.tsx` waits 1.1s and succeeds. A card number ending in `0002` is declined so the failure state can be seen. Promo `WELCOME5` is client-side only.
- **AI replies**: `src/lib/mock-ai.ts` (keyword-matched canned text).
- **Uploads**: "Add documents" adds a sample file name. No real file handling, limits or scanning.
- **Lawyer side**: the lawyer experience (queue, My clients, client file) is not in this repo. In dev builds only, the matching card has **Demo: lawyer accepts** and the lawyer strip has **Demo: resolve** to exercise the client-side states. These are hidden in production builds.

## Open questions (from the handoff)

Top-up pack prices, credit expiry, refund policy, lawyer pricing visibility, bank-transfer confirmation timing, case-detail editing, and real upload limits are still undecided. See the handoff README.
