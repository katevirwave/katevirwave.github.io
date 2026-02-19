# website

## Run locally (development)

This is a static site, so you can run it with a simple local HTTP server.

### Option 1: Python (recommended)

From the project root:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

### Option 2: If you use the project virtual environment

```bash
source .venv/bin/activate
python -m http.server 8000
```

## Stop the server

Press `Ctrl + C` in the terminal where the server is running.