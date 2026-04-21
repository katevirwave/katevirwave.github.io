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
  const VIEW_H = 200;   // shorter viewBox keeps the SVG ~20vw tall on screen

  // Wind current — chaotic wave in the UPPER portion of the canvas.
  // Y values compressed to fit the smaller viewBox; stays above y=110
  // so the name at y=165 has clear air underneath it.
  const WIND_D =
    "M -120 52 " +
    "C   20   7, 220 100, 330  41 " +
    "C  420   4, 545  98, 630  37 " +
    "C  730 100, 830   5, 950  48 " +
    "C 1050  98, 1110  13, 1160  52";

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

  // Seven emotional wavelengths — pulled from Kate's LinkedIn banner.
  // Periwinkle slate fading to midnight navy.
  const WAVES = [
    "#9198B8", "#7E88B0", "#6A76A8",
    "#5664A0", "#425090", "#2E3C78", "#1E2A52"
  ];

  // Chip size — bigger so they read clearly on the wave
  const CHIP_W = 130;
  const CHIP_H = 50;
  const PAD    = 7;

  // Timing (seconds)
  const RIDE_DUR  = 5.2;   // slower crossing — logos stay visible longer
  const CHIP_STEP = 0.30;  // stagger between chip entries
  const START_AT  = 0.00;

  // Wave starts the same moment as logos — they move together from frame 1.
  const WAVE_DELAY  = 0.0;
  const LAST_START  = START_AT + (CHIPS.length - 1) * CHIP_STEP;
  const LAST_END    = LAST_START + RIDE_DUR;
  const WAVE_DUR    = LAST_END + 0.4;

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
      scale: "18",
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

    // (name-rebuild filter removed — replaced by individual letter pieces below)

    // Wavelength gradient for the name — horizontal, userSpaceOnUse.
    const nameGrad = mk("linearGradient", {
      id: "name-grad",
      gradientUnits: "userSpaceOnUse",
      x1: "372", y1: "165",
      x2: "620", y2: "165",
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

    // "Kate Julia" — individual letter pieces scattered across the canvas
    // at page load. Each piece animates back to its home position, gathering
    // into the full name. Nested <g> pair: outer drives translate, inner drives
    // rotate, so SMIL can animate both axes without fighting over the attribute.
    const LETTERS    = ["K","a","t","e","J","u","l","i","a"];
    // Approximate center-x for each letter in the assembled name (Caveat 72px).
    const HOME_X     = [372, 409, 439, 469, 516, 551, 578, 594, 620];
    const HOME_Y     = 165;
    // Delta (dx, dy) from home → scatter position (where each piece starts).
    const SCATTER    = [
      [-430,-340], [ 720,-300], [ 540, 210], [-390,  90],
      [  15,-510], [-680,-130], [ 510,-190], [-290, 250], [ 230,-480],
    ];
    const ROT_FROM   = [-55, 38, -72, 25, -16, 60, -42, 78, -24];
    const GATHER_DUR = 1.5;   // seconds each letter takes to reach home
    const STAGGER    = 0.14;  // stagger between letters

    LETTERS.forEach((char, li) => {
      const hx    = HOME_X[li];
      const hy    = HOME_Y;
      const sx    = hx + SCATTER[li][0];
      const sy    = hy + SCATTER[li][1];
      const rot   = ROT_FROM[li];
      const begin = SIG_DELAY + li * STAGGER;
      // Pick a color from the wavelength palette based on letter index.
      const ci    = Math.round((li / (LETTERS.length - 1)) * (WAVES.length - 1));

      if (prefersReducedMotion) {
        // Static fallback: show letters assembled at home, no animation.
        const g = mk("g", { transform: `translate(${hx},${hy})` });
        const t = mk("text", {
          class: "letter-piece",
          x: "0", y: "0",
          "text-anchor": "middle",
          filter: "url(#spray-rough)",
        });
        t.setAttribute("fill", WAVES[ci]);
        t.textContent = char;
        g.appendChild(t);
        svg.appendChild(g);
        return;
      }

      // Outer g: starts at scatter position, SMIL-translates to home.
      const outerG = mk("g", { transform: `translate(${sx},${sy})` });
      const animT  = mk("animateTransform", {
        attributeName: "transform",
        type: "translate",
        from: `${sx} ${sy}`,
        to:   `${hx} ${hy}`,
        dur:  `${GATHER_DUR}s`,
        begin: `${begin.toFixed(2)}s`,
        fill: "freeze",
        calcMode: "spline",
        keyTimes: "0;1",
        keySplines: "0.16 0.08 0.09 0.97",
      });
      outerG.appendChild(animT);

      // Inner g: starts rotated, SMIL-rotates to upright.
      const innerG = mk("g", { transform: `rotate(${rot})` });
      const animR  = mk("animateTransform", {
        attributeName: "transform",
        type: "rotate",
        from: `${rot}`,
        to:   "0",
        dur:  `${GATHER_DUR}s`,
        begin: `${begin.toFixed(2)}s`,
        fill: "freeze",
        calcMode: "spline",
        keyTimes: "0;1",
        keySplines: "0.16 0.08 0.09 0.97",
      });
      innerG.appendChild(animR);

      const letterEl = mk("text", {
        class: "letter-piece",
        x: "0", y: "0",
        "text-anchor": "middle",
        filter: "url(#spray-rough)",
      });
      letterEl.setAttribute("fill", WAVES[ci]);
      letterEl.textContent = char;

      innerG.appendChild(letterEl);
      outerG.appendChild(innerG);
      svg.appendChild(outerG);
    });

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