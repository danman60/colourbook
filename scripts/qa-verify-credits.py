"""Verify /credits renders 4 packs and that clicking Buy degrades gracefully
when Stripe is not configured (placeholder keys) — toast, not a crash."""
import os, time, urllib.parse
os.environ.setdefault("PLAYWRIGHT_BROWSERS_PATH", os.path.expanduser("~/.cache/ms-playwright"))
from playwright.sync_api import sync_playwright

BASE = "https://colourbook-wine.vercel.app"
raw = open("/tmp/cb-cookie.txt").read().strip()
name, val = raw.split("=", 1); val = urllib.parse.unquote(val)

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx = b.new_context()
    ctx.add_cookies([{ "name": name, "value": val, "domain": "colourbook-wine.vercel.app", "path": "/" }])
    pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(f"{BASE}/credits", wait_until="networkidle", timeout=30000)
    body = pg.inner_text("body")
    packs = [n for n in ["Starter", "Popular", "Pro", "Family"] if n in body]
    print("packs rendered:", packs)
    # Click first Buy/Purchase button
    clicked = False
    for label in ["Buy", "Purchase", "Get", "Buy Now", "Select"]:
        btns = pg.get_by_role("button", name=label)
        if btns.count() > 0:
            btns.first.click(); clicked = True; print("clicked:", label); break
    time.sleep(4)
    print("url after click:", pg.url.replace(BASE, ""))
    # page still alive? heading present
    alive = "Credits" in pg.inner_text("body") or "credit" in pg.inner_text("body").lower()
    print("page still rendered (no crash):", alive)
    print("page errors:", errs[:3])
    pg.screenshot(path="/tmp/cb-credits.png", full_page=True)
    b.close()
