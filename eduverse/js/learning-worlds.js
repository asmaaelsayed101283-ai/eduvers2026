/* =================================================================
   EDUVERSE — LEARNING WORLDS PAGE SCRIPT
   Vanilla JS, no frameworks. Mirrors the data-driven pattern used
   on the Home Page: worlds are DATA, the card markup is generated
   from that data, and the SAME rendering code will later be reused
   by js/data/subjects.js once the real Subjects/Lesson Engine phase
   begins. Adding a new world = adding one object to `worldsData`.
   ================================================================= */

/**
 * WORLDS DATA
 * Each world only changes its VISUAL identity (colors, icon, floating
 * shapes, description). Every world still points to the same lesson
 * engine — that connection is represented here by `startHref`, which
 * all worlds route through in the same way.
 */
const worldsData = [
  {
    id: "science",
    name: "عالم العلوم",
    icon: "🧪",
    desc: "استكشف المختبر، جرّب التجارب، وسافر بين الذرّات والكواكب.",
    w1: "#3A7BFF",
    w2: "#22D3EE",
    difficulty: "متوسط",
    units: 6,
    lessons: 24,
    xp: 320,
    progress: 45,
    locked: false,
    shapes: [
      { icon: "⚛️", top: "14%", left: "12%", delay: "0s" },
      { icon: "🪐", top: "62%", left: "78%", delay: "1.1s" },
      { icon: "🔬", top: "70%", left: "16%", delay: "2s" },
    ],
  },
  {
    id: "english",
    name: "عالم اللغة الإنجليزية",
    icon: "🇬🇧",
    desc: "تجوّل في شوارع لندن، وتحدّث مع شخصيات القصص لتتقن اللغة.",
    w1: "#8B5CF6",
    w2: "#3A7BFF",
    difficulty: "مبتدئ",
    units: 5,
    lessons: 20,
    xp: 210,
    progress: 70,
    locked: false,
    shapes: [
      { icon: "📚", top: "18%", left: "76%", delay: "0.4s" },
      { icon: "💬", top: "60%", left: "14%", delay: "1.4s" },
      { icon: "🎩", top: "68%", left: "80%", delay: "2.2s" },
    ],
  },
  {
    id: "math",
    name: "عالم الرياضيات",
    icon: "➗",
    desc: "ارسم الأشكال، فكّك الألغاز المنطقية، وأتقن الحساب خطوة بخطوة.",
    w1: "#22D3EE",
    w2: "#8B5CF6",
    difficulty: "متقدم",
    units: 8,
    lessons: 32,
    xp: 150,
    progress: 20,
    locked: false,
    shapes: [
      { icon: "📐", top: "16%", left: "14%", delay: "0.6s" },
      { icon: "🔺", top: "64%", left: "78%", delay: "1.6s" },
      { icon: "🔢", top: "70%", left: "18%", delay: "0.2s" },
    ],
  },
  {
    id: "arabic",
    name: "عالم اللغة العربية",
    icon: "📖",
    desc: "تذوّق جمال الخط العربي والشعر، وأبحر في تراث اللغة وثقافتها.",
    w1: "#FF9F45",
    w2: "#8B5CF6",
    difficulty: "متوسط",
    units: 5,
    lessons: 18,
    xp: 90,
    progress: 10,
    locked: false,
    shapes: [
      { icon: "✒️", top: "16%", left: "78%", delay: "0.3s" },
      { icon: "📜", top: "62%", left: "16%", delay: "1.3s" },
      { icon: "🕊️", top: "70%", left: "80%", delay: "2.1s" },
    ],
  },
  {
    id: "social",
    name: "عالم الدراسات الاجتماعية",
    icon: "🌍",
    desc: "ارسم خريطتك الخاصة، واكتشف الحضارات والمعالم عبر التاريخ.",
    w1: "#22D3EE",
    w2: "#FF9F45",
    difficulty: "مبتدئ",
    units: 6,
    lessons: 22,
    xp: 0,
    progress: 0,
    locked: false,
    shapes: [
      { icon: "🗺️", top: "14%", left: "16%", delay: "0.5s" },
      { icon: "🧭", top: "60%", left: "78%", delay: "1.5s" },
      { icon: "🏛️", top: "70%", left: "14%", delay: "2.3s" },
    ],
  },
  {
    id: "ict",
    name: "عالم الحاسوب وتقنية المعلومات",
    icon: "💻",
    desc: "برمج أول مشروع لك، وتعرّف على الروبوتات والذكاء الاصطناعي.",
    w1: "#3A7BFF",
    w2: "#8B5CF6",
    difficulty: "متقدم",
    units: 7,
    lessons: 26,
    xp: 0,
    progress: 0,
    locked: true,
    lockHint: "أكمل عالم الرياضيات أولًا لفتح هذا العالم",
    shapes: [
      { icon: "🤖", top: "16%", left: "78%", delay: "0.2s" },
      { icon: "🧠", top: "62%", left: "16%", delay: "1.2s" },
      { icon: "💾", top: "70%", left: "80%", delay: "2.4s" },
    ],
  },
];

