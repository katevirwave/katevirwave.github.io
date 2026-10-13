# Kate Julia Website — Agent Instructions

## What This Is

Static HTML personal/professional website. No build step, no npm, no framework.
Edit `index.html`, `styles.css`, and `script.js` directly.

## Development

```bash
python3 -m http.server 8000   # serves at http://localhost:8000
```

## Visual QA (Puppeteer)

Zero-dependency screenshot capture. No npm in the project — Puppeteer installs to `.debug/` on first run.

```bash
# Capture homepage at all viewports (desktop, tablet, mobile):
bash scripts/capture-screenshot.sh --all-viewports

# Capture desktop only:
bash scripts/capture-screenshot.sh

# Before/after a change:
bash scripts/capture-screenshot.sh --output before.png
# ... make changes ...
bash scripts/capture-screenshot.sh --output after.png

# Clean up:
bash scripts/capture-screenshot.sh --cleanup
```

Screenshots land in `.debug/screenshots/` as `.review.jpg` files (800px wide, JPEG).
Use `view_image` to inspect them. The `.debug/` directory is gitignored.

See `scripts/VISUAL_QA.md` for full options and agent workflows.

## Constraints

- No npm, no package.json. Keep the project dependency-free (exception: the K-drama page `kdrama.html` uses Leaflet + map tiles for its Locations map, a deliberate, approved choice).
- No frameworks. Plain HTML/CSS/JS only.
- `.debug/` is gitignored. Never commit it.

## K-drama page (`kdrama.html`): required for every change

- **Every new show needs a poster.** When you add an entry to `shows`, also add its TMDB poster path to `POSTERS` (same exact title as the key). Find it on themoviedb.org: search the English title, or the Korean `kr` title if the English one is ambiguous, confirm the year matches, and use the poster file path (e.g. `"/abc123.jpg"`). Missing posters show up as blank tiles on the timeline.
- **Map tiles come from OpenStreetMap** (`tile.openstreetmap.org`, no key needed). CARTO's free tiles stopped working in Oct 2026 (they now need an API key). Don't switch to a provider that needs a key.
- **Run the health check before you finish:**
  ```bash
  pip install playwright pillow && python -m playwright install chromium   # first time only
  python3 scripts/check_kdrama.py
  ```
  It must end with "All good." It also runs automatically every Monday and on every push to main that touches `kdrama.html` (`.github/workflows/kdrama-check.yml`), and opens a GitHub issue if anything breaks.

## Kate's voice rules (apply to ALL copy on the site)

Kate reviewed the copy and gave two hard rules. Follow them in every note, heading, caption, and microcopy you write:

- **No em dashes (—).** Use a period, comma, or colon instead. She finds em-dash-everywhere an obvious AI tell.
- **No "X, not Y" negation-as-definition** (e.g. "an actress I follow, not just a face", "made, not watched"). State it in the positive. Simple negation inside a sentence is fine; the "it's this, not that" definitional construction is not.
- Keep her actual words verbatim. Short, declarative lines. When unsure, write plainer, not fancier.
