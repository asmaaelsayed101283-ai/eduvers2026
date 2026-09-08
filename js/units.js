/* =================================================================
   EDUVERSE — UNITS ENGINE SCRIPT
   Vanilla JS, no frameworks. This file must never reference one
   specific subject by name in its logic — every subject is looked
   up from `subjectsMeta` by the `world` URL parameter, and every
   unit card is built by the same `buildUnitCard()` function.

   Example usage from Learning Worlds: units.html?world=science
   ================================================================= */

/**
 * SUBJECT VISUAL IDENTITY LOOKUP
 * Mirrors the world identities used on learning-worlds.html so the
 * banner matches the world the student came from. A "general"
 * fallback keeps the page fully functional even with no ?world=
   param — the engine is never tied to one subject by default.
 */
const subjectsMeta = {
  general: {
    name: "مادتك الدراسية",
    icon: "📘",
    desc: "اختر وحدة لتبدأ رحلتك التعليمية.",
    w1: "#3A7BFF",
    w2: "#8B5CF6",
    shapes: ["✨", "📘", "⭐"],
  },
  science: {
    name: "عالم العلوم",
    icon: "🧪",
    desc: "أكمل وحدات العلوم لتكتشف أسرار المختبر والكون.",
    w1: "#3A7BFF",
    w2: "#22D3EE",
    shapes: ["⚛️", "🪐", "🔬"],
  },
  english: {
    name: "عالم اللغة الإنجليزية",
    icon: "🇬🇧",
    desc: "أكمل الوحدات لتتقن المحادثة والمفردات خطوة بخطوة.",
    w1: "#8B5CF6",
    w2: "#3A7BFF",
    shapes: ["📚", "💬", "🎩"],
  },
  math: {
    name: "عالم الرياضيات",
    icon: "➗",
    desc: "أكمل الوحدات لتتقن الأرقام والأشكال والمنطق.",
    w1: "#22D3EE",
    w2: "#8B5CF6",
    shapes: ["📐", "🔺", "🔢"],
  },
  arabic: {
    name: "عالم اللغة العربية",
    icon: "📖",
    desc: "أكمل الوحدات لتتقن الخط والشعر ولغتك الأم.",
    w1: "#FF9F45",
    w2: "#8B5CF6",
    shapes: ["✒️", "📜", "🕊️"],
  },
  social: {
    name: "عالم الدراسات الاجتماعية",
    icon: "🌍",
    desc: "أكمل الوحدات لتكتشف الخرائط والحضارات والتاريخ.",
    w1: "#22D3EE",
    w2: "#FF9F45",
    shapes: ["🗺️", "🧭", "🏛️"],
  },
  ict: {
    name: "عالم الحاسوب وتقنية المعلومات",
    icon: "💻",
    desc: "أكمل الوحدات لتتعلم البرمجة والذكاء الاصطناعي.",
    w1: "#3A7BFF",
    w2: "#8B5CF6",
    shapes: ["🤖", "🧠", "💾"],
  },
};

/**
 * STUDENT STATUS (sample data)
 * Subject-independent: the same header logic runs no matter which
 * world the student is in.
 */
const studentStatus = {
  level: 4,
  xp: 1250,
  coins: 430,
  overallProgress: 42,
  achievements: ["🔥", "🏅", "🎯"],
};

/**
 * UNITS DATA (sample / generic)
 * Deliberately generic titles ("الوحدة 1: المقدمة"...) so the exact
 * same array shape works for any subject once real content is wired
 * up later. Status drives which button/state each card shows:
 * "completed" | "in-progress" | "unlocked" | "locked".
 */