/**
 * Builds the floating decorative icon spans for a world's illustration area.
 */
function buildShapesMarkup(shapes = []) {
  return shapes
    .map(
      (s) => `<span class="world-card__shape" style="top:${s.top}; left:${s.left}; animation-delay:${s.delay}">${s.icon}</span>`
    )
    .join("");
}

/**
 * TEACHER-CONNECTED WORLDS
 * Merges the hand-styled `worldsData` (used for the flavor text,
 * stats, locked/progress demo values, and floating shapes of the
 * original six subjects) with whatever the Teacher Dashboard actually
 * has saved in ContentStore — which is the real source of truth for
 * which subjects exist, and their name/icon/colors.
 *
 * - A subject the teacher edited (same id as a `worldsData` entry)
 *   keeps that entry's flavor/stats but takes the live name/icon/
 *   colors from ContentStore.
 * - A brand-new subject the teacher created (no matching id) gets a
 *   freshly generated card — real unit/lesson counts, sensible
 *   generic defaults for the rest.
 * - A subject the teacher deleted no longer appears, since the list
 *   is now driven by ContentStore instead of the static array alone.
 */
function buildMergedWorlds() {
  if (typeof ContentStore === "undefined") return worldsData;

  const subjects = ContentStore.getSubjects();
  if (!subjects.length) return worldsData;

  return subjects.map((subject) => {
    const demo = worldsData.find((w) => w.id === subject.id);
    const unitsCount = ContentStore.getUnits(subject.id).length;
    const lessonsCount = ContentStore.getLessonCountForSubject(subject.id);

    if (demo) {
      // Existing world: keep its curated flavor/stats, but reflect
      // any edits the teacher made to name/icon/color, and use real
      // counts once the teacher has actually authored content.
      return {
        ...demo,
        name: subject.name,
        icon: subject.icon,
        w1: subject.c1,
        w2: subject.c2,
        units: unitsCount || demo.units,
        lessons: lessonsCount || demo.lessons,
      };
    }

    // Brand-new subject the teacher added — no hand-authored flavor
    // text exists for it yet, so generate something sensible.
    return {
      id: subject.id,
      name: subject.name,
      icon: subject.icon,
      desc: `استكشف وحدات ودروس مادة ${subject.name} خطوة بخطوة.`,
      w1: subject.c1,
      w2: subject.c2,
      difficulty: "متوسط",
      units: unitsCount,
      lessons: lessonsCount,
      xp: 0,
      progress: 0,
      locked: false,
      shapes: [
        { icon: subject.icon, top: "14%", left: "12%", delay: "0s" },
        { icon: "✨", top: "62%", left: "78%", delay: "1.1s" },
        { icon: "📘", top: "70%", left: "16%", delay: "2s" },
      ],
    };
  });
}

/** The world list actually rendered — recomputed each render so the
 *  page always reflects the latest ContentStore state, including for
 *  the click handler's `.find()` lookups below. */
let renderedWorlds = worldsData;

/**
 * Builds the full markup for a single world card from a world data object.
 */
function buildWorldCard(world) {
  const lockedClass = world.locked ? " world-card--locked" : "";
  const lockBadge = world.locked ? `<span class="world-card__lock-badge">🔒</span>` : "";
  const startLabel = world.locked ? "🔒 مقفل" : "ابدأ المغامرة 🚀";
  const startClass = world.locked ? "world-card__start world-card__start--locked" : "world-card__start";

  return `
    <article class="world-card${lockedClass}" data-world-id="${world.id}" style="--w1:${world.w1}; --w2:${world.w2}">
      <div class="world-card__art">
        <span class="world-card__difficulty">${world.difficulty}</span>
        ${lockBadge}
        ${buildShapesMarkup(world.shapes)}
        <span class="world-card__icon">${world.icon}</span>
      </div>

      <div class="world-card__body">
        <h3 class="world-card__name">${world.name}</h3>
        <p class="world-card__desc">${world.desc}</p>

        <div class="world-card__meta">
          <span>📦 ${world.units} وحدات</span>
          <span>📘 ${world.lessons} درس</span>
          <span>⭐ ${world.xp} XP</span>
        </div>

        <div>
          <div class="world-card__progress-label">
            <span>التقدم</span>
            <span>${world.progress}%</span>
          </div>
          <div class="world-card__bar">
            <span class="world-card__bar-fill" style="width:${world.progress}%"></span>
          </div>
        </div>

        <button type="button" class="${startClass}" data-world-id="${world.id}" ${world.locked ? "aria-disabled=\"true\"" : ""}>
          ${startLabel}
        </button>
        <p class="world-card__hint" data-hint-for="${world.id}">${world.locked ? "" : ""}</p>
      </div>
    </article>
  `;
}

