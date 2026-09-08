/* =================================================================
   EDUVERSE — CORE GAMIFICATION SYSTEM
   =================================================================
   Loaded as a plain classic script (not type="module") so the
   platform works when opened directly from disk (file://) as well
   as from any static host — ES modules are blocked by CORS under
   file:// in Chrome/Edge, which silently disables all interactivity.

   Its functions are declared at top level, so once this script has
   loaded on a page, any script loaded AFTER it on that same page can
   call them directly as globals:

       addXP(40, "mission-complete");

   It never references a subject or lesson by name — it only knows
   about generic events (mission complete, lesson complete, perfect
   quiz score, daily login) and generic rewards (XP, coins, levels,
   badges). Persistence uses localStorage today, matching the
   platform's "no backend yet, Firebase-ready later" architecture —
   swapping the storage layer later will not require changing the
   functions below.

   This file also renders + wires up the demo/showcase page
   (gamification.html) that visualizes this engine's state.
   ================================================================= */

const STORAGE_KEY = "eduverse:gamification:state";

/* -----------------------------------------------------------------
   LEVEL SYSTEM
   Cumulative XP required to REACH each level. Level 10 is currently
   the highest defined level; reaching it is treated as "max level"
   until more levels are added here later.
   ----------------------------------------------------------------- */
const LEVELS = [
  { level: 1, xpRequired: 0 },
  { level: 2, xpRequired: 100 },
  { level: 3, xpRequired: 250 },
  { level: 4, xpRequired: 450 },
  { level: 5, xpRequired: 700 },
  { level: 6, xpRequired: 1000 },
  { level: 7, xpRequired: 1350 },
  { level: 8, xpRequired: 1750 },
  { level: 9, xpRequired: 2200 },
  { level: 10, xpRequired: 2700 },
];

/* -----------------------------------------------------------------
   BADGE DEFINITIONS
   Reusable across every subject. `registerBadge()` below lets a
   future teacher-facing tool add unlimited new badges without
   touching this array's existing entries or any rendering code.
   ----------------------------------------------------------------- */
let badges = [
  { id: "explorer", icon: "🧭", name: "المستكشف", desc: "دخلت أول عالم تعلّم", unlocked: true },
  { id: "scientist", icon: "🔬", name: "العالِم", desc: "أنهيت وحدة كاملة في العلوم", unlocked: true },
  { id: "reader", icon: "📖", name: "القارئ", desc: "أكملت 5 دروس قراءة", unlocked: false },
  { id: "problem-solver", icon: "🧩", name: "حلّال المشكلات", desc: "اجتزت 10 تحديات", unlocked: false },
  { id: "champion", icon: "🏆", name: "البطل", desc: "وصلت إلى المستوى 10", unlocked: false },
  { id: "fast-learner", icon: "⚡", name: "المتعلّم السريع", desc: "أكملت درسًا بسرعة قياسية", unlocked: true },
  { id: "perfect-score", icon: "💯", name: "العلامة الكاملة", desc: "حصلت على علامة كاملة في اختبار", unlocked: false },
  { id: "daily-hero", icon: "🔥", name: "بطل الاستمرارية", desc: "سجّلت الدخول 7 أيام متتالية", unlocked: false },
];

/**
 * Adds a brand-new badge definition to the system. This is the
 * extension point a future "teacher" admin UI would call — the
 * badge gallery re-renders automatically, no other code changes.
 */
function registerBadge({ id, icon, name, desc, unlocked = false }) {
  if (badges.some((b) => b.id === id)) return;
  badges.push({ id, icon, name, desc, unlocked });
  renderBadgeGrid();
  saveState();
}

/* -----------------------------------------------------------------
   STUDENT STATE
   ----------------------------------------------------------------- */
const defaultState = {
  name: "طالب EduVerse",
  avatar: "🧑‍🚀",
  grade: "الصف الخامس الابتدائي",
  gradeId: "grade5",
  schoolName: "مدرسة EduVerse",
  teacherName: "فريق EduVerse",
  xp: 60,
  coins: 45,
  completedLessons: 1,
  completedUnits: 0,
  unlockedBadgeIds: ["explorer", "scientist", "fast-learner"],
};

