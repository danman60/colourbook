# Colourbook

AI-powered family coloring book creator. Upload family photos, generate coloring pages with DALL-E 3, order printed books.

## Stack
- Next.js 15 (App Router) + TypeScript + Tailwind v4 + shadcn/ui
- Supabase (CCandSS shared project — netbsyvxrhrqxyzqflmd)
- OpenAI DALL-E 3 for image generation
- Stripe for payment
- Vercel deployment

## Database
All tables prefixed with `cb_` (shared Supabase project).
Tables: cb_profiles, cb_family_members, cb_books, cb_pages, cb_book_pages, cb_orders, cb_print_partners, cb_regions, cb_prompt_suggestions.
Storage buckets: family-photos, coloring-pages.

## Key Patterns
- Supabase clients: src/lib/supabase/{client,server,admin,middleware}.ts
- Server actions: src/lib/actions/*.ts (all with verbose console.log)
- Protected routes: (protected)/ layout checks auth + role
- Admin routes: middleware checks cb_profiles.role = 'admin'
- AI generation: async via /api/generate route, updates page status

## Test Accounts
- User: test@colourbook.com / TestPassword123!
- Admin: admin@colourbook.com / AdminPassword123!

## Design System
- Primary: #E85D75 (warm rose)
- Secondary: #F4A261 (warm amber)
- Accent: #2EC4B6 (teal)
- Background: #FFF8F0 (cream)
- Fonts: Fredoka (headings), Nunito (body)

<!-- GitNexus rules: see master ~/projects/CLAUDE.md → "GitNexus Workflow" section. Per-project index name is the project folder name. -->
