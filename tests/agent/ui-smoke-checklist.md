# Colourbook — UI Smoke (browser-executable)

Phrased as concrete UI actions a browser agent (QA agent) can perform. Unlike the
PDF/credits checklist (which tests HTTP-level gating an LLM can't drive), every step
here is a click/fill/observe on a real page. Use the QA test account.

Generation uses gpt-image-1 and takes ~20-40s — allow generous waits.

## 1. Auth
- [ ] Open `/login`. Fill the email and password fields, click "Sign In". Land on
      the dashboard (heading "Hey …").
- [ ] Dashboard shows four stat cards (Family Members, Pages Generated, Books
      Created, Orders) and three action cards (Upload Family Photos, Generate a Page,
      Build a Book). No error page.

## 2. Generate a page
- [ ] Click "Generate a Page" (or nav "Generate"). On `/generate`, type a prompt in
      the "Describe the scene" textarea, e.g. "a puppy playing in autumn leaves".
- [ ] Click "Generate Coloring Page". You navigate to a gallery detail page showing
      a "being generated" card.
- [ ] **Wait up to 60s.** The page auto-refreshes; a black-and-white coloring image
      appears and a "Download" button shows. (Key check — must not stay "generating".)
- [ ] The credit count (top-left badge / generate banner) decreased by 1.

## 3. Gallery
- [ ] Nav "Gallery". The generated page appears as a thumbnail. Click it → detail
      page shows the full image + prompt + status "Complete".

## 4. Family
- [ ] Nav "Family". Click "Add Member". In the dialog, choose a photo file, type a
      name, pick a relationship, submit. The new member appears in the list.

## 5. Build a book
- [ ] Nav "Books". Click "New Book", enter a title, click "Create Book". The book
      appears.
- [ ] Open the book. Click "Add Pages", click a completed page in the dialog. The
      page is added; an "Order Print" button appears.

## 6. Order (credit checkout)
- [ ] From the book (or its checkout), open `Order Print`. On the checkout page,
      pick a Print Partner, fill the shipping fields, click "Spend 15 Credits — Print
      & Ship". Land on an Order Details page with status "Paid".

## 7. Credits page
- [ ] Nav "Credits". Four packs render (Starter, Popular, Pro, Family) with prices.
      (Do NOT complete a purchase — Stripe is not configured; clicking Buy should
      show a graceful error toast, not crash.)

## 8. Logout
- [ ] Click the logout icon (sidebar footer / header). You return to login;
      revisiting `/dashboard` redirects to `/login`.

## Notes for the runner
- Login may use token-injection fallback; that's fine.
- If a step's element isn't found, scroll and retry — don't fail on first miss.
- Generation costs a real credit + OpenAI call; one generate per run is enough.
