"""Verify the family-member add flow: open dialog, upload a photo, fill name +
relationship, submit, confirm the member appears."""
import os, sys, time, urllib.parse
os.environ.setdefault("PLAYWRIGHT_BROWSERS_PATH", os.path.expanduser("~/.cache/ms-playwright"))
from playwright.sync_api import sync_playwright

BASE = "https://colourbook-wine.vercel.app"
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

    pg.goto(f"{BASE}/family", wait_until="networkidle", timeout=30000)
    pg.get_by_role("button", name="Add Member").first.click()
    time.sleep(0.6)

    pg.set_input_files("input[type=file]", "/tmp/cb-page1.png")
    time.sleep(0.5)
    # name field (first text input in dialog)
    pg.get_by_role("textbox").first.fill("QA Grandma")
    # relationship Select
    try:
        pg.get_by_role("combobox").first.click()
        time.sleep(0.4)
        pg.get_by_role("option").first.click()
    except Exception as e:
        print("relationship select issue:", e)
    time.sleep(0.3)
    pg.screenshot(path="/tmp/cb-family-1.png")

    # Submit — button likely "Add Member" inside dialog or "Save"
    clicked = False
    for label in ["Add Family Member", "Add Member", "Save", "Create"]:
        try:
            btns = pg.get_by_role("button", name=label)
            if btns.count() > 0:
                btns.last.click()
                clicked = True
                break
        except Exception:
            pass
    print("submit clicked:", clicked)
    time.sleep(4)
    pg.screenshot(path="/tmp/cb-family-2.png", full_page=True)
    body = pg.inner_text("body")
    print("member visible:", "QA Grandma" in body)
    print("page errors:", errs[:3])
    b.close()