let state = loadState();

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultState };
    const saved = JSON.parse(raw);
    return { ...defaultState, ...saved };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, unlockedBadgeIds: [...state.unlockedBadgeIds] })
    );
  } catch {
    /* localStorage unavailable — state simply won't persist across reloads */
  }
}

// Keep the `badges[].unlocked` flags in sync with the saved state on load.
badges.forEach((b) => {
  if (state.unlockedBadgeIds.includes(b.id)) b.unlocked = true;
});

/**
 * Computes level, XP-into-level, XP-needed-for-next-level, and
 * progress percentage for a given total XP value.
 */
function getLevelInfo(xp) {
  let current = LEVELS[0];
  let next = LEVELS[1] || null;

  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xpRequired) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
    }
  }

  const isMaxLevel = !next;
  const xpIntoLevel = xp - current.xpRequired;
  const xpForNextLevel = next ? next.xpRequired - current.xpRequired : xpIntoLevel;
  const progressPct = isMaxLevel ? 100 : Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100));

  return { level: current.level, xpIntoLevel, xpForNextLevel, progressPct, isMaxLevel };
}

/* -----------------------------------------------------------------
   PUBLIC ENGINE API (global functions)
   ----------------------------------------------------------------- */

/** Human-readable labels for the achievement popup, per XP source. */
const XP_REASON_LABELS = {
  "mission-complete": "مهمة مكتملة",
  "lesson-complete": "درس مكتمل",
  "perfect-quiz": "نتيجة كاملة في الاختبار",
  "daily-login": "تسجيل الدخول اليومي",
};

/**
 * Awards XP to the student, updates all rendered UI, and shows an
 * achievement popup. If the new XP total crosses a level threshold,
 * the Level Up celebration overlay plays automatically.
 */
function addXP(amount, reason = "mission-complete") {
  const beforeLevel = getLevelInfo(state.xp).level;
  state.xp += amount;
  saveState();

  enqueuePopup({ icon: "⭐", title: `+${amount} XP`, detail: XP_REASON_LABELS[reason] || "" });

  renderProfileCard();
  renderLevelCard();

  const afterLevel = getLevelInfo(state.xp).level;
  if (afterLevel > beforeLevel) triggerLevelUp(afterLevel);
}

/** Awards EduCoins to the student and shows an achievement popup. */
function addCoins(amount, reason = "reward") {
  state.coins += amount;
  saveState();
  enqueuePopup({ icon: "🪙", title: `+${amount} EduCoins`, detail: reason === "reward" ? "مكافأة عملات" : reason });
  renderProfileCard();
}

/** Unlocks a badge by id (no-op if already unlocked or unknown). */
function unlockBadge(badgeId) {
  const badge = badges.find((b) => b.id === badgeId);
  if (!badge || badge.unlocked) return;

  badge.unlocked = true;
  if (!state.unlockedBadgeIds.includes(badgeId)) state.unlockedBadgeIds.push(badgeId);
  saveState();

  enqueuePopup({ icon: badge.icon, title: "شارة جديدة!", detail: badge.name });
  renderBadgeGrid();
  renderProfileCard();

  if (typeof EduBot !== "undefined") {
    EduBot.celebrate(
      `You unlocked the "${badge.name}" badge! ${badge.icon} Amazing work.`,
      `فتحت شارة "${badge.name}"! أحسنت.`
    );
  }
}

/** Marks one more lesson as completed (used by the "lesson" demo button). */
function recordLessonCompleted() {
  state.completedLessons += 1;
  saveState();
  renderProfileCard();
}

/* -----------------------------------------------------------------
   PROFILE / SNAPSHOT ACCESSORS
   Read-only helpers other modules (e.g. the Final Achievement
   Certificate) can use instead of duplicating or reaching into this
   file's private `state`/`badges` variables. Nothing here changes
   existing behavior — these only expose data that already exists.
   ----------------------------------------------------------------- */

/** The student-identity fields used on documents like the
 *  Final Achievement Certificate. Always reflects localStorage —
 *  never hardcoded by a caller. */
