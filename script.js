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
  const RIDE_DUR  = 3.5;   // how long each chip takes to cross
  const CHIP_STEP = 0.28;  // stagger between chip entries
  const START_AT  = 0.00;

  // Wave paint syncs with logo passage.
  const WAVE_DELAY  = 0.6;
  const LAST_START  = START_AT + (CHIPS.length - 1) * CHIP_STEP;
  const LAST_END    = LAST_START + RIDE_DUR;
  const WAVE_DUR    = (LAST_END - WAVE_DELAY) + 0.3;

  // Signature starts early — the name draws WHILE the logos are still
  // flying and the wave is forming around it. Solid before it all ends.
  const SIG_DELAY     = 2.0;
  const SIG_DRAW_DUR  = 2.2;
  const SIG_INK_DELAY = SIG_DELAY + SIG_DRAW_DUR + 0.2;

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

    // Marker roughness filter — makes the wave look hand-drawn and rocky.
    // feTurbulence warps the stroke edges; feDisplacementMap applies it.
    const markerFilter = mk("filter", {
      id: "marker-rough",
      x: "-5%", y: "-30%",
      width: "110%", height: "160%",
    });
    const turbMarker = mk("feTurbulence", {
      type: "fractalNoise",
      baseFrequency: "0.018 0.032",
      numOctaves: "3",
      seed: "5",
      result: "noise",
    });
    const dispMarker = mk("feDisplacementMap", {
      in: "SourceGraphic",
      in2: "noise",
      scale: "9",
      xChannelSelector: "R",
      yChannelSelector: "G",
    });
    markerFilter.appendChild(turbMarker);
    markerFilter.appendChild(dispMarker);
    defs.appendChild(markerFilter);

    // Spray-paint filter — used by the graffiti section text.
    // Wobbles edges with displacement so it looks hand-sprayed but stays readable.
    const sprayFilter = mk("filter", {
      id: "spray-rough",
      x: "-8%", y: "-20%",
      width: "116%", height: "140%",
    });
    const turbSpray = mk("feTurbulence", {
      type: "fractalNoise",
      baseFrequency: "0.038 0.028",
      numOctaves: "3",
      seed: "14",
      result: "noiseOut",
    });
    const dispSpray = mk("feDisplacementMap", {
      in: "SourceGraphic",
      in2: "noiseOut",
      scale: "5",
      xChannelSelector: "R",
      yChannelSelector: "G",
    });
    sprayFilter.appendChild(turbSpray);
    sprayFilter.appendChild(dispSpray);
    defs.appendChild(sprayFilter);

    // Name-rebuild filter — starts with high displacement (shattered, broken),
    // SMIL-animates scale from 85 → 0 so the name heals into a whole form.
    const rebuildFilter = mk("filter", {
      id: "name-rebuild",
      x: "-20%", y: "-35%",
      width: "140%", height: "170%",
    });
    const turbRebuild = mk("feTurbulence", {
      type: "fractalNoise",
      baseFrequency: "0.038 0.028",
      numOctaves: "4",
      seed: "11",
      result: "noise",
    });
    const dispRebuild = mk("feDisplacementMap", {
      in: "SourceGraphic",
      in2: "noise",
      xChannelSelector: "R",
      yChannelSelector: "G",
    });
    // Animate: shattered (scale=85) → whole (scale=0)
    const animScale = mk("animate", {
      attributeName: "scale",
      from: "85",
      to: "0",
      dur: "2.8s",
      begin: `${SIG_DELAY.toFixed(2)}s`,
      fill: "freeze",
      calcMode: "spline",
      keyTimes: "0;1",
      keySplines: "0.05 0.85 0.1 1",
    });
    dispRebuild.appendChild(animScale);
    rebuildFilter.appendChild(turbRebuild);
    rebuildFilter.appendChild(dispRebuild);
    defs.appendChild(rebuildFilter);

    // Wavelength gradient for the name — horizontal, userSpaceOnUse so it
    // spans the actual pixel coordinates where "Kate Julia" lives.
    const nameGrad = mk("linearGradient", {
      id: "name-grad",
      gradientUnits: "userSpaceOnUse",
      x1: "130", y1: "262",
      x2: "870", y2: "262",
    });
    WAVES.forEach((hex, i) => {
      const s = mk("stop", {
        offset: `${((i / (WAVES.length - 1)) * 100).toFixed(2)}%`,
      });
      s.setAttribute("stop-color", hex);
      nameGrad.appendChild(s);
    });
    defs.appendChild(nameGrad);

    // Motion path, referenced by <mpath> for each chip.
    const wind = mk("path", { id: "wind-path", d: WIND_D, fill: "none" });
    defs.appendChild(wind);
    svg.appendChild(defs);

    // Two marker strokes — thick underlay + thin scratchy highlight.
    // Together they look like a rocky, heavy marker stroke.
    const trailThick = mk("path", { class: "wave-trail-thick", d: WIND_D });
    const trailThin  = mk("path", { class: "wave-trail-thin",  d: WIND_D });
    svg.appendChild(trailThick);
    svg.appendChild(trailThin);

    // "Kate Julia" — starts shattered in wavelength colors, heals to whole.
    // The name-rebuild filter's SMIL animate handles the reconstruction;
    // CSS handles the initial fade-in via --sig-delay.
    const text = mk("text", {
      class: "signature-rebuild",
      x: VIEW_W / 2,
      y: 262,
      "text-anchor": "middle",
      filter: "url(#name-rebuild)",
    });
    text.setAttribute("fill", "url(#name-grad)");
    text.textContent = "Kate Julia";
    text.style.setProperty("--sig-delay", `${SIG_DELAY.toFixed(2)}s`);
    svg.appendChild(text);

    stage.appendChild(svg);

    // Measure path length now that it's in the DOM; kick off paint on both trails.
    requestAnimationFrame(() => {
      const len = trailThick.getTotalLength();
      [trailThick, trailThin].forEach((t, i) => {
        t.style.strokeDasharray = String(len);
        t.style.strokeDashoffset = String(len);
        t.style.setProperty("--wave-dur",   `${(WAVE_DUR + i * 0.15).toFixed(2)}s`);
        t.style.setProperty("--wave-delay", `${WAVE_DELAY.toFixed(2)}s`);
        if (prefersReducedMotion) {
          t.style.strokeDashoffset = "0";
          t.style.opacity = i === 0 ? "0.55" : "0.7";
        } else {
          t.classList.add("paint");
        }
      });
      if (prefersReducedMotion) {
        trailThick.style.opacity = "0.55";
        trailThin.style.opacity  = "0.7";
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

/* -------------------------------------------------------------- */
/* Graffiti spray-in animation                                     */
/* Triggers when the graffiti band scrolls into view. Each line   */
/* "sprays in" — mist clears, text materialises from the fog.     */
/* -------------------------------------------------------------- */
(() => {
  const init = () => {
    const el = document.querySelector("[data-graffiti]");
    if (!el) return;

    const tags = el.querySelectorAll(".gtag");

    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      tags.forEach((t) => t.classList.add("sprayed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            tags.forEach((t) => t.classList.add("sprayed"));
            observer.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();