import os, time, urllib.parse
os.environ.setdefault("PLAYWRIGHT_BROWSERS_PATH", os.path.expanduser("~/.cache/ms-playwright"))
from playwright.sync_api import sync_playwright

BASE = "https://colourbook-wine.vercel.app"
raw = open("/tmp/cb-cookie.txt").read().strip()
name, val = raw.split("=", 1); val = urllib.parse.unquote(val)
ROUTES = ["/login", "/dashboard", "/generate", "/books", "/credits", "/family"]

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx = b.new_context(viewport={"width":375,"height":812}, device_scale_factor=2,
                        user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15")
    ctx.add_cookies([{ "name": name, "value": val, "domain": "colourbook-wine.vercel.app", "path": "/" }])
    for r in ROUTES:
        pg = ctx.new_page()
        try:
            pg.goto(f"{BASE}{r}", wait_until="networkidle", timeout=30000)
        except Exception as e:
            print(r, "NAV ERR", e)
        time.sleep(1.5)
        # check for horizontal overflow (common mobile bug)
        ow = pg.evaluate("() => ({sw: document.documentElement.scrollWidth, iw: window.innerWidth})")
        overflow = ow["sw"] > ow["iw"] + 2
        slug = r.strip("/").replace("/","_") or "root"
        pg.screenshot(path=f"/tmp/cb-m-{slug}.png", full_page=True)
        print(f"{r:<14} scrollW={ow['sw']} innerW={ow['iw']} {'H-OVERFLOW' if overflow else 'ok'}")
        pg.close()
    b.close()
