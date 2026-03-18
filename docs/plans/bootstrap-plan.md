# Bootstrap Plan: Colourbook

## Project Spec
- **Name:** colourbook
- **Display Name:** Colourbook
- **One-liner:** AI-powered family coloring book creator — upload photos, generate coloring pages, print beautiful books
- **Platform:** Next.js 15 (App Router)
- **Stack:** TypeScript + Tailwind + shadcn/ui + Supabase + OpenAI DALL-E 3 + Stripe

## Data Model

| Entity | Fields | Relationships | Required |
|--------|--------|---------------|----------|
| profiles | id: uuid (FK auth.users), email: text, full_name: text, avatar_url: text, stripe_customer_id: text, generation_credits: int (default 20), role: enum('user','admin'), created_at: timestamptz, updated_at: timestamptz | has_many family_members, has_many books, has_many orders | id, email |
| family_members | id: uuid, user_id: uuid FK profiles, name: text, relationship: text (e.g. 'mom','dad','daughter','son','grandma','dog'), original_photo_url: text, thumbnail_url: text, created_at: timestamptz | belongs_to profiles, has_many pages | id, user_id, name, original_photo_url |
| books | id: uuid, user_id: uuid FK profiles, title: text, description: text, cover_image_url: text, status: enum('draft','complete','ordered'), page_count: int default 0, created_at: timestamptz, updated_at: timestamptz | belongs_to profiles, has_many book_pages, has_one order | id, user_id, title |
| pages | id: uuid, user_id: uuid FK profiles, family_member_id: uuid FK family_members (nullable), prompt: text, scene_description: text, original_image_url: text (uploaded photo used as reference), coloring_page_url: text (generated B&W line art), thumbnail_url: text, generation_status: enum('pending','generating','complete','failed'), generation_error: text, openai_request_id: text, created_at: timestamptz | belongs_to profiles, belongs_to family_members (optional), has_many book_pages | id, user_id, prompt |
| book_pages | id: uuid, book_id: uuid FK books, page_id: uuid FK pages, page_order: int, created_at: timestamptz | belongs_to books, belongs_to pages | id, book_id, page_id, page_order |
| orders | id: uuid, user_id: uuid FK profiles, book_id: uuid FK books, print_partner_id: uuid FK print_partners, status: enum('pending','paid','processing','printing','shipped','delivered','cancelled'), stripe_payment_intent_id: text, stripe_checkout_session_id: text, amount_cents: int, currency: text default 'cad', shipping_name: text, shipping_address_line1: text, shipping_address_line2: text, shipping_city: text, shipping_province: text, shipping_postal_code: text, shipping_country: text default 'CA', tracking_number: text, estimated_delivery: timestamptz, notes: text, created_at: timestamptz, updated_at: timestamptz | belongs_to profiles, belongs_to books, belongs_to print_partners | id, user_id, book_id, amount_cents |
| print_partners | id: uuid, name: text, contact_email: text, contact_phone: text, website_url: text, region_id: uuid FK regions, address: text, city: text, province: text, postal_code: text, is_active: boolean default true, price_per_book_cents: int, price_per_extra_page_cents: int, shipping_flat_rate_cents: int, turnaround_days: int, created_at: timestamptz | belongs_to regions, has_many orders | id, name, region_id |
| regions | id: uuid, name: text (e.g. 'Southern Ontario'), country: text default 'CA', province: text, is_active: boolean default true, created_at: timestamptz | has_many print_partners | id, name |
| prompt_suggestions | id: uuid, category: text (e.g. 'outdoor','holiday','fantasy','everyday'), prompt_text: text, is_active: boolean default true, sort_order: int, created_at: timestamptz | none | id, prompt_text, category |

