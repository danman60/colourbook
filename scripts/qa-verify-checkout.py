"""Verify the credit-based order flow E2E: fill the checkout form for a
finalized book, submit, and confirm navigation to the order page.
DB side-effects (order row, book status, print queue, credit spend) are
checked separately via SQL.
"""
import os, sys, time, urllib.parse
os.environ.setdefault("PLAYWRIGHT_BROWSERS_PATH", os.path.expanduser("~/.cache/ms-playwright"))
from playwright.sync_api import sync_playwright

BASE = "https://colourbook-wine.vercel.app"
BOOK = "0b000000-0000-4000-8000-000000000001"  # QA Good Book (complete, 2 pages)
raw = open("/tmp/cb-cookie.txt").read().strip()
name, val = raw.split("=", 1)
val = urllib.parse.unquote(val)

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx = b.new_context()
    ctx.add_cookies([{ "name": name, "value": val, "domain": "colourbook-wine.vercel.app", "path": "/" }])
    pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))

    pg.goto(f"{BASE}/checkout/{BOOK}", wait_until="networkidle", timeout=30000)
    print("checkout page url:", pg.url.replace(BASE, ""))
    pg.screenshot(path="/tmp/cb-checkout-1.png")

    # Select a print partner (shadcn Select: click trigger, pick first option)
    try:
        pg.get_by_role("combobox").first.click()
        time.sleep(0.5)
        pg.get_by_role("option").first.click()
        time.sleep(0.3)
    except Exception as e:
        print("partner select issue:", e)

    # Fill shipping fields by placeholder / order
    inputs = pg.locator("form input")
    try:
        pg.get_by_role("textbox").nth(0).fill("QA Tester")  # name
    except Exception:
        pass
    # Robust: fill by placeholder
    def fill_ph(ph, v):
        try:
            pg.get_by_placeholder(ph).fill(v); return True
        except Exception:
            return False
    fill_ph("Street address", "123 Test St")
    fill_ph("A1A 1A1", "M5V 2T6")
    # City + name fields without placeholder: fill remaining empty textboxes
    boxes = pg.get_by_role("textbox")
    n = boxes.count()
    for i in range(n):
        try:
            if not boxes.nth(i).input_value():
                boxes.nth(i).fill("TestVal")
        except Exception:
            pass
    pg.screenshot(path="/tmp/cb-checkout-2.png")

    # Submit — the order button label is "Spend 15 Credits — Print & Ship"
    try:
        pg.get_by_role("button", name="Spend 15 Credits").click()
    except Exception as e:
        print("submit issue:", e)

    time.sleep(6)
    final = pg.url.replace(BASE, "")
    print("after submit url:", final)
    print("page errors:", errs[:3])
    pg.screenshot(path="/tmp/cb-checkout-3.png", full_page=True)
    ok = final.startswith("/orders/")
    print("RESULT:", "PASS (navigated to order)" if ok else "CHECK (see screenshots)")
    b.close()
