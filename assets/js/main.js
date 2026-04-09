"use strict";

function $(sel, root = document) {
  return root.querySelector(sel);
}

function $all(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getTheme() {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "light" || explicit === "dark") return explicit;
  return "light";
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("theme", theme);
  } catch (_) {}
}

function toast(message) {
  const el = document.querySelector("[data-toast]");
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    el.hidden = true;
  }, 1600);
}

function initYear() {
  const year = new Date().getFullYear();
  $all("[data-year]").forEach((n) => (n.textContent = String(year)));
}

function initHeaderElevate() {
  const header = document.querySelector("[data-elevate]");
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle("isElevated", window.scrollY > 6);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function initThemeToggle() {
  const btn = document.querySelector("[data-theme-toggle]");
  if (!btn) return;

  const applyBtnLabel = () => {
    const t = getTheme();
    btn.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
    btn.setAttribute("title", t === "dark" ? "Switch to light" : "Switch to dark");
  };

  applyBtnLabel();

  btn.addEventListener("click", () => {
    const current = getTheme();
    const next = current === "dark" ? "light" : "dark";
    setTheme(next);
    applyBtnLabel();
  });
}

function initMobileNav() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const links = document.querySelector("[data-nav-links]");
  if (!toggle || !links) return;

  const setOpen = (open) => {
    links.classList.toggle("isOpen", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  toggle.addEventListener("click", () => {
    const open = links.classList.contains("isOpen");
    setOpen(!open);
  });

  // Close on link click.
  $all("[data-nav-link]", links).forEach((a) => {
    a.addEventListener("click", () => setOpen(false));
  });

  // Close when clicking outside.
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (toggle.contains(target) || links.contains(target)) return;
    setOpen(false);
  });
}

function initScrollSpy() {
  const navLinks = $all("[data-nav-link]");
  if (!navLinks.length) return;

  const idToLink = new Map();
  navLinks.forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (!href.startsWith("#")) return;
    idToLink.set(href.slice(1), a);
  });

  const sections = Array.from(idToLink.keys())
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (!sections.length) return;

  const setActive = (id) => {
    navLinks.forEach((a) => a.classList.remove("isActive"));
    const link = idToLink.get(id);
    if (link) link.classList.add("isActive");
  };

  // Use IntersectionObserver for stability.
  const obs = new IntersectionObserver(
    (entries) => {
      // Choose the most visible intersecting section.
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];
      if (visible && visible.target && visible.target.id) setActive(visible.target.id);
    },
    {
      root: null,
      threshold: [0.18, 0.35, 0.5, 0.65],
      rootMargin: "-15% 0px -70% 0px",
    }
  );

  sections.forEach((s) => obs.observe(s));

  // Fallback: when landing with a hash.
  if (location.hash && idToLink.has(location.hash.slice(1))) {
    setActive(location.hash.slice(1));
  }
}

function initReveal() {
  if (prefersReducedMotion()) {
    $all(".reveal").forEach((el) => el.classList.add("isVisible"));
    return;
  }

  const els = $all(".reveal");
  if (!els.length) return;

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("isVisible");
        obs.unobserve(e.target);
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
  );

  els.forEach((el) => obs.observe(el));
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    // fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "true");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    document.body.appendChild(ta);
    ta.select();
    try {
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      document.body.removeChild(ta);
      return false;
    }
  }
}

function initCopyButtons() {
  $all("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.getAttribute("data-copy") || "";
      if (!text) return;
      const ok = await copyText(text);
      toast(ok ? "Copied" : "Copy failed");
    });
  });
}

initYear();
initHeaderElevate();
initThemeToggle();
initMobileNav();
initScrollSpy();
initReveal();
initCopyButtons();

