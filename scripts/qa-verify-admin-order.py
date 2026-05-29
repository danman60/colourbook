"""Verify admin order fulfillment: open admin/orders, change an order's status to
shipped with a tracking number, save."""
import os, time, urllib.parse
os.environ.setdefault("PLAYWRIGHT_BROWSERS_PATH", os.path.expanduser("~/.cache/ms-playwright"))
from playwright.sync_api import sync_playwright

BASE = "https://colourbook-wine.vercel.app"
raw = open("/tmp/cb-cookie.txt").read().strip()
name, val = raw.split("=", 1); val = urllib.parse.unquote(val)

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx = b.new_context(viewport={"width":1280,"height":900})
    ctx.add_cookies([{ "name": name, "value": val, "domain": "colourbook-wine.vercel.app", "path": "/" }])
    pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(f"{BASE}/admin/orders", wait_until="networkidle", timeout=30000)
    print("on admin orders:", "/admin/orders" in pg.url, "(url:", pg.url.replace(BASE,""), ")")
    time.sleep(1)
    # click the first order card to open the dialog
    try:
        pg.locator("text=Admin Test").first.click()
        time.sleep(1)
    except Exception as e:
        print("open order issue:", e)
    pg.screenshot(path="/tmp/cb-admin-order-1.png")
    # set status -> shipped (a Select in the dialog) + tracking input
    try:
        pg.get_by_role("combobox").last.click(); time.sleep(0.4)
        opt = pg.get_by_role("option", name="shipped")
        (opt.first if opt.count() else pg.get_by_role("option").first).click()
        time.sleep(0.3)
    except Exception as e:
        print("status select issue:", e)
    try:
        # tracking input (placeholder likely 'Tracking' something)
        ti = pg.locator("input")
        # fill the last visible text input in the dialog
        for i in range(ti.count()-1, -1, -1):
            try:
                if ti.nth(i).is_visible(): ti.nth(i).fill("TRACK123XYZ"); break
            except Exception: pass
    except Exception as e:
        print("tracking fill issue:", e)
    # save
    for label in ["Update", "Save", "Update Status", "Update Order"]:
        bn = pg.get_by_role("button", name=label)
        if bn.count() > 0: bn.first.click(); print("clicked:", label); break
    time.sleep(3)
    pg.screenshot(path="/tmp/cb-admin-order-2.png", full_page=True)
    print("page errors:", errs[:3])
    b.close()
