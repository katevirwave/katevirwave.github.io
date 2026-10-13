// script.js
// Small progressive enhancements. The page reads fine without any of them.
//   1. Wavelength line: the hero and closing waves, drawn to fit the viewport.
//   2. Logo marquee: "In good company" drifts slowly instead of wrapping.
//   3. Scroll reveals: blocks marked [data-reveal] ease in as they arrive.
//   4. K-drama stats: counted live from kdrama.html so they never go stale.

const prefersReducedMotion =
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const onReady = (fn) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn);
  } else {
    fn();
  }
};

/* -------------------------------------------------------------- */
/* Wavelength line                                                */
/* One continuous line: steady, then a rough patch, then steady   */
/* again. The VirWave thesis as a drawing. Painted in the seven   */
/* wavelength colors from Kate's LinkedIn banner.                 */
/* -------------------------------------------------------------- */
(() => {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const HEIGHT = 120;

  // Periwinkle slate fading to midnight navy.
  const WAVES = [
    "#9198B8", "#7E88B0", "#6A76A8",
    "#5664A0", "#425090", "#2E3C78", "#1E2A52",
  ];

  const mk = (name, attrs = {}) => {
    const el = document.createElementNS(SVG_NS, name);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  };

  // Amplitude and frequency both swell around 62% of the way across.
  const wavePath = (width) => {
    const mid = HEIGHT / 2;
    const peak = width * 0.62;
    const spread = Math.max(width * 0.16, 110);
    const step = 3;
    let phase = 0;
    let d = "";
    for (let x = -step; x <= width + step; x += step) {
      const bump = Math.exp(-(((x - peak) / spread) ** 2));
      phase += step * (0.011 + 0.045 * bump);
      const y = mid + (9 + 36 * bump) * Math.sin(phase);
      d += `${d ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  };

  const draw = (stage, index) => {
    const width = Math.round(stage.clientWidth);
    if (!width || stage.dataset.width === String(width)) return;
    stage.dataset.width = String(width);

    const gradId = `wavelength-grad-${index}`;
    const svg = mk("svg", {
      viewBox: `0 0 ${width} ${HEIGHT}`,
      width,
      height: HEIGHT,
    });

    const defs = mk("defs");
    const grad = mk("linearGradient", {
      id: gradId,
      gradientUnits: "userSpaceOnUse",
      x1: 0, y1: 0, x2: width, y2: 0,
    });
    // On the dark closing band, stay in the pale end of the palette.
    const stops = stage.classList.contains("wave-light")
      ? [WAVES[2], WAVES[0], WAVES[2]]
      : WAVES;
    stops.forEach((hex, i) => {
      grad.appendChild(
        mk("stop", {
          offset: `${((i / (stops.length - 1)) * 100).toFixed(2)}%`,
          "stop-color": hex,
        })
      );
    });
    defs.appendChild(grad);
    svg.appendChild(defs);

    // Soft marker underlay + crisp line on top.
    const d = wavePath(width);
    svg.appendChild(mk("path", { class: "wave-under", d, stroke: `url(#${gradId})` }));
    svg.appendChild(mk("path", { class: "wave-line", d, stroke: `url(#${gradId})` }));

    stage.replaceChildren(svg);
  };

  onReady(() => {
    const stages = [...document.querySelectorAll("[data-wave]")];
    if (!stages.length) return;

    const drawAll = () => stages.forEach(draw);
    drawAll();

    let timer;
    window.addEventListener("resize", () => {
      clearTimeout(timer);
      timer = setTimeout(drawAll, 150);
    });
  });
})();

/* -------------------------------------------------------------- */
/* Logo marquee                                                   */
/* Clones the logo set once so the strip can loop seamlessly.     */
/* Skipped for reduced motion: the logos just wrap in place.      */
/* -------------------------------------------------------------- */
(() => {
  onReady(() => {
    const viewport = document.querySelector("[data-marquee]");
    if (!viewport || prefersReducedMotion) return;

    const set = viewport.querySelector(".logos-set");
    if (!set) return;

    const clone = set.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll("img").forEach((img) => {
      img.alt = "";
      img.loading = "eager";
    });
    set.querySelectorAll("img").forEach((img) => (img.loading = "eager"));

    const track = document.createElement("div");
    track.className = "logos-track";
    track.append(set, clone);
    viewport.appendChild(track);
    viewport.classList.add("is-marquee");
  });
})();

/* -------------------------------------------------------------- */
/* Scroll reveals                                                 */
/* -------------------------------------------------------------- */
(() => {
  onReady(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const showAll = () => els.forEach((el) => el.classList.add("in"));

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      showAll();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    els.forEach((el) => observer.observe(el));
  });
})();

/* -------------------------------------------------------------- */
/* K-drama stats, counted from the log itself                     */
/* -------------------------------------------------------------- */
// The numbers in the K-drama card are typed into index.html as a fallback.
// This reads the `shows` list from kdrama.html and recounts them the same way
// the log page does, so adding a show there updates the homepage too.
(() => {
  onReady(() => {
    const dds = document.querySelectorAll("#kdrama .stats dd");
    if (dds.length < 4 || !window.fetch) return;
    fetch("./kdrama.html", { cache: "no-cache" })
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((src) => {
        const start = src.indexOf("const shows = [");
        const end = src.indexOf("\n];", start);
        if (start < 0 || end < 0) return;
        const shows = new Function("return " + src.slice(start + 14, end + 2))();
        if (!Array.isArray(shows) || !shows.length) return;
        const actors = new Set();
        shows.forEach((s) => (s.cast || []).forEach((a) => actors.add(a)));
        const counts = [
          shows.filter((s) => s.status === "watched" && s.depth !== "partial").length,
          shows.filter((s) => s.status === "want").length,
          actors.size,
          shows.filter((s) => (s.locs || []).some((l) => l.abroad)).length,
        ];
        dds.forEach((dd, i) => { dd.textContent = String(counts[i]); });
      })
      .catch(() => {});
  });
})();
