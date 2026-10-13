#!/usr/bin/env python3
"""Health check for kdrama.html. Exits 1 if anything is broken.

Checks:
  1. Every show (and every map pin's drama) has a TMDB poster entry.
  2. Every poster URL actually returns an image.
  3. The map tile provider is serving a real map (catches "API KEY REQUIRED"
     or "access blocked" placeholder tiles, which still load as images).
  4. In a real browser: no JavaScript errors, no blank timeline tiles,
     map tiles load on the Locations tab.

Runs weekly and on every change to kdrama.html via .github/workflows/kdrama-check.yml.
Run locally:  pip install playwright pillow && python -m playwright install chromium
              python3 scripts/check_kdrama.py
"""
import io, math, os, re, sys, time, threading, http.server, functools, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = os.path.join(ROOT, "kdrama.html")
UA = "katejulia.com-kdrama-healthcheck/1.0 (+https://katejulia.com)"
IMG_BASE = "https://image.tmdb.org/t/p/w185"

# OpenStreetMap's standard water colour. If the map provider is ever changed,
# update this to a colour that appears on the new provider's sea tiles.
WATER_RGB = (170, 211, 223)

problems = []


def fail(msg):
    problems.append(msg)
    print("FAIL:", msg)


def fetch(url, tries=3):
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.status, r.headers.get("Content-Type", ""), r.read()
        except Exception:
            if attempt == tries - 1:
                raise
            time.sleep(3)


src = open(PAGE, encoding="utf-8").read()

# 1. Every show and every map pin has a poster entry ---------------------------
i = src.index("const POSTERS = {")
posters = dict(re.findall(r'"([^"]+)"\s*:\s*"([^"]*)"', src[i:src.index("};", i)]))
shows = re.findall(r'\{t:"([^"]+)",where:', src)
pins = set(re.findall(r'\{drama:"([^"]+)"', src))
if len(shows) < 5:
    fail(f"only found {len(shows)} shows; the check's parser may need updating")
for t in shows:
    if not posters.get(t):
        fail(f'no poster for show "{t}" (add it to POSTERS)')
for d in sorted(pins):
    if d not in shows:
        continue
    if not posters.get(d):
        fail(f'map pin drama "{d}" has no poster')
print(f"{len(shows)} shows, {len(posters)} poster entries")

# 2. Every poster URL returns an image -----------------------------------------
for title, path in sorted(posters.items()):
    if title not in shows:
        continue
    try:
        st, ct, body = fetch(IMG_BASE + path)
        if st != 200 or not ct.startswith("image/") or len(body) < 2000:
            fail(f'poster for "{title}" returned {st} {ct} ({len(body)} bytes)')
    except Exception as e:
        fail(f'poster for "{title}" did not load: {e}')

# 3. Map tiles are a real map, not a placeholder -------------------------------
m = re.search(r"L\.tileLayer\('([^']+)'", src)
if not m:
    fail("could not find the map tile URL in kdrama.html")
else:
    tmpl = m.group(1)
    z, lat, lng = 6, 36.0, 129.5  # Korea's east coast: land and sea in one tile
    n = 2 ** z
    x = int((lng + 180) / 360 * n)
    y = int((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n)
    url = (tmpl.replace("{s}", "a").replace("{z}", str(z)).replace("{x}", str(x))
               .replace("{y}", str(y)).replace("{r}", ""))
    try:
        st, ct, body = fetch(url)
        if st != 200 or not ct.startswith("image/"):
            fail(f"map tile returned {st} {ct}: {url}")
        else:
            from PIL import Image
            im = Image.open(io.BytesIO(body)).convert("RGB").resize((64, 64))
            raw = im.tobytes()
            px = [raw[k:k + 3] for k in range(0, len(raw), 3)]
            water = sum(1 for p in px if all(abs(p[k] - WATER_RGB[k]) <= 8 for k in range(3)))
            if water / len(px) < 0.05:
                fail("map tiles don't look like a real map (provider may now need a key "
                     f"or be blocking requests): {url}")
            else:
                print(f"map tile OK ({water * 100 // len(px)}% water)")
    except Exception as e:
        fail(f"map tile check failed: {e}")

# 4. Real browser: JS errors, blank timeline tiles, map loads ------------------
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass
handler = functools.partial(Quiet, directory=ROOT)
srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
threading.Thread(target=srv.serve_forever, daemon=True).start()
port = srv.server_address[1]
try:
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        kw = {}
        if os.environ.get("CHROMIUM_PATH"):
            kw = {"executable_path": os.environ["CHROMIUM_PATH"], "args": ["--headless=new"],
                  "ignore_default_args": ["--headless=old"]}
        b = p.chromium.launch(**kw)
        pg = b.new_page(viewport={"width": 1280, "height": 900})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(f"http://127.0.0.1:{port}/kdrama.html", wait_until="networkidle", timeout=60000)
        pg.locator("#tlTrack").scroll_into_view_if_needed()
        pg.wait_for_timeout(4000)
        blank = pg.evaluate("""() => [...document.querySelectorAll('.tl-poster')].filter(e => {
            const i = e.querySelector('img'); return !i || (i.complete && i.naturalWidth === 0);
        }).map(e => e.title)""")
        for t in blank:
            fail(f"timeline tile has no poster image: {t}")
        pg.click('.tab[data-tab="locations"]')
        pg.wait_for_timeout(5000)
        tiles = pg.evaluate("document.querySelectorAll('#locMap img.leaflet-tile-loaded').length")
        if tiles == 0:
            fail("map shows no loaded tiles in the browser")
        for e in errs:
            fail(f"JavaScript error on the page: {e}")
        print(f"browser: {len(blank)} blank tiles, {tiles} map tiles, {len(errs)} JS errors")
        b.close()
except Exception as e:
    fail(f"browser check could not run: {e}")
finally:
    srv.shutdown()

if problems:
    print(f"\n{len(problems)} problem(s) found.")
    sys.exit(1)
print("\nAll good.")