const unitsData = [
  {
    number: 1,
    title: "الوحدة الأولى: المقدمة",
    icon: "🌱",
    desc: "الخطوات الأولى في هذا العالم التعليمي ومفاهيمه الأساسية.",
    lessons: 4,
    time: "35 دقيقة",
    difficulty: "مبتدئ",
    progress: 100,
    xp: 80,
    coins: 30,
    stars: 3,
    status: "completed",
  },
  {
    number: 2,
    title: "الوحدة الثانية: البناء عليه",
    icon: "🧩",
    desc: "تعميق الفهم من خلال أنشطة وتمارين تفاعلية.",
    lessons: 5,
    time: "45 دقيقة",
    difficulty: "مبتدئ",
    progress: 100,
    xp: 95,
    coins: 35,
    stars: 2,
    status: "completed",
  },
  {
    number: 3,
    title: "الوحدة الثالثة: التطبيق العملي",
    icon: "🎯",
    desc: "استخدام ما تعلمته في مهام وتحديات عملية.",
    lessons: 6,
    time: "50 دقيقة",
    difficulty: "متوسط",
    progress: 55,
    xp: 40,
    coins: 15,
    stars: 0,
    status: "in-progress",
  },
  {
    number: 4,
    title: "الوحدة الرابعة: تحدٍّ جديد",
    icon: "🚀",
    desc: "مفاهيم أكثر تقدمًا مع أنشطة أكثر تشويقًا.",
    lessons: 5,
    time: "40 دقيقة",
    difficulty: "متوسط",
    progress: 0,
    xp: 0,
    coins: 0,
    stars: 0,
    status: "unlocked",
  },
  {
    number: 5,
    title: "الوحدة الخامسة: الإتقان",
    icon: "🏔️",
    desc: "تحديات أعمق تختبر فهمك لكل ما سبق.",
    lessons: 6,
    time: "55 دقيقة",
    difficulty: "متقدم",
    progress: 0,
    xp: 0,
    coins: 0,
    stars: 0,
    status: "locked",
  },
  {
    number: 6,
    title: "الوحدة السادسة: المشروع الختامي",
    icon: "🏆",
    desc: "مهمة شاملة تجمع كل مهارات هذه المادة معًا.",
    lessons: 4,
    time: "60 دقيقة",
    difficulty: "متقدم",
    progress: 0,
    xp: 0,
    coins: 0,
    stars: 0,
    status: "locked",
  },
];

/**
 * Reads ?world=<id> from the URL and returns the matching subject
 * identity. Prefers the live ContentStore (so a teacher's edited
 * name/icon/colors show up here too), falls back to the hardcoded
 * `subjectsMeta` for its extra flavor text (desc/shapes), and finally
 * to the generic identity if the subject doesn't exist anywhere.
 */
function getSelectedSubject() {
  const params = new URLSearchParams(window.location.search);
  const worldId = params.get("world");
  const demo = subjectsMeta[worldId];

  if (typeof ContentStore !== "undefined") {
    const live = ContentStore.getSubjectById(worldId);
    if (live) {
      return {
        name: live.name,
        icon: live.icon,
        desc: demo?.desc || `أكمل وحدات مادة ${live.name} خطوة بخطوة.`,
        w1: live.c1,
        w2: live.c2,
        shapes: demo?.shapes || [live.icon, "✨", "📘"],
      };
    }
  }

  return demo || subjectsMeta.general;
}

/**
 * TEACHER-CONNECTED UNITS
 * Converts one real ContentStore unit into the same card shape
 * `buildUnitCard()` already knows how to render, filling in sensible
 * defaults for the purely cosmetic fields the Teacher Dashboard
 * doesn't collect (icon/desc/time/progress) so the card never looks
 * broken or half-empty.
 */
function mapContentUnitToCard(unit, index, worldId) {
  const lessons = typeof ContentStore !== "undefined" ? ContentStore.getPublishedLessons(unit.id) : [];
  const subjectProgress =
    typeof Progress !== "undefined" ? Progress.getSubjectProgress(worldId) : { completedLessons: [] };
  const lessonIds = lessons.map((l) => l.id);
  const allLessonsDone = lessonIds.length > 0 && lessonIds.every((id) => subjectProgress.completedLessons.includes(id));

  return {
    number: index + 1,
    contentUnitId: unit.id,
    title: unit.title,
    icon: "📦",
    desc: lessons.length ? `${lessons.length} ${lessons.length === 1 ? "درس" : "دروس"} في هذه الوحدة.` : "لا توجد دروس منشورة بعد في هذه الوحدة.",
    lessons: lessons.length,
    lessonsList: lessons.map((l) => ({
      id: l.id,
      title: l.title,
      xp: l.xp || 0,
      coins: l.coins || 0,
      done: subjectProgress.completedLessons.includes(l.id),
      href:
        l.id === "l-science-1"
          ? "lesson1.html"
          : `lesson-engine.html?world=${encodeURIComponent(worldId || "general")}&lessonId=${encodeURIComponent(l.id)}`,
    })),
    time: `${Math.max(lessons.length, 1) * 15} دقيقة`,
    difficulty: unit.difficulty || "متوسط",
    grade: unit.grade && unit.grade !== "all" ? unit.grade : null,
    progress: allLessonsDone ? 100 : 0,
    xp: lessons.reduce((sum, l) => sum + (l.xp || 0), 0),
    coins: lessons.reduce((sum, l) => sum + (l.coins || 0), 0),
    stars: allLessonsDone ? 3 : 0,
    status: lessons.length === 0 ? "empty" : allLessonsDone ? "completed" : "unlocked",
  };
}

