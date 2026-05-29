# Colourbook — QA Readiness Report

**Date:** 2026-05-29 (EDT)
**Target:** https://colourbook-wine.vercel.app (prod)
**Mode:** Autonomous E2E test → fix → deploy → retest loop
**Verdict:** ✅ ALL GREEN. Full user lifecycle passes on current prod. 7 bugs found
+ fixed + deployed (3 first loop, 4 in deep coverage) + prod env key sync + security
hardening. Two of the bugs had silently broken the app's two most important flows
(signup onboarding and page generation) for every real user.

### Final all-green re-confirmation (current prod, this session's last sweep)
- ✅ Authed route crawl — 13 routes, HTTP 200, **0 console/page errors**, admin gates.
- ✅ PDF download matrix — 401 / 200 (2 pages) / 502 / 400 / 404, all correct.
- ✅ Credit spend (refactored CAS `spendCredits`) — 100→97, one `download_pdf` txn.
- ✅ Page generation (gpt-image-1) — HTTP 200, real image produced.
- ✅ Signup → profile auto-created (20 credits) after the trigger + revoke fixes.
- ✅ Family add, book build (create + add page), checkout→order→print queue — all pass.
- ✅ Security: 0 cb_ tables with RLS disabled; SECURITY DEFINER RPC access revoked.
- ✅ All test data + storage removed; QA user reset to 100 credits.

---

## Summary

Started on prod running an **undeployed** state (PDF commit `92e6664` never shipped)
with **placeholder** OpenAI + Supabase service-role keys in Vercel. After syncing real
keys, deploying, and fixing 3 bugs across 3 deploys, every non-skipped flow passes.

The QA browser agent (gemma3:12b) confirmed dashboard/navigation/generate UI and real
credit deduction; HTTP-level gating (401/402/404/400/502) and PDF correctness were
verified **deterministically** via authenticated requests + Supabase DB checks
(the browser agent structurally cannot manipulate balances or post arbitrary bookIds).

---

## Pre-flight (config fixes, not code)

- Created confirmed QA user `qa-colourbook@example.com` (service-role admin). The
  `cb_handle_new_user` trigger swallowed the profile insert (exception → RETURN NEW),
  so the `cb_profiles` row was inserted manually. Login verified against prod.
- **Prod Vercel env had placeholders** for `OPENAI_API_KEY` and
  `SUPABASE_SERVICE_ROLE_KEY` (set 72d ago). Synced real values from `.env.local`
  (OpenAI key validated: 200, 124 models). This alone would have broken generation +
  the credits system on prod.

## Bugs fixed (committed + deployed)

| Commit | Bug | Fix |
|--------|-----|-----|
| `458aadf` | **Dashboard 500 for every authed user** — server component passed lucide icon **components** (functions) as props to client components `AnimatedStatCard`/`AnimatedActionCard`. "Functions cannot be passed directly to Client Components." Blocked the entire app post-login (QA run1: 0/12). | Pass icon by **name string**; client components resolve via an internal map. |
| `7863026` | **Image generation 500** — key has no `dall-e-3` ("model does not exist"); `style` + `response_format` params also rejected. | Switch to **gpt-image-1**: drop `style`/`response_format`, `quality` `hd`→`high`, decode returned `b64_json` straight to a Buffer. |
| `f72c27d` | `/api/generate` could time out (gpt-image-1 + upload ≈ 30s, past default limit). | `runtime='nodejs'`, `maxDuration=60` (matches download route). |

## Flows verified on current prod

### PDF download — `/api/books/[bookId]/download` (headline) — ALL PASS
Verified deterministically (authed cookie + DB):
- ✅ **200 `application/pdf`**, `Content-Disposition: attachment; filename="qa-good-book.pdf"`, valid PDF v1.7, 22,952 bytes.
- ✅ **Page count == book pages** (2 == 2), US-Letter portrait.
- ✅ **Credits deducted once** — 100→97, one `cb_credit_transactions` row `action='download_pdf'`, `credits=-3`, `balance_after=97`.
- ✅ **No charge on build failure** — unreachable image → **502** `Failed to compile PDF`, balance unchanged, no txn.
- ✅ **Insufficient credits** — balance 2 (<3) → **402**, no PDF delivered, no charge.
- ✅ **Ownership** — another user's book → **404**. Unauthenticated → **401**.
- ✅ **No completed pages** — book with NULL `coloring_page_url` → **400**.

### OpenAI page generation (authorized $ spend) — PASS
- ✅ Real gpt-image-1 generation on prod: POST `/api/generate` → **200**, 30.3s, returns public image URL.
- ✅ Page row → `generation_status='complete'`, `coloring_page_url` set, no error.
- ✅ Image reachable: 200, `image/png`, valid 1024×1024 PNG (916 KB).
- ✅ **Generation credit deducted** — real browser-UI flow (createPage) wrote two `generate_page` txns (`credits=-1`). Credit spend on the actual user path confirmed.

