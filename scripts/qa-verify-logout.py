"""Verify logout clears the session (sidebar logout button)."""
import os, time, urllib.parse
os.environ.setdefault("PLAYWRIGHT_BROWSERS_PATH", os.path.expanduser("~/.cache/ms-playwright"))
from playwright.sync_api import sync_playwright

BASE = "https://colourbook-wine.vercel.app"
raw = open("/tmp/cb-cookie.txt").read().strip()
name, val = raw.split("=", 1); val = urllib.parse.unquote(val)

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx = b.new_context(viewport={"width":1280,"height":800})
    ctx.add_cookies([{ "name": name, "value": val, "domain": "colourbook-wine.vercel.app", "path": "/" }])
    pg = ctx.new_page()
    pg.goto(f"{BASE}/dashboard", wait_until="networkidle", timeout=30000)
    # sidebar footer logout = the icon button near the email; click the last
    # ghost icon button in the sidebar (aside)
    btns = pg.locator("aside button")
    n = btns.count()
    clicked = False
    if n:
        btns.nth(n-1).click(); clicked = True
    print("logout clicked:", clicked)
    time.sleep(3)
    print("url after logout:", pg.url.replace(BASE, ""))
    # confirm session cleared: visit dashboard → should redirect to login
    pg.goto(f"{BASE}/dashboard", wait_until="networkidle", timeout=20000)
    time.sleep(1)
    final = pg.url.replace(BASE, "")
    print("dashboard after logout:", final, "=>", "CLEARED" if "/login" in final else "STILL AUTHED")
    b.close()