/**
 * Paints the subject banner (colors, icon, title, description,
 * breadcrumb, floating shapes) for the selected subject.
 */
function renderSubjectBanner(subject) {
  const banner = document.getElementById("subjectBanner");
  const shapesField = document.getElementById("subjectBannerShapes");
  const iconEl = document.getElementById("subjectIcon");
  const titleEl = document.getElementById("subjectTitle");
  const descEl = document.getElementById("subjectDesc");
  const breadcrumbEl = document.getElementById("breadcrumbSubject");
  if (!banner) return;

  banner.style.setProperty("--w1", subject.w1);
  banner.style.setProperty("--w2", subject.w2);
  if (iconEl) iconEl.textContent = subject.icon;
  if (titleEl) titleEl.textContent = subject.name;
  if (descEl) descEl.textContent = subject.desc;
  if (breadcrumbEl) breadcrumbEl.textContent = subject.name;

  if (shapesField) {
    const positions = [
      { top: "18%", left: "10%" },
      { top: "60%", left: "88%" },
      { top: "70%", left: "20%" },
    ];
    shapesField.innerHTML = subject.shapes
      .map((icon, i) => {
        const pos = positions[i] || positions[0];
        return `<span class="subject-banner__shape" style="top:${pos.top}; left:${pos.left}; animation-delay:${i * 0.7}s">${icon}</span>`;
      })
      .join("");
  }
}

/**
 * Animates a number from 0 to `target` inside `el` (ease-out cubic).
 * Shared by the XP and Coins counters in the status bar.
 */
function countUp(el, target, duration = 1100) {
  if (!el) return;
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased).toLocaleString("ar");
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/**
 * Fills in the student status row: overall progress bar, level,
 * animated XP/coins counters, and achievement badge previews.
 */
function renderStudentStatus() {
  const progressFill = document.getElementById("overallProgressFill");
  const progressLabel = document.getElementById("overallProgressLabel");
  const levelEl = document.getElementById("levelValue");
  const xpEl = document.getElementById("xpValue");
  const coinsEl = document.getElementById("coinsValue");
  const achievementsEl = document.getElementById("achievementsPreview");

  if (levelEl) levelEl.textContent = studentStatus.level;
  if (progressLabel) progressLabel.textContent = `${studentStatus.overallProgress}%`;

  // Animate the progress bar fill on next frame so the CSS transition triggers.
  if (progressFill) {
    requestAnimationFrame(() => {
      progressFill.style.width = `${studentStatus.overallProgress}%`;
    });
  }

  countUp(xpEl, studentStatus.xp);
  countUp(coinsEl, studentStatus.coins);

  if (achievementsEl) {
    achievementsEl.innerHTML = studentStatus.achievements
      .map((icon) => `<span class="achv-badge">${icon}</span>`)
      .join("");
  }
}

/**
 * Builds the markup for a single unit card based on its status.
 * The same function renders completed, in-progress, unlocked, and
 * locked units — only the data differs.
 */