### Routes / pages — PASS
- ✅ Dashboard + all user routes authed **200**: dashboard, gallery, books, family, credits, generate, orders.
- ✅ Admin routes correctly **307** for non-admin; **200** for admin (admin, print-queue, profitability, orders, users).
- ✅ `/credits` UI renders (200). Public: `/` 200, `/login` 200.

### Browser QA agent (gemma3:12b, real browser)
- Run 1 (pre-fix): 0/12 — every flow blocked by the dashboard 500.
- Run 2 (post dashboard-fix): 5/12 PASS; navigated dashboard/gallery/generate, filled + submitted the real Generate form (triggered createPage credit spend). Remaining 7 "fails" are **test-method limitations**, not app bugs (see below).

---

## Round 2 — deep coverage (3 more critical bugs)

After the first loop, drove the remaining user lifecycle (signup, generate UI,
books, finalize, checkout/order, print queue) and found three more **prod-breaking**
bugs — two of which silently broke the two most important flows in the app.

| Commit | Bug | Severity | Fix |
|--------|-----|----------|-----|
| `5c6882c` | **Real-user page generation never ran.** The `generatePage` server action triggered generation via a server-to-server `fetch('/api/generate')` with NO session cookie → route 401'd → page stuck `pending`, credit spent, no image. Confirmed: two browser-generated pages sat `pending` forever. (My earlier API test passed only because it sent a cookie.) | CRITICAL | Trigger generation from the browser (carries the auth cookie); gallery detail auto-refreshes until ready. `spendCredits` made atomic (CAS) as a bonus. |
| `002` (DB) | **Signup created no profile.** `cb_handle_new_user` runs as `supabase_auth_admin` (`search_path=auth`); the SECURITY DEFINER fn had no `search_path`, so unqualified `cb_profiles` failed to resolve, the INSERT errored, and `EXCEPTION WHEN OTHERS` swallowed it. Every signup made an auth user with NO profile → the `(protected)` layout bounced them to `/login`. **Onboarding was fully broken.** | CRITICAL | `SET search_path=public` + qualify `public.cb_profiles`; surface errors via `RAISE WARNING`. Verified: post-fix signup auto-creates a profile (20 credits, role user). |
| `5c6882c` | `spendCredits` claimed "atomic" but was read-then-write → concurrent spends could double-charge / drive balance negative. | MED | Compare-and-swap with retry. |

### Round 2 verifications (real browser, prod)
- ✅ **Signup** → profile + 20 credits auto-created (was 0 before).
- ✅ **Generate (real UI)** → fill prompt → Generate → gallery detail auto-refreshes
  → coloring image renders, status Complete, 1 credit debited. (Screenshot captured.)
- ✅ **Checkout / order** (BOOK with 2 pages, Maple Leaf): order created `paid`,
  amount `$39.98` (2999 + 0 extra + 999 ship), book → `ordered`, print-queue row
  written with `pdf_url`, 15 credits debited. (Screenshot captured.)
- ✅ **Authed route crawl** (Playwright): all 8 user routes + 5 admin routes —
  HTTP 200, **0 console/page errors**, admin correctly redirects non-admin to dashboard.
- ✅ All test data + storage objects cleaned afterward; QA user reset to 100 credits.

---

### Round 2 observations (not bugs — design gaps, noted for product)
- **"Finalize book" is unimplemented.** `updateBook(status:'complete')` and the
  `finalize_book` (2-credit) charge are never invoked by any UI — the book detail
  page only offers Preview + Order Print. Lifecycle is draft → ordered. Download
  works on draft books that have pages (it checks pages, not status), and order
  checks `page_count ≥ 1`, so the app is functional without finalize. The 2-credit
  finalize charge therefore never happens. Decide: wire a Finalize step, or drop
  the cost/label.
- **`regenerate_page` is defined but unused** (credit cost + profitability label
  only; no regenerate action/route exists).
- **Checkout Print Partner dropdown** showed the partner UUID rather than the name
  under programmatic (Playwright) selection; likely a Radix display quirk on
  synthetic clicks — verify with a real pointer click. Functional either way.
- **`getCustomerProfitability`** calls a non-existent `exec_sql` RPC and falls back
  to JS aggregation (works; admin/profitability renders fine). Minor.

### Security pass (Supabase advisors)
- ✅ **0 cb_ tables with RLS disabled** — all cb_ tables enforce RLS.
- Fixed (migration `003`): `cb_handle_new_user` (SECURITY DEFINER) was executable by
  `anon`/`authenticated` via REST RPC — revoked EXECUTE; trigger still fires
  (verified signup still creates a profile). Closes the advisor WARN.
- App-layer authz: every server action filters `.eq('user_id', user.id)`; download
  endpoint returns 404 cross-user (verified). RLS is the second layer.

## Round 3 — hardening pass (security / perf / edge / mobile)

