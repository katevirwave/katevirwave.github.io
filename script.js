// script.js
// Local-only signup handler (GitHub Pages friendly)
// - validates fields
// - stores to localStorage
// - prevents duplicates by email
// - shows status + basic error handling
// - safe if script loads before DOM (waits for DOMContentLoaded)

(() => {
  const STORAGE_KEY = "katejulia_signups_v1";

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const readSignups = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeSignups = (arr) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  };

  const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

  const setStatus = (el, msg, type = "info") => {
    if (!el) return;
    el.textContent = msg;
    el.dataset.type = type; // optional styling hook in CSS
  };

  const init = () => {
    const form = document.getElementById("signupForm");
    const statusEl = document.getElementById("formStatus");
    if (!form || !statusEl) return;

    // Ensure initial state
    setStatus(statusEl, "", "info");

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const fd = new FormData(form);
        const name = String(fd.get("name") || "").trim();
        const emailRaw = String(fd.get("email") || "");
        const email = normalizeEmail(emailRaw);
        const interest = String(fd.get("interest") || "events").trim();

        if (!name) {
          setStatus(statusEl, "Please add your name.", "error");
          return;
        }
        if (!isValidEmail(email)) {
          setStatus(statusEl, "Please enter a valid email.", "error");
          return;
        }

        const existing = readSignups();
        const already = existing.some((r) => normalizeEmail(r.email) === email);

        if (already) {
          setStatus(statusEl, "You’re already on the list.", "info");
          return;
        }

        const record = {
          name,
          email,
          interest,
          created_at: new Date().toISOString(),
          source: "katejulia.com",
        };

        existing.push(record);
        writeSignups(existing);

        form.reset();
        setStatus(statusEl, "You’re in. I’ll send updates for upcoming events.", "success");
      } catch (err) {
        console.error(err);
        setStatus(statusEl, "Something went wrong. Please try again.", "error");
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });

    // Optional: expose a tiny debug helper in dev
    // window.kateJuliaSignups = { readSignups };
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/* -------------------------------------------------------------- */
/* Signature animation                                            */
/* Two phases:                                                    */
/*   1. Logos pop in one-by-one at fixed positions along a        */
/*      cursive-shaped path — together they form the Kate Julia   */
/*      shape.                                                    */
/*   2. After the last logo lands, the handwritten "Kate Julia"   */
/*      is drawn (stroke animates in), then inks in solid.        */
/* -------------------------------------------------------------- */
(() => {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const VIEW_W = 1000;
  const VIEW_H = 420;

  // Two bands:
  //   • upper band (y ≈ 30–180) — logos arranged along a gentle wave
  //   • lower band (y ≈ 240–360) — the handwritten signature
  // Keeping them visually separate prevents the letters reading through
  // the logos.
  const TRAIL_D =
    "M 40 120 " +
    "Q 160 50 280 110 " +
    "S 500 160 620 90 " +
    "S 860 30 970 130";

  // Logos — add / reorder / swap freely. `end` is fraction along the
  // trail (0–1) where that chip sits.
  const CHIPS = [
    { src: "./assets/logos/ucl.png",          end: 0.04, alt: "UCL" },
    { src: "./assets/logos/hatchery.png",     end: 0.15, alt: "UCL Hatchery" },
    { src: "./assets/logos/ucltedx.png",      end: 0.26, alt: "UCL TEDx" },
    { src: "./assets/logos/deloitte.png",     end: 0.37, alt: "Deloitte" },
    { src: "./assets/logos/kpmg.png",         end: 0.48, alt: "KPMG" },
    { src: "./assets/logos/a4.png",           end: 0.59, alt: "A4 Safety Alliance" },
    { src: "./assets/logos/fundamentally.png",end: 0.72, alt: "Fundamentally Children" },
    { src: "./assets/logos/kididing.jpeg",    end: 0.84, alt: "Kidding Around Yoga" },
    { src: "./assets/logos/claude.png",       end: 0.96, alt: "Claude" },
  ];

  // Chip box size. preserveAspectRatio="xMidYMid meet" fits any logo.
  const CHIP_W = 96;
  const CHIP_H = 36;
  const PAD = 5;

  // Timing (seconds)
  const CHIP_DUR   = 0.55;  // per-chip pop-in
  const CHIP_STEP  = 0.22;  // stagger between chips
  const START_AT   = 0.10;  // initial pause

  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const mk = (name, attrs = {}) => {
    const el = document.createElementNS(SVG_NS, name);
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, v);
    }
    return el;
  };

  const build = () => {
    const stage = document.querySelector("[data-signature]");
    if (!stage) return;

    const svg = mk("svg", {
      class: "signature-svg",
      viewBox: `0 0 ${VIEW_W} ${VIEW_H}`,
      preserveAspectRatio: "xMidYMid meet",
      role: "img",
      "aria-label":
        "Nine logos of past work, arranged in the shape of Kate Julia's cursive signature.",
    });

    // <defs> holding the trail path — used for sampling positions.
    const defs = mk("defs");
    const trail = mk("path", { id: "sig-trail", d: TRAIL_D, fill: "none" });
    defs.appendChild(trail);
    svg.appendChild(defs);

    // Signature text — drawn *after* the logos are in place.
    // When this last chip lands, the stroke begins drawing.
    const lastChipEndTime =
      START_AT + (CHIPS.length - 1) * CHIP_STEP + CHIP_DUR;

    const text = mk("text", {
      class: "signature-text",
      x: VIEW_W / 2,
      y: 340,
      "text-anchor": "middle",
    });
    text.textContent = "Kate Julia";
    // Pass the handoff time to CSS so the draw starts after the last chip.
    text.style.setProperty(
      "--sig-delay",
      `${lastChipEndTime.toFixed(2)}s`
    );
    text.style.setProperty(
      "--sig-ink-delay",
      `${(lastChipEndTime + 2.8 + 0.1).toFixed(2)}s`
    );
    svg.appendChild(text);

    // Must be in DOM before getTotalLength works reliably.
    stage.appendChild(svg);
    const pathLen = trail.getTotalLength();

    CHIPS.forEach((chip, i) => {
      const delay = prefersReducedMotion
        ? 0
        : START_AT + i * CHIP_STEP;

      const pt = trail.getPointAtLength(pathLen * chip.end);

      // Outer g holds static position; inner g is what animates.
      const pos = mk("g", {
        transform: `translate(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`,
      });

      const chipG = mk("g", { class: "sig-chip" });
      chipG.style.setProperty("--chip-delay", `${delay.toFixed(2)}s`);

      chipG.appendChild(
        mk("rect", {
          class: "chip-bg",
          x: -CHIP_W / 2,
          y: -CHIP_H / 2,
          width: CHIP_W,
          height: CHIP_H,
          rx: CHIP_H / 2,
          ry: CHIP_H / 2,
        })
      );

      const img = mk("image", {
        class: "chip-img",
        x: -CHIP_W / 2 + PAD,
        y: -CHIP_H / 2 + PAD,
        width: CHIP_W - PAD * 2,
        height: CHIP_H - PAD * 2,
        preserveAspectRatio: "xMidYMid meet",
      });
      img.setAttribute("href", chip.src);
      img.setAttributeNS(
        "http://www.w3.org/1999/xlink",
        "xlink:href",
        chip.src
      );
      chipG.appendChild(img);

      const title = mk("title");
      title.textContent = chip.alt;
      chipG.appendChild(title);

      pos.appendChild(chipG);
      svg.appendChild(pos);
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();