function buildUnitCard(unit, subject, worldId) {
  const isLocked = unit.status === "locked";
  const isCompleted = unit.status === "completed";
  const isInProgress = unit.status === "in-progress";
  const isEmpty = unit.status === "empty";

  let actionClass = "unit-card__action";
  let actionLabel = "ابدأ الوحدة 🚀";

  if (isLocked) {
    actionClass += " unit-card__action--locked";
    actionLabel = "🔒 مقفلة";
  } else if (isEmpty) {
    actionClass += " unit-card__action--locked";
    actionLabel = "🕓 لا توجد دروس منشورة بعد";
  } else if (isInProgress) {
    actionClass += " unit-card__action--continue";
    actionLabel = "متابعة ▶";
  } else if (isCompleted) {
    actionClass += " unit-card__action--review";
    actionLabel = "مراجعة ✓";
  }

  const lockOverlay = isLocked
    ? `<div class="unit-card__lock-overlay"><span class="unit-card__lock-icon">🔒</span></div>`
    : "";

  const completedBadge = isCompleted
    ? `<div class="unit-card__completed-badge">✔ مكتملة
        <span class="unit-card__stars">${"⭐".repeat(unit.stars)}${"☆".repeat(3 - unit.stars)}</span>
       </div>`
    : "";

  const cardStateClass = isLocked ? " unit-card--locked" : isCompleted ? " unit-card--completed" : "";
  const contentUnitAttr = unit.contentUnitId ? ` data-content-unit-id="${unit.contentUnitId}"` : "";

  // Content-store-backed units (a teacher actually created this unit)
  // list every published lesson individually, each with its own
  // start link — instead of the single "start unit" shortcut that
  // used to only ever open the first lesson. Generic/demo units
  // (unit.lessonsList undefined) keep the original single button,
  // completely unchanged.
  const hasLessonsList = Array.isArray(unit.lessonsList);
  const lessonsListHtml = hasLessonsList
    ? unit.lessonsList.length
      ? `
        <div class="unit-card__lessons">
          ${unit.lessonsList
            .map(
              (l) => `
            <a class="unit-lesson-card${l.done ? " is-done" : ""} has-ripple" href="${l.href}">
              <span class="unit-lesson-card__icon">${l.done ? "✅" : "📘"}</span>
              <span class="unit-lesson-card__body">
                <strong class="unit-lesson-card__title">${l.title}</strong>
                <span class="unit-lesson-card__meta">
                  <span class="unit-lesson-card__xp">⭐ ${l.xp} XP</span>
                  <span class="unit-lesson-card__status">${l.done ? "مكتمل" : "لم يبدأ بعد"}</span>
                </span>
              </span>
              <span class="unit-lesson-card__start">${l.done ? "مراجعة ↺" : "ابدأ الدرس 🚀"}</span>
            </a>`
            )
            .join("")}
        </div>`
      : `<p class="unit-card__empty-lessons">🕓 لا توجد دروس منشورة بعد في هذه الوحدة.</p>`
    : "";

  const actionButtonHtml = hasLessonsList
    ? ""
    : `
        <button type="button" class="${actionClass} has-ripple" data-unit-number="${unit.number}"${contentUnitAttr} ${isLocked ? 'aria-disabled="true"' : ""}>
          ${actionLabel}
        </button>`;

  return `
    <article class="unit-card${cardStateClass}" data-unit-number="${unit.number}" data-status="${unit.status}"${contentUnitAttr} style="--w1:${subject.w1}; --w2:${subject.w2}">
      ${lockOverlay}
      <div class="unit-card__art">
        <span class="unit-card__number">الوحدة ${unit.number}</span>
        <span class="unit-card__difficulty">${unit.difficulty}</span>
        <span class="unit-card__icon">${unit.icon}</span>
      </div>

      <div class="unit-card__body">
        <h3 class="unit-card__title">${unit.title}</h3>
        <p class="unit-card__desc">${unit.desc}</p>

        <div class="unit-card__meta">
          <span>📘 ${unit.lessons} دروس</span>
          <span>⏱️ ${unit.time}</span>
          ${unit.grade && typeof getGradeLabel === "function" ? `<span>🎓 ${getGradeLabel(unit.grade)}</span>` : ""}
        </div>

        ${completedBadge}

        <div>
          <div class="unit-card__progress-label">
            <span>التقدم</span>
            <span>${unit.progress}%</span>
          </div>
          <div class="unit-card__bar">
            <span class="unit-card__bar-fill" data-target-width="${unit.progress}" style="width:0%"></span>
          </div>
        </div>

        <div class="unit-card__rewards">
          <span>⭐ ${unit.xp} XP</span>
          <span>🪙 ${unit.coins}</span>
        </div>

        ${lessonsListHtml}

        ${actionButtonHtml}
      </div>
    </article>
  `;
}

