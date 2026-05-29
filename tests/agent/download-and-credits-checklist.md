# Colourbook — PDF Download, Credits & Stripe Checklist

QA-agent test suite (real browser, real data — per project no-unit-test rule).
Run against a **preview** deploy or local dev. Use a test account.

## A. PDF compilation — `/api/books/[bookId]/download`
- [ ] **Real PDF returned.** With a finalized book (≥1 page with
      `coloring_page_url`) and sufficient credits, hit the download link.
      Response is `Content-Type: application/pdf`, `Content-Disposition:
      attachment; filename="<slug>.pdf"`. File opens in a PDF viewer.
- [ ] **Page count matches.** PDF page count == number of book pages with a
      `coloring_page_url`. Each colouring image is centered on US-Letter portrait.
- [ ] **Credits deducted once.** `download_pdf` cost (3 credits) is debited; a
      `cb_credit_transactions` row with `action='download_pdf'` is written.
- [ ] **No charge on build failure.** If an image URL is unreachable, response
      is 502 `Failed to compile PDF` and NO credit is deducted (verify balance
      unchanged + no new transaction row).
- [ ] **Insufficient credits.** With balance < 3, download returns 402 and the
      PDF is NOT delivered.
- [ ] **Ownership.** Requesting another user's bookId returns 404. Unauthenticated
      returns 401.
- [ ] **No completed pages.** A book with zero `coloring_page_url` pages → 400.

## B. Print-queue PDF link (admin)
- [ ] Admin print-queue PDF link (`pdf_url`) now serves the compiled PDF.
      (Note: it hits the same owner-scoped endpoint — see CURRENT_WORK for the
      pre-existing owner-auth/credit-charge caveat on admin access.)

## C. Stripe credit purchase (`/credits` + webhook)
> Requires real Stripe keys. Only `STRIPE_SECRET_KEY` is in ~/.env.keys; the
> publishable key + webhook secret are NOT — set them before this section.
- [ ] `/credits` lists 4 packs (Starter/Popular/Pro/Family). Selecting a pack
      creates a Stripe Checkout session and redirects to Stripe.
- [ ] Completing a test-mode payment fires the webhook
      (`/api/stripe/webhook`, `credit_purchase` session) and credits the buyer's
      balance by the pack amount. A `cb_credit_transactions` purchase row exists.
- [ ] Webhook rejects events with an invalid signature (needs `STRIPE_WEBHOOK_SECRET`).

## D. End-to-end
- [ ] Generate → finalize → download PDF → order print: credits debited at each
      gated step; order lands in print queue with a working `pdf_url`.

## Notes
- Endpoint: `src/app/api/books/[bookId]/download/route.ts` (pdf-lib, builds
  before charging; Node runtime, maxDuration 60).
- Credit costs: `src/lib/credit-costs.ts`.
- Stripe: secret key present in ~/.env.keys; publishable + webhook secret still
  needed (set in .env.local + Vercel env). Do NOT commit secrets.