/**
 * Renders every world card, plus one expandable "add a new world"
 * placeholder card at the end — this is the visual promise that the
 * grid supports unlimited future subjects without any layout changes.
 */
function renderWorlds() {
  const grid = document.getElementById("worldsGrid");
  if (!grid) return;

  renderedWorlds = buildMergedWorlds();
  const cardsMarkup = renderedWorlds.map(buildWorldCard).join("");

  const addWorldMarkup = `
    <article class="world-card world-card--add">
      <span class="world-card--add-icon">➕</span>
      <h3>أضف عالمًا جديدًا</h3>
      <p>يمكن للمعلم إضافة مادة دراسية جديدة كعالم مستقل في أي وقت</p>
    </article>
  `;

  grid.innerHTML = cardsMarkup + addWorldMarkup;
}

/**
 * Plays the full-screen "portal" transition using the clicked world's
 * own colors and icon, giving the feeling of stepping into that world,
 * then hands off to that subject's Units page once the animation has
 * had its moment.
 */
function playPortalTransition(world) {
  const overlay = document.getElementById("portalOverlay");
  const burst = document.getElementById("portalBurst");
  const icon = document.getElementById("portalIcon");
  const nameEl = document.getElementById("portalWorldName");
  if (!overlay || !burst || !icon || !nameEl) return;

  overlay.style.setProperty("--pw1", world.w1);
  overlay.style.setProperty("--pw2", world.w2);
  icon.textContent = world.icon;
  nameEl.textContent = world.name;

  overlay.classList.add("is-active");

  window.setTimeout(() => {
    window.location.href = `units.html?world=${encodeURIComponent(world.id)}`;
  }, 1400);
}

/**
 * Gives a locked world card a quick "shake" and shows its unlock hint
 * instead of starting the portal transition.
 */
function shakeLockedWorld(world, card) {
  const hint = card.querySelector(`[data-hint-for="${world.id}"]`);
  card.classList.add("is-shaking");
  if (hint) hint.textContent = world.lockHint || "أكمل العالم السابق أولًا لفتح هذا العالم";

  window.setTimeout(() => card.classList.remove("is-shaking"), 400);

  if (typeof EduBot !== "undefined") {
    EduBot.encourage(
      "Not yet! Finish the world before this one to unlock it \u2014 you'll get there \uD83C\uDF1F",
      world.lockHint || "أكمل العالم السابق أولًا لفتح هذا العالم"
    );
  }
}

/**
 * Wires up clicks anywhere on a world card (icon, artwork, body, or
 * the "Start Adventure" button) via one delegated listener on the
 * grid, so newly rendered/future world cards work automatically
 * without extra listeners.
 *
 * BUGFIX: the previous version only matched clicks on the literal
 * <button> element (`event.target.closest("[data-world-id]")` then
 * required `tagName === "BUTTON"`). Because the world icon/art lives
 * OUTSIDE the button (inside `.world-card__art`), `closest()` from an
 * icon click resolved to the outer `<article data-world-id>` first —
 * which isn't a button — so the check silently failed and the click
 * did nothing. Tapping the icon (or anywhere else on the card) looked
 * "dead" even though the button itself still worked.
 *
 * Fix: resolve the WORLD from the closest `.world-card` (the article
 * always carries `data-world-id`), regardless of which inner element
 * was actually clicked. This makes the entire card a click target
 * while still fully supporting keyboard/AT users via the real button.
 */
function setupStartAdventureButtons() {
  const grid = document.getElementById("worldsGrid");
  if (!grid) return;

  grid.addEventListener("click", (event) => {
    const card = event.target.closest(".world-card[data-world-id]");
    if (!card) return;

    const world = renderedWorlds.find((w) => w.id === card.dataset.worldId);
    if (!world) return;

    if (world.locked) {
      shakeLockedWorld(world, card);
      return;
    }

    playPortalTransition(world);
  });

  // Note: keyboard/AT users are already fully served by the real
  // `.world-card__start` <button> inside each card (native Enter/Space
  // + Tab support). We deliberately don't make the whole `<article>`
  // a second focusable/tabbable target — that would create a
  // confusing duplicate tab stop for the exact same action.
}

/**
 * Page entry point.
 */
function initLearningWorldsPage() {
  renderWorlds();
  setupStartAdventureButtons();

  // Re-run the shared scroll-reveal observer on this page's own
  // .reveal elements (hero eyebrow/title/subtitle) — main.js already
  // registers one on DOMContentLoaded, so nothing extra is needed here.
}

document.addEventListener("DOMContentLoaded", initLearningWorldsPage);