/**
 * Renders every unit card for the current subject. If the teacher has
 * created real units for this subject in ContentStore, those are used
 * (so "Any unit created must appear inside that subject" actually
 * happens); otherwise the generic demo `unitsData` fills the page,
 * exactly as before — so subjects a teacher hasn't touched yet still
 * look complete instead of empty.
 */
function renderUnits(subject, worldId) {
  const path = document.getElementById("unitsPath");
  if (!path) return;

  const realUnits = typeof ContentStore !== "undefined" ? ContentStore.getUnits(worldId) : [];
  const units = realUnits.length
    ? realUnits.map((u, i) => mapContentUnitToCard(u, i, worldId))
    : unitsData;

  path.innerHTML = units.map((unit) => buildUnitCard(unit, subject, worldId)).join("");

  // Trigger each unit's progress-bar fill animation on next frame.
  requestAnimationFrame(() => {
    path.querySelectorAll(".unit-card__bar-fill").forEach((fill) => {
      fill.style.width = `${fill.dataset.targetWidth}%`;
    });
  });
}

/**
 * Adds a shake animation to a locked unit card when its action
 * button is clicked, signalling it must be unlocked first.
 */
function shakeLockedUnit(card) {
  card.classList.add("is-shaking");
  window.setTimeout(() => card.classList.remove("is-shaking"), 400);

  if (typeof EduBot !== "undefined") {
    EduBot.encourage(
      "This unit is still locked \u2014 finish the one before it first. You're closer than you think! \uD83D\uDCAA",
      "الوحدة دي لسه مقفولة، كمّل اللي قبلها الأول. أنت قريب خلاص."
    );
  }
}

/**
 * Spawns a ripple span at the click position inside any
 * `.has-ripple` button and removes it once the animation ends.
 */
function spawnRipple(button, event) {
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const ripple = document.createElement("span");

  ripple.className = "ripple";
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${event.clientY - rect.top - size / 2}px`;

  button.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
}

/**
 * Delegated click handler for all unit action buttons: ripple effect
 * always plays, then locked units shake. Unlocked units navigate to
 * their first lesson:
 *   - A real ContentStore unit routes to that lesson's real content —
 *     the flagship, fully-authored Science/Unit-1 lesson still opens
 *     lesson1.html directly (unchanged, existing feature preserved);
 *     every other real lesson opens lesson-engine.html?lessonId=<id>,
 *     which loads that lesson's content automatically.
 *   - A unit with no lessons yet, or a demo/placeholder unit (no
 *     teacher content authored for this subject), falls back to the
 *     generic themed Lesson Engine exactly as before.
 */
function setupUnitActions(worldId) {
  const path = document.getElementById("unitsPath");
  if (!path) return;

  path.addEventListener("click", (event) => {
    const button = event.target.closest(".unit-card__action");
    if (!button) return;

    spawnRipple(button, event);

    const card = button.closest(".unit-card");
    if (button.classList.contains("unit-card__action--locked")) {
      shakeLockedUnit(card);
      return;
    }

    const unitNumber = card?.dataset.unitNumber;
    const contentUnitId = card?.dataset.contentUnitId;
    let destination = `lesson-engine.html?world=${encodeURIComponent(worldId || "general")}&unit=${encodeURIComponent(unitNumber || "1")}`;

    if (contentUnitId && typeof ContentStore !== "undefined") {
      const firstLesson = ContentStore.getLessons(contentUnitId)[0];
      if (firstLesson) {
        destination =
          firstLesson.id === "l-science-1"
            ? "lesson1.html"
            : `lesson-engine.html?world=${encodeURIComponent(worldId || "general")}&lessonId=${encodeURIComponent(firstLesson.id)}`;
      }
    } else if (worldId === "science" && unitNumber === "1") {
      destination = "lesson1.html";
    }

    window.setTimeout(() => {
      window.location.href = destination;
    }, 250);
  });
}

/**
 * Page entry point.
 */
function initUnitsPage() {
  const params = new URLSearchParams(window.location.search);
  const worldId = params.get("world");
  const subject = getSelectedSubject();

  renderSubjectBanner(subject);
  renderStudentStatus();
  renderUnits(subject, worldId);
  setupUnitActions(worldId);
}

document.addEventListener("DOMContentLoaded", initUnitsPage);