function getStudentProfile() {
  return {
    name: state.name,
    grade: state.grade,
    gradeId: state.gradeId,
    schoolName: state.schoolName,
    teacherName: state.teacherName,
  };
}

/** Lets any page update one or more profile fields (name, grade,
 *  schoolName, teacherName) — e.g. a future "Edit Profile" screen.
 *  Persists immediately and re-renders the profile card if mounted. */
function updateStudentProfile(patch) {
  Object.assign(state, patch);
  saveState();
  renderProfileCard();
}

/** A read-only snapshot of the student's core stats. */
function getGamificationSnapshot() {
  return {
    xp: state.xp,
    coins: state.coins,
    level: getLevelInfo(state.xp).level,
    completedLessons: state.completedLessons,
    unlockedBadgeIds: [...state.unlockedBadgeIds],
  };
}

/** Looks up a badge's display info (icon/name/desc/unlocked) by id. */
function getBadgeById(badgeId) {
  const badge = badges.find((b) => b.id === badgeId);
  return badge ? { ...badge } : null;
}

/* -----------------------------------------------------------------
   ACHIEVEMENT POPUP QUEUE
   Popups are queued and shown one at a time so rapid-fire events
   (e.g. XP + a badge unlocking together) don't overlap illegibly.
   ----------------------------------------------------------------- */
const popupQueue = [];
let isPopupShowing = false;

function enqueuePopup(data) {
  popupQueue.push(data);
  processPopupQueue();
}

function processPopupQueue() {
  if (isPopupShowing || popupQueue.length === 0) return;
  isPopupShowing = true;

  const { icon, title, detail } = popupQueue.shift();
  const layer = document.getElementById("achvPopupLayer");
  if (!layer) {
    isPopupShowing = false;
    return;
  }

  const popup = document.createElement("div");
  popup.className = "achv-popup";
  popup.innerHTML = `
    <span class="achv-popup__icon">${icon}</span>
    <div>
      <div class="achv-popup__title">${title}</div>
      ${detail ? `<div class="achv-popup__detail">${detail}</div>` : ""}
    </div>
  `;
  layer.appendChild(popup);

  requestAnimationFrame(() => popup.classList.add("is-visible"));

  window.setTimeout(() => {
    popup.classList.remove("is-visible");
    window.setTimeout(() => {
      popup.remove();
      isPopupShowing = false;
      processPopupQueue();
    }, 450);
  }, 2200);
}

/* -----------------------------------------------------------------
   LEVEL UP CELEBRATION
   ----------------------------------------------------------------- */
function triggerLevelUp(newLevel) {
  const overlay = document.getElementById("levelUpOverlay");
  const levelEl = document.getElementById("levelUpNewLevel");
  const confettiField = document.getElementById("levelUpConfetti");
  if (!overlay) return;

  if (levelEl) levelEl.textContent = newLevel;
  overlay.classList.add("is-active");

  if (confettiField) {
    confettiField.innerHTML = "";
    const colors = ["#3A7BFF", "#8B5CF6", "#22D3EE", "#FF9F45"];
    for (let i = 0; i < 22; i++) {
      const dot = document.createElement("span");
      dot.className = "confetti-dot";
      const angle = Math.random() * Math.PI * 2;
      const distance = 90 + Math.random() * 70;
      dot.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
      dot.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);
      dot.style.setProperty("--rot", `${Math.random() * 360}deg`);
      dot.style.setProperty("--c", colors[i % colors.length]);
      dot.style.animationDelay = `${Math.random() * 0.15}s`;
      confettiField.appendChild(dot);
    }
  }

  if (typeof EduBot !== "undefined") {
    window.setTimeout(() => {
      EduBot.celebrate(
        `Level ${newLevel}! \uD83C\uDF89 You're making real progress \u2014 keep it up!`,
        `المستوى ${newLevel}! تقدّم رائع، كمّل كده.`
      );
    }, 1600);
  }
}

function closeLevelUp() {
  document.getElementById("levelUpOverlay")?.classList.remove("is-active");
}

/* -----------------------------------------------------------------
   RENDERING — Student Profile Card, Level Card, Badge Gallery
   ----------------------------------------------------------------- */

