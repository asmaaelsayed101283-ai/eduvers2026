/* =================================================================
   EDUVERSE — HOME PAGE SCRIPT
   Vanilla JS, no frameworks. Organized into small, named functions
   so a non-programmer can read this top to bottom.
   ================================================================= */

/**
 * SUBJECT PREVIEW DATA
 * This is a preview of the architecture described in Phase 1:
 * subjects are DATA, not hardcoded HTML. The real subjects.js file
 * (Phase 3+) will replace this array — the rendering code below
 * will not need to change.
 */
const subjectsPreviewData = [
  { id: "science", name: "العلوم", icon: "🔬", c1: "#3A7BFF", c2: "#22D3EE", units: 6, lessons: 24, progress: 45 },
  { id: "math", name: "الرياضيات", icon: "➗", c1: "#8B5CF6", c2: "#3A7BFF", units: 8, lessons: 32, progress: 20 },
  { id: "english", name: "اللغة الإنجليزية", icon: "📖", c1: "#22D3EE", c2: "#3A7BFF", units: 5, lessons: 20, progress: 70 },
  { id: "arabic", name: "اللغة العربية", icon: "✍️", c1: "#FF9F45", c2: "#8B5CF6", units: 5, lessons: 18, progress: 10 },
];

/**
 * Renders subject preview cards into #subjectTrack from the data
 * array above. Keeping this as a function (not inline HTML) mirrors
 * the reusable SubjectCard component planned for the Subjects page.
 */
function renderSubjectPreview() {
  const track = document.getElementById("subjectTrack");
  if (!track) return;

  track.innerHTML = subjectsPreviewData
    .map(
      (subject) => `
      <article class="subject-card">
        <div class="subject-card__top">
          <div class="subject-card__icon" style="--c1:${subject.c1};--c2:${subject.c2}">${subject.icon}</div>
          <div>
            <div class="subject-card__name">${subject.name}</div>
            <div class="subject-card__meta">${subject.units} وحدات · ${subject.lessons} درس</div>
          </div>
        </div>

        <div>
          <div class="subject-card__progress-label">
            <span>التقدم</span>
            <span>${subject.progress}%</span>
          </div>
          <div class="subject-card__bar">
            <span class="subject-card__bar-fill" style="width:${subject.progress}%"></span>
          </div>
        </div>

        <a href="units.html?world=${subject.id}" class="subject-card__start">ابدأ التعلم</a>
      </article>
    `
    )
    .join("");
}

/**
 * Mobile navigation toggle — shows/hides the nav links panel
 * and animates the hamburger icon into an X.
 */
function setupNavToggle() {
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const isOpen = toggle.classList.toggle("is-open");
    links.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));

    // Small inline styles for the mobile dropdown panel.
    // Kept in JS (not CSS) since it only applies while toggled open.
    if (isOpen) {
      links.style.display = "flex";
      links.style.flexDirection = "column";
      links.style.position = "absolute";
      links.style.top = "var(--nav-h)";
      links.style.insetInline = "0";
      links.style.background = "#fff";
      links.style.padding = "20px 24px";
      links.style.boxShadow = "0 12px 24px rgba(28,27,51,0.08)";
      links.style.gap = "16px";
    } else {
      links.style.display = "";
    }
  });

  // Close the mobile menu after a link is tapped.
  links.querySelectorAll(".navbar__link").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 1024) {
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        links.classList.remove("is-open");
        links.style.display = "";
      }
    });
  });
}

/**
 * Fades + slides elements with the `.reveal` class into view as the
 * user scrolls past them, using IntersectionObserver (no scroll-jank).
 */
function setupScrollReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  items.forEach((item) => observer.observe(item));
}

/**
 * Scatters small twinkling star dots across the hero background.
 * Purely decorative — skipped entirely if the user prefers reduced motion.
 */
function setupHeroStars() {
  const field = document.getElementById("heroStars");
  if (!field) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const starCount = prefersReducedMotion ? 0 : 40;

  for (let i = 0; i < starCount; i++) {
    const star = document.createElement("span");
    star.className = "star";
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 3}s`;
    field.appendChild(star);
  }
}

/**
 * Animates each `.stat-block__num` from 0 up to its `data-count-to`
 * value once it scrolls into view. Numbers marked `data-infinity`
 * are shown as "∞" instead of counting (e.g. "unlimited missions").
 */
function setupStatCounters() {
  const numbers = document.querySelectorAll(".stat-block__num");
  if (!numbers.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const animateNumber = (el) => {
    if (el.dataset.infinity === "true") {
      el.textContent = "∞";
      return;
    }

    const target = parseInt(el.dataset.countTo, 10) || 0;
    const suffix = el.dataset.suffix || "";

    if (prefersReducedMotion) {
      el.textContent = target + suffix;
      return;
    }

    const duration = 1200;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateNumber(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  numbers.forEach((num) => observer.observe(num));
}

/**
 * Adds a subtle shadow to the navbar once the page is scrolled,
 * so it reads clearly against the animated hero background.
 */
function setupNavbarScrollState() {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;

  window.addEventListener("scroll", () => {
    navbar.style.boxShadow = window.scrollY > 8
      ? "0 8px 20px rgba(28,27,51,0.08)"
      : "none";
  });
}

/**
 * Placeholder interaction for the daily reward chest teaser.
 * Full reward logic belongs to js/gamification/rewards.js (later phase);
 * for the home page this only gives a light visual acknowledgement.
 * Feedback is a brief CSS class (glow/shadow only) — no inline
 * transform/scale, so the chest never appears to change size.
 */
function setupRewardChestTeaser() {
  const chest = document.getElementById("chestBtn");
  if (!chest) return;

  const openChest = () => {
    chest.classList.add("is-pressed");
    window.setTimeout(() => chest.classList.remove("is-pressed"), 180);
  };

  chest.addEventListener("click", openChest);
  chest.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openChest();
    }
  });
}

/**
 * App entry point — runs once the DOM is ready.
 */
function initHomePage() {
  renderSubjectPreview();
  setupNavToggle();
  setupScrollReveal();
  setupStatCounters();
  setupHeroStars();
  setupNavbarScrollState();
  setupRewardChestTeaser();
}

document.addEventListener("DOMContentLoaded", initHomePage);