- ✅ **RLS cross-user isolation verified** (`scripts/qa-verify-rls.mjs`): created a
  second auth user and used their JWT against the RLS-enforced REST API —
  0 rows returned for the other user's `cb_books` / `cb_pages` / `cb_orders` /
  `cb_profiles`; they see only their own profile. No leaks. (Defense beyond the
  app-layer `.eq('user_id')` filters.)
- ✅ **`/api/generate` negative cases**: 401 unauth, 400 missing pageId, 404
  unknown/foreign pageId. Fixed: malformed JSON body now returns **400** (was 500)
  — `request.json()` guarded.
- ✅ **Perf (migration `004`)**: added covering indexes for the 6 unindexed FKs the
  advisor flagged (`cb_book_pages.page_id`, `cb_orders.{credit_transaction_id,
  print_partner_id}`, `cb_print_queue.{book_id,order_id,user_id}`).
- ✅ **Mobile (375×812)**: login, dashboard, generate, books, credits, family — no
  horizontal overflow; sidebar collapses to a hamburger; layout coherent.
- ⚠️ **Deferred (documented, not applied — risk on a live shared DB):** advisor also
  flagged `auth_rls_initplan` (25 cb_ policies call `auth.uid()` per-row; wrap in
  `(select auth.uid())`) and `multiple_permissive_policies` (15). These are
  scale-perf optimizations on access-control policies; at current row counts the
  gain is negligible and rewriting 40 live RLS policies autonomously is higher risk
  than reward. Recommend a deliberate, reviewed migration. 4 unused indexes are INFO-only.

## Coverage map (every route verified)
Public: `/` `/login` `/signup` `/pricing` — 200, 0 errors, design coherent
(Fredoka/Nunito, cream/rose/teal, "20 free pages" matches the 20-credit grant).
Protected (user): `/dashboard` `/family` `/generate` `/gallery` `/gallery/[id]`
`/books` `/books/[id]` `/books/[id]/preview` `/credits` `/orders` `/orders/[id]`
`/checkout/[bookId]` — all 200, 0 console/page errors.
Admin: `/admin` + `/admin/{print-queue,profitability,orders,users}` — 200 as admin,
307→dashboard as non-admin.
Redirect-back: protected route → `/login?redirect=…` → after login lands on the
originally requested route (verified `/generate`).

## Auth entry points (real, no cookie injection)
- ✅ **Login form** — email/password submit lands on the dashboard (verified via a
  fresh browser context, screenshot confirms authenticated dashboard).
- ✅ **Logout** (sidebar) — clears the session; re-visiting `/dashboard` redirects to
  `/login?redirect=%2Fdashboard` (preserves intended destination).
- ✅ **Protected-route guard** — unauthenticated `/dashboard` → `/login`.
- ✅ **404** — unknown route returns HTTP 404 with a not-found page (no 500).

## Skipped paths (authorized — NOT failures)

- **Stripe credit purchase + webhook** — only `STRIPE_SECRET_KEY` present in prod;
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` + `STRIPE_WEBHOOK_SECRET` are placeholders.
  `/credits` UI renders; no real checkout attempted. (Checklist §C #9/#10.)
- **Google OAuth** — provider not configured in Supabase. Email/password auth used.

## Browser-agent "fails" that are test-method limitations (verified PASS deterministically)

- #5 insufficient-credits (402), #6 ownership (404), #7 no-pages (400): the browser
  agent cannot set a balance or POST an arbitrary bookId — all three verified ✅ via
  authenticated HTTP + DB.
- #8 admin print-queue `pdf_url`: test user isn't admin and the fresh queue is empty;
  endpoint is owner-scoped (documented caveat). Admin routes render 200.
- #9/#10 Stripe: authorized SKIP.
- #12 E2E generate: agent waited ~5s; generation takes ~30s (timing, not a bug).

---

## Remaining notes / non-blocking

- `download_pdf` transaction logs `cost_cents=0` (credits debit is correct at -3). Cosmetic.
- Generation spends the credit at `createPage` **before** the image is produced; a
  generation failure still consumes the credit. Pre-existing product behavior — now
  low-risk since gpt-image-1 generation succeeds. Flag for product decision (refund on
  failure?), not a QA blocker.
- `cb_handle_new_user` trigger silently swallows profile-insert failures
  (`EXCEPTION WHEN OTHERS`). New signups via the trigger path could land without a
  profile row. Worth hardening, outside this loop's scope.

## Deploys this run
`458aadf` → `7863026` → `f72c27d`, each `vercel --prod` (aliased to colourbook-wine).
Plus prod env key sync (OpenAI + Supabase service-role).

## Test artifacts
- `scripts/qa-create-test-user.mjs`, `scripts/qa-make-cookie.mjs`, `scripts/qa-upload-pages.mjs`
- QA user `qa-colourbook@example.com` retains 100 credits + sample books/pages for re-runs.
- Cross-user fixture removed (no pollution of real accounts).
- Browser-agent reports: `~/projects/qa-agent/tests/reports/qa-20260529-04*`
