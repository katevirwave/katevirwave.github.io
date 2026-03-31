# Visual QA System

Headless browser screenshot capture for agent-driven visual QA.
Works with both Claude Code and GitHub Copilot agents.

## Quick Start

```bash
# Capture homepage at all viewports (desktop, tablet, mobile):
bash scripts/capture-screenshot.sh --all-viewports

# Capture at desktop only (default):
bash scripts/capture-screenshot.sh

# Capture at mobile viewport:
bash scripts/capture-screenshot.sh --width 375 --height 812

# Clean up old screenshots:
bash scripts/capture-screenshot.sh --cleanup
```

## How It Works

1. Starts a local Python HTTP server if one isn't already running (port 8000)
2. Installs Puppeteer to `.debug/` on first run (not a permanent project dependency)
3. Launches headless Chrome and captures the page
4. Downscales to max 800px wide JPEG via macOS `sips` (~50% quality)
5. Raw PNGs are deleted; only the review JPEG is kept in `.debug/screenshots/`

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--url <path>` | `/` | URL path to capture |
| `--width <px>` | `1440` | Viewport width |
| `--height <px>` | `900` | Viewport height |
| `--output <name>` | auto | Output filename |
| `--port <port>` | `8000` | Local dev server port |
| `--all-viewports` | false | Capture desktop (1440x900), tablet (768x1024), mobile (375x812) |
| `--settle <ms>` | `2000` | Wait after load for animations to settle |
| `--full-page` | false | Capture full scrollable page |
| `--cleanup` | — | Remove all screenshots |

## Agent Workflows

### Verify a UI Change

```bash
bash scripts/capture-screenshot.sh --cleanup
bash scripts/capture-screenshot.sh --all-viewports
```

View the `.review.jpg` files in `.debug/screenshots/` with `view_image`.

### Before/After Comparison

```bash
# Before
bash scripts/capture-screenshot.sh --output before.png

# Make changes

# After
bash scripts/capture-screenshot.sh --output after.png
```

### Full-Page Capture

```bash
bash scripts/capture-screenshot.sh --full-page
```

## Storage

| Purpose | Path | Git status |
|---------|------|-----------|
| Review screenshots | `.debug/screenshots/*.review.jpg` | Gitignored |
| Puppeteer cache | `.debug/.puppeteer-cache/` | Gitignored |
| Puppeteer modules | `.debug/node_modules/` | Gitignored |

The entire `.debug/` directory is gitignored. Nothing affects the project's zero-dependency status.

## Output Format

```json
{
  "success": true,
  "screenshots": [
    {
      "path": "/path/to/.debug/screenshots/home-desktop-2026-04-01T10-30-00.review.jpg",
      "sizeKB": 142,
      "viewport": "1440x900"
    }
  ],
  "screenshotDir": "/path/to/.debug/screenshots"
}
```
