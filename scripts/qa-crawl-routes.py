"""Authenticated route crawl: visit every app route, capture console errors,
page (uncaught) errors, HTTP status, and a screenshot. Surfaces render/500 bugs.
"""
import os, sys, time, urllib.parse
os.environ.setdefault("PLAYWRIGHT_BROWSERS_PATH", os.path.expanduser("~/.cache/ms-playwright"))
from playwright.sync_api import sync_playwright

BASE = "https://colourbook-wine.vercel.app"
raw = open("/tmp/cb-cookie.txt").read().strip()
name, val = raw.split("=", 1)
val = urllib.parse.unquote(val)

ROUTES = [
    "/dashboard", "/family", "/generate", "/gallery", "/books",
    "/credits", "/orders", "/pricing",
]
# admin routes only meaningful when role=admin; included to confirm gate/redirect
ADMIN = ["/admin", "/admin/print-queue", "/admin/profitability", "/admin/orders", "/admin/users"]

results = []
with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx = b.new_context()
    ctx.add_cookies([{ "name": name, "value": val, "domain": "colourbook-wine.vercel.app", "path": "/" }])

    for route in ROUTES + ADMIN:
        pg = ctx.new_page()
        cerrs, perrs = [], []
        pg.on("console", lambda m: cerrs.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: perrs.append(str(e)))
        status = None
        try:
            resp = pg.goto(f"{BASE}{route}", wait_until="networkidle", timeout=30000)
            status = resp.status if resp else None
        except Exception as e:
            perrs.append(f"NAV: {e}")
        time.sleep(1.5)
        final = pg.url.replace(BASE, "")
        slug = route.strip("/").replace("/", "_") or "root"
        pg.screenshot(path=f"/tmp/cb-crawl-{slug}.png")
        # filter noisy non-error console lines
        cerrs = [c for c in cerrs if "favicon" not in c.lower()][:4]
        results.append((route, status, final, cerrs, perrs))
        pg.close()
    b.close()

print(f"{'ROUTE':<24}{'HTTP':<6}{'FINAL':<22}ERRORS")
bad = 0
for route, status, final, cerrs, perrs in results:
    errs = perrs + cerrs
    flag = "" if not errs else "  <<<"
    if errs and not (route.startswith("/admin") and final.startswith("/dashboard")):
        bad += 1
    print(f"{route:<24}{str(status):<6}{final:<22}{(' | '.join(errs))[:80]}{flag}")
print("\nROUTES WITH ERRORS:", bad)
sys.exit(0)