## Auth & Roles
- **Auth provider:** Supabase Auth (email/password + Google OAuth)
- **Roles:** user (default), admin
- **Multi-tenant:** No — single app, users see only their own data
- **Protected routes:** /dashboard/*, /books/*, /generate/*, /orders/*, /admin/*
- **Public routes:** /, /login, /signup, /pricing
- **Admin routes:** /admin/* — manage print partners, regions, prompt suggestions, view all orders

## Pages (COMPLETE SPEC)

| Route | Page | Auth | Role | Data Displayed | User Actions | Empty State |
|-------|------|------|------|----------------|--------------|-------------|
| / | Landing | No | - | Hero with sample coloring pages, how it works steps, pricing preview, testimonials, CTA | Sign up, learn more | N/A |
| /login | Login | No | - | Login form | Email/password login, Google OAuth, link to signup | N/A |
| /signup | Signup | No | - | Signup form | Create account, Google OAuth, link to login | N/A |
| /pricing | Pricing | No | - | Free vs paid tiers, print pricing | Select plan, sign up | N/A |
| /dashboard | Dashboard | Yes | user | Recent pages, books in progress, family members, generation credits remaining | Quick generate, view books, upload family member | "Welcome to Colourbook! Start by uploading photos of your family." |
| /family | Family Members | Yes | user | Grid of uploaded family member photos with names/relationships | Upload new, edit name/relationship, delete, view pages | "No family members yet. Upload your first photo!" |
| /generate | Generate Page | Yes | user | Generation form: select family member (optional), enter prompt or pick suggestion, reference photo preview | Generate coloring page, pick from suggestions, upload additional reference | "Choose a family member and describe the scene you'd like!" |
| /gallery | My Pages | Yes | user | Grid of all generated coloring pages with thumbnails | View full size, download PDF, add to book, regenerate, delete | "No pages yet. Generate your first coloring page!" |
| /gallery/[id] | Page Detail | Yes | user | Full coloring page image, prompt used, family member, generation date | Download PDF, add to book, regenerate with tweaks | N/A |
| /books | My Books | Yes | user | List of books with cover, title, page count, status | Create new book, edit, delete draft, view, order print | "No books yet. Create your first coloring book!" |
| /books/[id] | Book Builder | Yes | user | Drag-and-drop page ordering, cover preview, page thumbnails | Reorder pages, add/remove pages, set title/description, preview, order print | "This book is empty. Add pages from your gallery!" |
| /books/[id]/preview | Book Preview | Yes | user | Flipbook-style preview of all pages in order | Go back to edit, proceed to order | N/A |
| /checkout/[bookId] | Checkout | Yes | user | Book summary, shipping form, print partner (auto-selected by region), price breakdown | Enter shipping, pay with Stripe | N/A |
| /orders | My Orders | Yes | user | List of orders with status, tracking, dates | View order detail, track shipment | "No orders yet." |
| /orders/[id] | Order Detail | Yes | user | Full order info: book, status timeline, tracking, shipping address | Track shipment, contact support | N/A |
| /admin | Admin Dashboard | Yes | admin | Order stats, revenue, active print partners, recent orders | Navigate to admin sections | N/A |
| /admin/orders | Admin Orders | Yes | admin | All orders with filters (status, date, region) | Update order status, add tracking number, cancel | "No orders yet." |
| /admin/print-partners | Print Partners | Yes | admin | List of print partners with region, pricing, status | Add, edit, deactivate partner | "No print partners configured." |
| /admin/regions | Regions | Yes | admin | List of regions with partner count | Add, edit, deactivate region | "No regions configured." |
| /admin/prompts | Prompt Suggestions | Yes | admin | List of prompt suggestions by category | Add, edit, reorder, deactivate | "No prompt suggestions yet." |
| /admin/users | Users | Yes | admin | User list with email, join date, generation count, order count | View user detail, adjust credits | "No users yet." |

## Design System (FINALIZED)
- **Style:** Warm storybook / playful illustration aesthetic
- **Palette:**
  - Primary: #E85D75 (warm rose — playful, family-friendly)
  - Primary foreground: #FFFFFF
  - Secondary: #F4A261 (warm amber)
  - Secondary foreground: #1A1A2E
  - Accent: #2EC4B6 (teal — contrast pop)
  - Accent foreground: #FFFFFF
  - Background: #FFF8F0 (warm cream)
  - Card: #FFFFFF
  - Text: #1A1A2E (deep navy)
  - Muted: #F0E6D8 (warm beige)
  - Muted foreground: #6B5B4E
  - Border: #E8DDD0
  - Destructive: #DC2626
  - Ring: #E85D75
- **Typography:**
  - Heading: Fredoka (Google Font) — rounded, playful, family-friendly
  - Body: Nunito (Google Font) — warm, readable, pairs well with Fredoka
- **Effects:**
  - Rounded corners: rounded-2xl on cards, rounded-xl on buttons
  - Soft shadows: shadow-lg with warm tint
  - Subtle paper texture on backgrounds (CSS noise pattern)
  - Staggered fade-in animations on page load
  - Hover: scale(1.02) on cards with transition-transform duration-200
- **Tailwind theme extensions:** Custom colors above, font families, border-radius defaults

## Integrations
- [x] Supabase (project: CCandSS — netbsyvxrhrqxyzqflmd)
- [x] Stripe (checkout sessions for print orders)
- [x] OpenAI DALL-E 3 (photo → coloring page generation)
- [x] Supabase Storage (photo uploads, generated images, PDFs)
- [ ] Resend (order confirmation emails — stretch goal)

## AI Architecture

### Photo → Coloring Page Pipeline
1. **Upload:** User uploads family member photo → stored in Supabase Storage `family-photos` bucket
2. **Prompt Construction:** System builds prompt combining:
   - Physical description extracted from the photo context (user provides name + relationship)
   - User's scene prompt (e.g., "riding a bicycle in the park")
   - System instructions: "Create a black and white coloring book page with clean line art, no shading, thick outlines suitable for children to color. Family-friendly, cheerful scene."
3. **Generation:** Call OpenAI DALL-E 3 API with constructed prompt
   - Model: `dall-e-3`
   - Size: 1024x1024
   - Quality: `hd`
   - Style: `natural`
   - Response format: `url` (then download and store)
4. **Post-processing:** Download generated image → store in Supabase Storage `coloring-pages` bucket
5. **Moderation:** OpenAI content policy handles most issues; add a secondary check flag for admin review if needed

### Prompt Suggestions Engine
- Pre-seeded categories: outdoor, holiday, fantasy, everyday, sports, animals, adventure
- Each suggestion is a template: "{{name}} baking cookies with grandma" where {{name}} is replaced with the selected family member
- Admin can add/edit/reorder suggestions
- App shows 6 random suggestions on the generate page, refreshable

### Generation Credits
- Free tier: 20 generation credits on signup
- Each generation costs 1 credit
- Credits shown in dashboard header
- When credits hit 0: prompt to purchase more (Stripe) or order a book

## Server Actions (per entity)

| Entity | Actions | File |
|--------|---------|------|
| profiles | getProfile, updateProfile | src/lib/actions/profiles.ts |
| family_members | getFamilyMembers, getFamilyMember, createFamilyMember, updateFamilyMember, deleteFamilyMember | src/lib/actions/family-members.ts |
| books | getBooks, getBook, createBook, updateBook, deleteBook | src/lib/actions/books.ts |
| book_pages | getBookPages, addPageToBook, removePageFromBook, reorderBookPages | src/lib/actions/book-pages.ts |
| pages | getPages, getPage, generatePage, deletePage, downloadPagePdf | src/lib/actions/pages.ts |
| orders | getOrders, getOrder, createOrder, updateOrderStatus, getOrdersByStatus | src/lib/actions/orders.ts |
| print_partners | getPrintPartners, getPrintPartner, createPrintPartner, updatePrintPartner | src/lib/actions/print-partners.ts |
| regions | getRegions, getRegion, createRegion, updateRegion | src/lib/actions/regions.ts |
| prompt_suggestions | getPromptSuggestions, getRandomSuggestions, createSuggestion, updateSuggestion, deleteSuggestion | src/lib/actions/prompt-suggestions.ts |
| stripe | createCheckoutSession, handleWebhook | src/lib/actions/stripe.ts |
| openai | generateColoringPage | src/lib/actions/openai.ts |

## File Tree (Planned)
```
colourbook/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              (landing)
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   ├── globals.css
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── pricing/page.tsx
│   │   ├── (protected)/
│   │   │   ├── layout.tsx        (sidebar + header with credits)
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── family/page.tsx
│   │   │   ├── generate/page.tsx
│   │   │   ├── gallery/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── books/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx      (book builder)
│   │   │   │   │   └── preview/page.tsx
│   │   │   ├── checkout/[bookId]/page.tsx
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   └── admin/
│   │   │       ├── page.tsx          (admin dashboard)
│   │   │       ├── orders/page.tsx
│   │   │       ├── print-partners/page.tsx
│   │   │       ├── regions/page.tsx
│   │   │       ├── prompts/page.tsx
│   │   │       └── users/page.tsx
│   │   └── api/
│   │       ├── stripe/webhook/route.ts
│   │       └── generate/route.ts     (async generation endpoint)
│   ├── components/
│   │   ├── ui/                (shadcn)
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── mobile-nav.tsx
│   │   │   └── footer.tsx
│   │   ├── landing/
│   │   │   ├── hero.tsx
│   │   │   ├── how-it-works.tsx
│   │   │   ├── sample-gallery.tsx
│   │   │   └── pricing-preview.tsx
│   │   ├── family/
│   │   │   ├── family-member-card.tsx
│   │   │   ├── upload-photo-dialog.tsx
│   │   │   └── family-member-form.tsx
│   │   ├── generate/
│   │   │   ├── generation-form.tsx
│   │   │   ├── prompt-suggestions.tsx
│   │   │   └── generation-progress.tsx
│   │   ├── gallery/
│   │   │   ├── page-card.tsx
│   │   │   └── page-grid.tsx
│   │   ├── books/
│   │   │   ├── book-card.tsx
│   │   │   ├── book-builder.tsx
│   │   │   ├── page-sorter.tsx
│   │   │   └── book-preview.tsx
│   │   ├── orders/
│   │   │   ├── order-card.tsx
│   │   │   ├── order-timeline.tsx
│   │   │   └── shipping-form.tsx
│   │   └── shared/
│   │       ├── credits-badge.tsx
│   │       ├── empty-state.tsx
│   │       └── loading-skeleton.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   ├── admin.ts
│   │   │   └── middleware.ts
│   │   ├── actions/
│   │   │   ├── profiles.ts
│   │   │   ├── family-members.ts
│   │   │   ├── books.ts
│   │   │   ├── book-pages.ts
│   │   │   ├── pages.ts
│   │   │   ├── orders.ts
│   │   │   ├── print-partners.ts
│   │   │   ├── regions.ts
│   │   │   ├── prompt-suggestions.ts
│   │   │   ├── stripe.ts
│   │   │   └── openai.ts
│   │   ├── openai.ts              (OpenAI client setup)
│   │   ├── stripe.ts              (Stripe client setup)
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── public/
│   └── images/
│       └── sample-coloring-pages/  (for landing page)
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── CLAUDE.md
├── CURRENT_WORK.md
└── CODEBASE_MAP.md
```

## Deployment
- **Target:** Vercel
- **Environment variables needed:**
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
  - OPENAI_API_KEY
  - STRIPE_SECRET_KEY
  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  - STRIPE_WEBHOOK_SECRET
  - NEXT_PUBLIC_APP_URL

## Pricing Model
- **Free tier:** 20 generation credits on signup, download B&W PDFs unlimited
- **Printed book:** ~$29.99 CAD base (set per print partner) + shipping flat rate
- **Extra credits:** purchasable via Stripe (future — not MVP)

## Seed Data
- 2 regions: "Southern Ontario", "Greater Toronto Area"
- 1 print partner per region (sample data)
- 20 prompt suggestions across categories
- Test user: test@colourbook.com / TestPassword123!
- Test admin: admin@colourbook.com / AdminPassword123!

## Status
- [x] Phase 5: Scaffold (e95bd34)
- [x] Phase 5.5: Fresh Session Migration (5d799d5)
- [x] Phase 6: Design Pass (cfa0815)
- [x] Phase 7: Build & Deploy (ee18854, deployed to Vercel)
- [x] Phase 8: Seed Data & Production Testing (cfa0815 — Playwright CLI verified all pages)
- [x] Phase 9: Verify Audit (eb7e9bb — 3 critical, 4 gotcha fixes)