function renderProfileCard() {
  const card = document.getElementById("profileCard");
  if (!card) return;

  const { level, xpIntoLevel, xpForNextLevel, progressPct, isMaxLevel } = getLevelInfo(state.xp);
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  card.innerHTML = `
    <div class="profile-card__top">
      <div class="profile-card__avatar-wrap">
        <div class="profile-card__avatar">${state.avatar}</div>
        <span class="profile-card__level-chip">${level}</span>
      </div>
      <div>
        <h2 class="profile-card__name">${state.name}</h2>
        <span class="profile-card__sub">${state.completedLessons} درس مكتمل · ${state.completedUnits} وحدة مكتملة</span>
      </div>
    </div>

    <div>
      <div class="profile-card__progress-label">
        <span>XP إلى المستوى التالي</span>
        <span>${isMaxLevel ? "أعلى مستوى" : `${xpIntoLevel} / ${xpForNextLevel}`}</span>
      </div>
      <div class="profile-card__bar">
        <span class="profile-card__bar-fill" style="width:${progressPct}%"></span>
      </div>
    </div>

    <div class="profile-card__stats">
      <div class="profile-stat"><span class="profile-stat__icon">⭐</span><strong>${state.xp}</strong><span>XP</span></div>
      <div class="profile-stat"><span class="profile-stat__icon">🪙</span><strong>${state.coins}</strong><span>عملة</span></div>
      <div class="profile-stat"><span class="profile-stat__icon">🏅</span><strong>${unlockedCount}</strong><span>شارة</span></div>
      <div class="profile-stat"><span class="profile-stat__icon">📘</span><strong>${state.completedLessons}</strong><span>درس</span></div>
      <div class="profile-stat"><span class="profile-stat__icon">📦</span><strong>${state.completedUnits}</strong><span>وحدة</span></div>
    </div>
  `;
}

function renderLevelCard() {
  const card = document.getElementById("levelCard");
  if (!card) return;

  const { level, xpIntoLevel, xpForNextLevel, progressPct, isMaxLevel } = getLevelInfo(state.xp);

  card.innerHTML = `
    <div class="level-card__current">
      <div class="level-card__badge">Lv ${level}</div>
      <div>
        <div class="level-card__label">مستواك الحالي</div>
        <div class="level-card__needed">
          ${isMaxLevel ? "وصلت لأعلى مستوى متاح!" : `${xpForNextLevel - xpIntoLevel} XP للمستوى التالي`}
        </div>
      </div>
    </div>
    <div class="level-card__bar">
      <span class="level-card__bar-fill" style="width:${progressPct}%"></span>
    </div>
    <p class="level-card__hint">
      ${isMaxLevel ? "أحسنت! هذا أعلى مستوى معرّف حاليًا في النظام 🎉" : `المستوى ${level + 1} يبدأ عند ${xpForNextLevel + (state.xp - xpIntoLevel)} XP إجمالاً`}
    </p>
  `;
}

function renderBadgeGrid() {
  const grid = document.getElementById("badgeGrid");
  if (!grid) return;

  const badgeCards = badges
    .map(
      (b) => `
      <article class="badge-card ${b.unlocked ? "badge-card--unlocked" : "badge-card--locked"}">
        <div class="badge-card__icon">${b.unlocked ? b.icon : "🔒"}</div>
        <div class="badge-card__name">${b.name}</div>
        <div class="badge-card__desc">${b.desc}</div>
      </article>
    `
    )
    .join("");

  const addCard = `
    <article class="badge-card badge-card--add">
      <div class="badge-card__icon">➕</div>
      <div class="badge-card__name">شارة جديدة</div>
      <div class="badge-card__desc">يمكن للمعلم إضافة شارات بلا حدود</div>
    </article>
  `;

  grid.innerHTML = badgeCards + addCard;
}

/* -----------------------------------------------------------------
   RIPPLE EFFECT (shared visual language with other pages)
   ----------------------------------------------------------------- */
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

function setupRippleDelegation() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest(".has-ripple");
    if (button) spawnRipple(button, event);
  });
}

