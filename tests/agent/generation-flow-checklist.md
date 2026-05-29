# Colourbook — Core Generation Flow (real browser)

Exercises the actual UI page-generation pipeline end to end. The app triggers
DALL-E/gpt-image-1 generation from the browser, then the gallery detail page
auto-refreshes until the image is ready.

## A. Generate a coloring page
- [ ] Navigate to `/generate`. The page loads with a prompt textbox and a
      "Generate Coloring Page" button; a credits banner shows a credit count.
- [ ] Type a prompt into the "Describe the scene" textbox, e.g.
      "a friendly dinosaur reading a book under a tree".
- [ ] Click "Generate Coloring Page". The app navigates to a gallery detail
      page (`/gallery/<id>`) showing a "being generated" / pending card.
- [ ] **Wait up to 60 seconds.** The page auto-refreshes and the generated
      black-and-white coloring image appears (an `<img>` is shown). Status
      becomes complete and a Download button appears. This is the key check:
      the image must actually render, not stay stuck on "being generated".

## B. Credit reflects the spend
- [ ] After generating, returning to `/generate` (or `/dashboard`) shows the
      credit count decreased by 1 versus before the generation.

## Notes
- Generation takes ~20-40s (gpt-image-1). Allow generous waits before failing.
- Endpoint: browser POSTs `/api/generate` with `{pageId}`; it carries the
  session cookie automatically.
