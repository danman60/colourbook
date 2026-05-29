"""Verify the real auth entry points (no cookie injection): login form submit,
logout, and 404 handling."""
import os, time
os.environ.setdefault("PLAYWRIGHT_BROWSERS_PATH", os.path.expanduser("~/.cache/ms-playwright"))
from playwright.sync_api import sync_playwright

BASE = "https://colourbook-wine.vercel.app"
EMAIL = "qa-colourbook@example.com"
PW = "ColourbookQA2026!"

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx = b.new_context()  # fresh, no cookies
    pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))

    # 1. Login form
    pg.goto(f"{BASE}/login", wait_until="networkidle", timeout=30000)
    pg.get_by_role("textbox").nth(0).fill(EMAIL)
    # password input (type=password not a 'textbox' role)
    pg.locator("input[type=password]").first.fill(PW)
    pg.screenshot(path="/tmp/cb-auth-login.png")
    # submit
    for label in ["Sign In", "Log In", "Login", "Sign in", "Continue"]:
        btns = pg.get_by_role("button", name=label)
        if btns.count() > 0:
            btns.first.click(); break
    time.sleep(4)
    after_login = pg.url.replace(BASE, "")
    print("after login url:", after_login)
    login_ok = "/dashboard" in after_login or after_login in ("", "/")
    print("login form works:", login_ok)
    pg.screenshot(path="/tmp/cb-auth-postlogin.png")

    # 2. Logout — open menu / find logout control
    logged_out = False
    try:
        # try a logout button/link
        for sel in ["button[aria-label*=log i]", "text=Sign Out", "text=Log Out", "text=Logout"]:
            loc = pg.locator(sel)
            if loc.count() > 0:
                loc.first.click(); time.sleep(3); break
        # the header had a log-out icon button; try clicking last icon button in header
    except Exception as e:
        print("logout click issue:", e)
    # verify: visiting dashboard should redirect to login when logged out
    pg.goto(f"{BASE}/dashboard", wait_until="networkidle", timeout=20000)
    time.sleep(1)
    after_logout_nav = pg.url.replace(BASE, "")
    logged_out = "/login" in after_logout_nav
    print("dashboard after logout redirects to login:", logged_out, f"({after_logout_nav})")

    # 3. 404 handling (fresh page)
    pg2 = ctx.new_page()
    resp = pg2.goto(f"{BASE}/this-route-does-not-exist-xyz", wait_until="domcontentloaded", timeout=20000)
    body = pg2.inner_text("body").lower()
    print("bogus route status:", resp.status if resp else None, "| has 404/not found text:", ("404" in body or "not found" in body or "n't" in body))

    print("page errors:", errs[:3])
    b.close()
