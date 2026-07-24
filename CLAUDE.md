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

## Kate's voice rules (apply to ALL copy on the site)

Kate reviewed the copy and gave two hard rules. Follow them in every note, heading, caption, and microcopy you write:

- **No em dashes (—).** Use a period, comma, or colon instead. She finds em-dash-everywhere an obvious AI tell.
- **No "X, not Y" negation-as-definition** (e.g. "an actress I follow, not just a face", "made, not watched"). State it in the positive. Simple negation inside a sentence is fine; the "it's this, not that" definitional construction is not.
- Keep her actual words verbatim. Short, declarative lines. When unsure, write plainer, not fancier.
