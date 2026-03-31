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

- No npm, no package.json — keep the project dependency-free
- No frameworks — plain HTML/CSS/JS only
- `.debug/` is gitignored — never commit it