/* -----------------------------------------------------------------
   DEMO BUTTON WIRING
   Each button simulates an event a real lesson/mission/quiz would
   someday trigger by calling the exported functions above.
   ----------------------------------------------------------------- */
function setupDemoButtons() {
  document.querySelectorAll("[data-demo]").forEach((button) => {
    button.addEventListener("click", () => {
      switch (button.dataset.demo) {
        case "mission":
          addXP(20, "mission-complete");
          break;
        case "lesson":
          addXP(60, "lesson-complete");
          recordLessonCompleted();
          break;
        case "quiz":
          addXP(40, "perfect-quiz");
          unlockBadge("perfect-score");
          break;
        case "login":
          addXP(10, "daily-login");
          break;
        case "coins":
          addCoins(25, "مكافأة عملات");
          break;
        case "badge": {
          const locked = badges.find((b) => !b.unlocked);
          if (locked) {
            unlockBadge(locked.id);
          } else {
            enqueuePopup({ icon: "🎉", title: "كل الشارات مفتوحة!", detail: "" });
          }
          break;
        }
        default:
          break;
      }
    });
  });

  document.getElementById("levelUpCloseBtn")?.addEventListener("click", closeLevelUp);
}

/* -----------------------------------------------------------------
   STUDENT DASHBOARD — SUBJECTS PROGRESS + CERTIFICATES
   Only used on gamification.html (both guard on their container
   existing, same pattern as renderProfileCard() above).
   ----------------------------------------------------------------- */
const DASHBOARD_SUBJECTS = [
  { id: "science", name: "عالم العلوم", icon: "🧪" },
  { id: "math", name: "عالم الرياضيات", icon: "➗" },
  { id: "english", name: "عالم اللغة الإنجليزية", icon: "🇬🇧" },
  { id: "arabic", name: "عالم اللغة العربية", icon: "📖" },
  { id: "social", name: "عالم الدراسات الاجتماعية", icon: "🌍" },
];

function renderSubjectsProgress() {
  const grid = document.getElementById("subjectsProgressGrid");
  if (!grid) return;

  const allProgress = typeof Progress !== "undefined" ? Progress.getAllProgress() : {};

  grid.innerHTML = DASHBOARD_SUBJECTS.map((subject) => {
    const p = allProgress[subject.id] || { completedLessons: [], totalLessons: 0 };
    const pct = p.totalLessons ? Math.min(100, Math.round((p.completedLessons.length / p.totalLessons) * 100)) : 0;
    return `
      <a href="units.html?world=${subject.id}" class="subject-progress-card">
        <span class="subject-progress-card__icon">${subject.icon}</span>
        <div class="subject-progress-card__body">
          <strong>${subject.name}</strong>
          <div class="subject-progress-card__bar"><span style="width:${pct}%"></span></div>
          <span class="subject-progress-card__pct">${pct}% مكتمل</span>
        </div>
      </a>`;
  }).join("");
}

function renderCertificatesList() {
  const grid = document.getElementById("certificatesGrid");
  if (!grid) return;

  let certs = {};
  try {
    const raw = window.localStorage.getItem("eduverse:certificates");
    certs = raw ? JSON.parse(raw) : {};
  } catch {
    certs = {};
  }

  const entries = Object.values(certs).sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt));

  if (!entries.length) {
    grid.innerHTML = `<p class="certificates-empty">أكمل أول درس بنسبة 100% لتحصل على شهادتك الأولى! 🎓</p>`;
    return;
  }

  grid.innerHTML = entries
    .map(
      (c) => `
      <div class="certificate-mini-card">
        <span class="certificate-mini-card__icon">🎓</span>
        <strong>${c.lessonName}</strong>
        <span>${c.subject}</span>
        <span class="certificate-mini-card__date">${c.completionDate}</span>
      </div>`
    )
    .join("");
}


function initGamificationPage() {
  renderProfileCard();
  renderLevelCard();
  renderBadgeGrid();
  renderSubjectsProgress();
  renderCertificatesList();
  if (typeof renderLeaderboardPreview === "function") renderLeaderboardPreview();
  setupDemoButtons();
  setupRippleDelegation();
}

document.addEventListener("DOMContentLoaded", initGamificationPage);
