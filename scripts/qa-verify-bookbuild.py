"""Verify book build via UI: create a book, open it, add a completed page."""
import os, time, urllib.parse, re
os.environ.setdefault("PLAYWRIGHT_BROWSERS_PATH", os.path.expanduser("~/.cache/ms-playwright"))
from playwright.sync_api import sync_playwright

BASE = "https://colourbook-wine.vercel.app"
raw = open("/tmp/cb-cookie.txt").read().strip()
name, val = raw.split("=", 1); val = urllib.parse.unquote(val)
TITLE = "QA Build Book"

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx = b.new_context()
    ctx.add_cookies([{ "name": name, "value": val, "domain": "colourbook-wine.vercel.app", "path": "/" }])
    pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))

    pg.goto(f"{BASE}/books", wait_until="networkidle", timeout=30000)
    pg.get_by_role("button", name="New Book").first.click()
    time.sleep(0.6)
    pg.get_by_placeholder("e.g. The Smith Family Colouring Book").fill(TITLE)
    pg.get_by_role("button", name="Create Book").click()
    time.sleep(3)
    body = pg.inner_text("body")
    print("book created (title visible on /books):", TITLE in body)

    # Open the book (click its card/link)
    try:
        pg.get_by_text(TITLE, exact=False).first.click()
        time.sleep(2)
    except Exception as e:
        print("open book issue:", e)
    print("on book detail:", re.search(r"/books/[0-9a-f-]{36}", pg.url) is not None, pg.url.replace(BASE, ""))

    # Add a page
    try:
        pg.get_by_role("button", name="Add Pages").first.click()
        time.sleep(1)
        # click first page card in the dialog
        pg.locator(".cursor-pointer").filter(has=pg.locator("img")).first.click()
        time.sleep(2.5)
    except Exception as e:
        print("add page issue:", e)
    pg.screenshot(path="/tmp/cb-bookbuild.png", full_page=True)
    body2 = pg.inner_text("body")
    # after adding, Order Print button should appear (only shows when bookPages>0)
    print("Order Print button present (page added):", "Order Print" in body2)
    print("page errors:", errs[:3])
    b.close()
