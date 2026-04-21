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
/* Hero wave animation                                            */
/* Logos blow across a wavy wind current. As they pass, they      */
/* paint a wavelength ribbon in their wake — the VirWave thesis   */
/* made visible. The final frame is the wave, alone, in the seven */
/* wavelength colors. No cursive name, no leftover logos.         */
/* -------------------------------------------------------------- */
(() => {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const VIEW_W = 1000;
  const VIEW_H = 420;

  // Wind current — a clean sinusoidal wave across the hero, entering
  // off-screen left, exiting off-screen right. Every logo rides it.
  const WIND_D =
    "M -120 220 " +
    "C   40 100, 180 340, 300 220 " +
    "S  500  80, 580 220 " +
    "S  780 340, 880 220 " +
    "S 1040 100, 1140 220";

  // Logos — reorder / swap freely.
  const CHIPS = [
    { src: "./assets/logos/ucl.png",          alt: "UCL" },
    { src: "./assets/logos/hatchery.png",     alt: "UCL Hatchery" },
    { src: "./assets/logos/ucltedx.png",      alt: "UCL TEDx" },
    { src: "./assets/logos/deloitte.png",     alt: "Deloitte" },
    { src: "./assets/logos/kpmg.png",         alt: "KPMG" },
    { src: "./assets/logos/a4.png",           alt: "A4 Safety Alliance" },
    { src: "./assets/logos/fundamentally.png",alt: "Fundamentally Children" },
    { src: "./assets/logos/kididing.jpeg",    alt: "Kidding Around Yoga" },
    { src: "./assets/logos/claude.png",       alt: "Claude" },
  ];

  // Seven emotional wavelengths — must match the CSS palette.
  const WAVES = [
    "#B54248", "#D97757", "#D9A44A", "#7FA564",
    "#3E8E8E", "#3F5A8A", "#7A5B8F"
  ];

  // Chip size
  const CHIP_W = 96;
  const CHIP_H = 36;
  const PAD    = 5;

  // Timing (seconds)
  const RIDE_DUR  = 4.6;   // how long each chip takes to cross
  const CHIP_STEP = 0.34;  // stagger between chip entries
  const START_AT  = 0.00;

  // Wave paint syncs with logo passage: starts just before the first
  // chip reaches mid-stage, finishes just after the last exits.
  const WAVE_DELAY  = 0.8;
  const LAST_START  = START_AT + (CHIPS.length - 1) * CHIP_STEP;
  const LAST_END    = LAST_START + RIDE_DUR;
  const WAVE_DUR    = (LAST_END - WAVE_DELAY) + 0.3;

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
        "Logos of past work drift across the hero, painting a seven-color emotional wavelength in their wake.",
    });

    const defs = mk("defs");

    // Wavelength gradient — the colors the ribbon is painted in.
    const grad = mk("linearGradient", {
      id: "wavelength-grad",
      x1: "0", y1: "0", x2: "1", y2: "0",
      gradientUnits: "objectBoundingBox",
    });
    WAVES.forEach((hex, i) => {
      const stop = mk("stop", {
        offset: `${((i / (WAVES.length - 1)) * 100).toFixed(2)}%`,
      });
      stop.setAttribute("stop-color", hex);
      grad.appendChild(stop);
    });
    defs.appendChild(grad);

    // Motion path, referenced by <mpath> for each chip.
    const wind = mk("path", { id: "wind-path", d: WIND_D, fill: "none" });
    defs.appendChild(wind);
    svg.appendChild(defs);

    // The ribbon — this is what the logos paint.
    const trail = mk("path", {
      class: "wave-trail",
      d: WIND_D,
    });
    svg.appendChild(trail);

    stage.appendChild(svg);

    // Measure path length now that it's in the DOM; kick off paint.
    requestAnimationFrame(() => {
      const len = trail.getTotalLength();
      trail.style.strokeDasharray = String(len);
      trail.style.strokeDashoffset = String(len);
      trail.style.setProperty("--wave-dur",   `${WAVE_DUR.toFixed(2)}s`);
      trail.style.setProperty("--wave-delay", `${WAVE_DELAY.toFixed(2)}s`);
      if (prefersReducedMotion) {
        trail.style.strokeDashoffset = "0";
        trail.style.opacity = "1";
      } else {
        trail.classList.add("paint");
      }
    });

    CHIPS.forEach((chip, i) => {
      const begin = START_AT + i * CHIP_STEP;

      const chipG = mk("g", { class: "sig-chip", opacity: 0 });

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
        width:  CHIP_W - PAD * 2,
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

      if (prefersReducedMotion) {
        // Static fallback: no chips shown; the wave alone is the
        // meaningful content and is rendered solid above.
        return;
      }

      const motion = mk("animateMotion", {
        dur: `${RIDE_DUR}s`,
        begin: `${begin.toFixed(2)}s`,
        fill: "remove",
        calcMode: "linear",
      });
      const mpath = mk("mpath");
      mpath.setAttributeNS(
        "http://www.w3.org/1999/xlink",
        "xlink:href",
        "#wind-path"
      );
      mpath.setAttribute("href", "#wind-path");
      motion.appendChild(mpath);
      chipG.appendChild(motion);

      const opacity = mk("animate", {
        attributeName: "opacity",
        values: "0;1;1;0",
        keyTimes: "0;0.12;0.82;1",
        dur: `${RIDE_DUR}s`,
        begin: `${begin.toFixed(2)}s`,
        fill: "remove",
      });
      chipG.appendChild(opacity);

      svg.appendChild(chipG);
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();