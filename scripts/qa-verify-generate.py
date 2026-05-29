"""One-off verification of the real /generate UI flow on prod.
Injects the QA session cookie, fills the prompt, clicks Generate, and confirms
the browser fires POST /api/generate and the gallery detail page shows an image.
"""
import os, sys, time, urllib.parse
os.environ.setdefault("PLAYWRIGHT_BROWSERS_PATH", os.path.expanduser("~/.cache/ms-playwright"))
from playwright.sync_api import sync_playwright

BASE = "https://colourbook-wine.vercel.app"
raw = open("/tmp/cb-cookie.txt").read().strip()
name, val = raw.split("=", 1)
val = urllib.parse.unquote(val)

gen_calls = []
with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx = b.new_context()
    ctx.add_cookies([{ "name": name, "value": val, "domain": "colourbook-wine.vercel.app", "path": "/" }])
    pg = ctx.new_page()
    pg.on("request", lambda r: gen_calls.append((r.method, r.url)) if "/api/generate" in r.url else None)

    pg.goto(f"{BASE}/generate", wait_until="domcontentloaded")
    pg.wait_for_selector("#prompt", timeout=20000)
    print("OK: /generate rendered the prompt textarea")

    pg.fill("#prompt", "a friendly robot watering flowers in a garden")
    pg.get_by_role("button", name="Generate Coloring Page").click()
    print("OK: clicked Generate")

    # Wait for the browser to fire POST /api/generate
    for _ in range(20):
        if any(m == "POST" for m, _ in gen_calls):
            break
        time.sleep(0.5)
    posted = [u for m, u in gen_calls if m == "POST"]
    print("POST /api/generate fired:", bool(posted), posted[:1])

    # Should have navigated to the gallery detail page
    time.sleep(2)
    print("URL after submit:", pg.url)

    # Wait up to 70s for the image to appear (auto-refresh)
    got_img = False
    for i in range(35):
        try:
            if pg.locator("img[alt]").count() > 0 and pg.locator("img").first.get_attribute("src", timeout=2000):
                src = pg.locator("img").first.get_attribute("src")
                if src and "coloring-pages" in src:
                    got_img = True
                    print("OK: coloring image rendered:", src[:70])
                    break
        except Exception:
            pass
        time.sleep(2)
    pg.screenshot(path="/tmp/cb-gen-verify.png", full_page=True)
    if not got_img:
        print("WARN: image not detected within wait window (see screenshot)")
    b.close()

print("RESULT:", "PASS" if (posted and got_img) else "PARTIAL")
sys.exit(0 if (posted and got_img) else 1)
