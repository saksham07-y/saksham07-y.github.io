/* Shared theme + accent handling (landing page and planner stay in sync) */
(function () {
  const TK = "daybreak.theme", AK = "daybreak.accent";
  const mq = window.matchMedia("(prefers-color-scheme: dark)");

  const lum = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const f = (c) => { c /= 255; return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); };
    return .2126 * f(n >> 16) + .7152 * f((n >> 8) & 255) + .0722 * f(n & 255);
  };
  const shade = (hex, amt) => {
    const n = parseInt(hex.slice(1), 16);
    const c = (v) => Math.max(0, Math.min(255, v + amt));
    return "#" + [n >> 16, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, "0")).join("");
  };

  const mixBlack = (hex, pct) => { const n = parseInt(hex.slice(1), 16); return "#" + [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v * pct).toString(16).padStart(2, "0")).join(""); };
  function updateFavicon() {
    let acc = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    if (!/^#[0-9a-f]{6}$/i.test(acc)) return;
    const sun = lum(acc) > .45 ? "#1a1205" : "#ffffff";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="${mixBlack(acc, .82)}"/><path d="M19.5 423.0 19.5 460.0 21.0 461.5 473.5 462.0 491.0 461.5 492.0 460.0 492.0 422.5 490.5 421.0 21.0 421.0zM70.0 365.5 71.5 374.0 440.0 374.0 441.5 372.5 437.5 333.5 427.5 302.5 412.0 273.0 390.5 246.0 361.5 221.0 336.0 206.0 301.5 193.5 279.5 189.5 259.5 188.0 225.5 190.5 188.5 200.5 157.0 216.5 129.0 238.0 102.0 269.5 86.0 298.0 74.5 332.0zM419.5 149.5 417.0 150.0 372.0 195.5 373.5 199.0 399.0 224.0 404.5 221.0 446.5 178.0zM92.5 149.5 66.0 175.5 65.5 179.0 110.5 224.0 112.5 224.0 139.5 197.5 139.5 195.0 95.5 150.5zM237.0 70.0 235.5 71.5 235.5 137.0 275.0 138.0 276.5 136.0 275.5 70.5z" fill="${sun}" transform="translate(256 256) scale(.86) translate(-256 -256)"/></svg>`;
    // replace every icon link with one fresh element so all browsers repaint the tab icon
    document.querySelectorAll('link[rel~="icon"]').forEach((l) => l.remove());
    const link = document.createElement("link");
    link.rel = "icon"; link.type = "image/svg+xml"; link.href = "data:image/svg+xml," + encodeURIComponent(svg);
    document.head.appendChild(link);
  }
  function applyTheme(t) {
    const resolved = t === "system" ? (mq.matches ? "dark" : "light") : t;
    document.documentElement.setAttribute("data-theme", resolved);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", { dark: "#0d1120", bluegray: "#e4eaf2", contrast: "#ffffff" }[resolved] || "#f4f6fa");
    document.querySelectorAll("[data-theme-select]").forEach((s) => (s.value = t));
    updateFavicon();
  }
  function applyAccent(hex) {
    const r = document.documentElement.style;
    if (!hex) { ["--accent", "--accent2", "--on-accent", "--logo-sun"].forEach((p) => r.removeProperty(p)); updateFavicon(); return; }
    r.setProperty("--accent", hex);
    r.setProperty("--accent2", shade(hex, 45));
    r.setProperty("--on-accent", lum(hex) > .33 ? "#111111" : "#ffffff");
    r.setProperty("--logo-sun", lum(hex) > .45 ? "#1a1205" : "#ffffff");
    updateFavicon();
  }
  const get = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  const api = {
    theme: () => get(TK, "system"),
    accent: () => get(AK, ""),
    setTheme(t) { set(TK, t); applyTheme(t); window.dispatchEvent(new Event("daybreak:theme")); },
    setAccent(a) { set(AK, a); applyAccent(a); },
  };
  window.DBTheme = api;
  applyTheme(api.theme());
  applyAccent(api.accent());
  mq.addEventListener && mq.addEventListener("change", () => api.theme() === "system" && applyTheme("system"));
  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(api.theme());
    document.querySelectorAll("[data-theme-select]").forEach((s) => s.addEventListener("change", () => api.setTheme(s.value)));
  });
})();
