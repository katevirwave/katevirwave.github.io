// Simple signup handler:
// - Saves signups locally so you can test instantly on GitHub Pages
// - You can swap in a real endpoint later (Mailchimp/Buttondown/Google Form/Netlify Forms)

(function () {
  const form = document.getElementById("signupForm");
  const statusEl = document.getElementById("formStatus");

  if (!form || !statusEl) return;

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const interest = String(fd.get("interest") || "events");

    if (!name) {
      statusEl.textContent = "Please add your name.";
      return;
    }
    if (!isValidEmail(email)) {
      statusEl.textContent = "Please enter a valid email.";
      return;
    }

    const record = {
      name,
      email,
      interest,
      created_at: new Date().toISOString(),
    };

    // Store locally for testing/demo
    const key = "katejulia_signups_v1";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.push(record);
    localStorage.setItem(key, JSON.stringify(existing));

    form.reset();
    statusEl.textContent = "You’re in. I’ll send updates for upcoming events.";

    // OPTIONAL: If you want a real collection mechanism:
    // 1) Mailchimp/Buttondown: replace the form with their embed.
    // 2) Google Forms: post to a Google Forms endpoint (needs your form's entry IDs).
    // 3) Netlify Forms: deploy to Netlify and add data-netlify="true" in HTML.
  });
})();
