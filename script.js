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
/* Builds an SVG of "Kate Julia" in handwriting; logo chips ride  */
/* a path across it and "draw" the signature. When the chips      */
/* finish, the signature inks in as a solid line.                 */
/* -------------------------------------------------------------- */
(() => {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const VIEW_W = 1000;
  const VIEW_H = 260;

  // Path the logos travel along — a gentle cursive arc across the
  // signature baseline. This isn't the signature itself, it's the
  // "pen motion" logos follow.
  const TRAIL_D =
    "M 40 150 C 180 40 320 240 500 130 S 760 60 860 150 S 960 200 970 150";

  // Logos — add / reorder / swap freely. `end` is fraction along the
  // trail (0–1) where that chip comes to rest.
  const CHIPS = [
    { src: "./assets/logos/ucl.png",          end: 0.06, alt: "UCL" },
    { src: "./assets/logos/hatchery.png",     end: 0.17, alt: "UCL Hatchery" },
    { src: "./assets/logos/ucltedx.png",      end: 0.28, alt: "UCL TEDx" },
    { src: "./assets/logos/deloitte.png",     end: 0.40, alt: "Deloitte" },
    { src: "./assets/logos/kpmg.png",         end: 0.50, alt: "KPMG" },
    { src: "./assets/logos/a4.png",           end: 0.62, alt: "A4 Safety Alliance" },
    { src: "./assets/logos/fundamentally.png",end: 0.74, alt: "Fundamentally Children" },
    { src: "./assets/logos/kididing.jpeg",    end: 0.85, alt: "Kidding Around Yoga" },
    { src: "./assets/logos/claude.png",       end: 0.95, alt: "Claude" },
  ];

  // Chip box size. preserveAspectRatio="xMidYMid meet" fits any logo.
  const CHIP_W = 120;
  const CHIP_H = 44;
  const PAD = 6;

  const RIDE_DUR = 2.6;   // seconds each chip travels
  const STEP     = 0.30;  // stagger between chip starts
  const START_AT = 0.15;  // initial delay before first chip

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
      "aria-label": "Kate Julia — signature traced by logos of past work",
    });

    // <defs> holding the trail path, referenced by each chip's <mpath>
    const defs = mk("defs");
    const trail = mk("path", { id: "sig-trail", d: TRAIL_D, fill: "none" });
    defs.appendChild(trail);
    svg.appendChild(defs);

    // The signature itself — drawn by the chips (stroke animates in).
    const text = mk("text", {
      class: "signature-text",
      x: VIEW_W / 2,
      y: 190,
      "text-anchor": "middle",
    });
    text.textContent = "Kate Julia";
    svg.appendChild(text);

    // Chips
    CHIPS.forEach((chip, i) => {
      const begin = START_AT + i * STEP;

      const g = mk("g", {
        class: "sig-chip",
        // center the chip on the motion point
        transform: `translate(${-CHIP_W / 2}, ${-CHIP_H / 2})`,
      });
      g.style.setProperty("--chip-delay", `${begin.toFixed(2)}s`);

      g.appendChild(
        mk("rect", {
          class: "chip-bg",
          x: 0,
          y: 0,
          width: CHIP_W,
          height: CHIP_H,
          rx: CHIP_H / 2,
          ry: CHIP_H / 2,
        })
      );

      const img = mk("image", {
        class: "chip-img",
        x: PAD,
        y: PAD,
        width: CHIP_W - PAD * 2,
        height: CHIP_H - PAD * 2,
        preserveAspectRatio: "xMidYMid meet",
      });
      // both href and xlink:href for max compatibility
      img.setAttribute("href", chip.src);
      img.setAttributeNS(
        "http://www.w3.org/1999/xlink",
        "xlink:href",
        chip.src
      );
      g.appendChild(img);

      // Title for a11y tooltip
      const title = mk("title");
      title.textContent = chip.alt;
      g.appendChild(title);

      if (prefersReducedMotion) {
        // Static placement at rest position — no motion.
        // Evaluate rough position by sampling the path via a
        // temporary SVGPathElement.
        const len = trail.getTotalLength();
        const pt = trail.getPointAtLength(len * chip.end);
        g.setAttribute(
          "transform",
          `translate(${pt.x - CHIP_W / 2}, ${pt.y - CHIP_H / 2})`
        );
        g.style.opacity = 1;
      } else {
        const motion = mk("animateMotion", {
          dur: `${RIDE_DUR}s`,
          begin: `${begin.toFixed(2)}s`,
          fill: "freeze",
          // Travel from 0 → end fraction along the path.
          keyPoints: `0;${chip.end}`,
          keyTimes: "0;1",
          calcMode: "spline",
          keySplines: "0.22 0.1 0.25 1",
        });
        const mpath = mk("mpath", {});
        mpath.setAttributeNS(
          "http://www.w3.org/1999/xlink",
          "xlink:href",
          "#sig-trail"
        );
        mpath.setAttribute("href", "#sig-trail");
        motion.appendChild(mpath);
        g.appendChild(motion);
      }

      svg.appendChild(g);
    });

    stage.appendChild(svg);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();